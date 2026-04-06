import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      revenueByDay,
      ordersByStatus,
      topProducts,
      customerGrowth,
      totals,
    ] = await Promise.all([
      // Revenue by day (last 30 days)
      prisma.$queryRawUnsafe<Array<{ day: string; revenue: number; count: number }>>(
        `SELECT 
          TO_CHAR("createdAt", 'YYYY-MM-DD') as day,
          COALESCE(SUM(total), 0)::float as revenue,
          COUNT(*)::int as count
        FROM "Order"
        WHERE "createdAt" >= $1
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
        ORDER BY day ASC`,
        thirtyDaysAgo
      ),

      // Orders by status
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Top products by order count
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),

      // Customer growth (last 30 days)
      prisma.$queryRawUnsafe<Array<{ day: string; count: number }>>(
        `SELECT 
          TO_CHAR("createdAt", 'YYYY-MM-DD') as day,
          COUNT(*)::int as count
        FROM "User"
        WHERE "createdAt" >= $1 AND role = 'customer'
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
        ORDER BY day ASC`,
        thirtyDaysAgo
      ),

      // Overall totals
      Promise.all([
        prisma.order.aggregate({ _sum: { total: true }, _count: { id: true } }),
        prisma.user.count({ where: { role: "customer" } }),
        prisma.product.count(),
        prisma.order.aggregate({
          _sum: { total: true },
          _count: { id: true },
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),
      ]),
    ]);

    // Enrich top products with names
    const productIds = topProducts.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const enrichedTopProducts = topProducts.map((item) => ({
      name: productMap.get(item.productId)?.name || "Unknown",
      slug: productMap.get(item.productId)?.slug || "",
      totalQuantity: item._sum.quantity || 0,
      orderCount: item._count.id,
    }));

    const statusDistribution = ordersByStatus.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    // Fill in missing days for revenue chart
    const revenueMap = new Map(revenueByDay.map((r) => [r.day, r]));
    const filledRevenue = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = date.toISOString().slice(0, 10);
      const existing = revenueMap.get(dayStr);
      filledRevenue.push({
        day: dayStr,
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: existing?.revenue || 0,
        count: existing?.count || 0,
      });
    }

    // Fill in missing days for customer growth
    const growthMap = new Map(customerGrowth.map((g) => [g.day, g.count]));
    const filledGrowth = [];
    let cumulative = 0;
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = date.toISOString().slice(0, 10);
      const dayCount = growthMap.get(dayStr) || 0;
      cumulative += dayCount;
      filledGrowth.push({
        day: dayStr,
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        newCustomers: dayCount,
        cumulative,
      });
    }

    return NextResponse.json({
      revenue: filledRevenue,
      statusDistribution,
      topProducts: enrichedTopProducts,
      customerGrowth: filledGrowth,
      totals: {
        totalRevenue: totals[0]._sum.total || 0,
        totalOrders: totals[0]._count.id,
        totalCustomers: totals[1],
        totalProducts: totals[2],
        recentRevenue: totals[3]._sum.total || 0,
        recentOrders: totals[3]._count.id,
      },
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

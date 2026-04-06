"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format, isSameDay } from "date-fns";

export type RevenueData = {
  date: string;
  revenue: number;
  orders: number;
};

export async function getAnalyticsData() {
  try {
    const now = new Date();
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(now, 29 - i);
      return format(date, "MMM dd");
    });

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: subDays(now, 30),
        },
        status: { not: "cancelled" },
      },
      select: {
        total: true,
        createdAt: true,
        currency: true,
      },
    });

    // Group by day
    const dailyData: RevenueData[] = last30Days.map((dayLabel) => {
      const dayOrders = orders.filter((o) => format(o.createdAt, "MMM dd") === dayLabel);
      const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
      return {
        date: dayLabel,
        revenue,
        orders: dayOrders.length,
      };
    });

    // Status distribution
    const statusCounts = await prisma.order.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    // Top products
    const topItems = await prisma.orderItem.findMany({
      take: 5,
      include: {
        product: {
          select: { name: true }
        }
      },
      orderBy: {
        quantity: "desc",
      }
    });

    const productSales = topItems.map(item => ({
      name: item.product.name,
      value: item.quantity
    }));

    const activeSessionsCount = await (prisma as any).session.count({
      where: { expires: { gte: now } }
    });
    const totalUsersCount = await prisma.user.count();

    const settings = await prisma.siteSettings.findUnique({ where: { id: "global" } });

    return {
      dailyData,
      statusData: statusCounts.map((s) => ({ name: s.status, value: s._count.id })),
      productSales,
      currency: settings?.currency || "USD",
      totals: {
        revenue: orders.reduce((sum, o) => sum + o.total, 0),
        orders: orders.length,
        avgOrder: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0,
        activeUsers: activeSessionsCount,
        totalUsers: totalUsersCount
      }
    };
  } catch (error) {
    console.error("Analytics error:", error);
    return null;
  }
}

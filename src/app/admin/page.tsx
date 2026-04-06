import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Settings, ShoppingBag, TrendingUp, Users, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default async function AdminDashboard() {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/en-US/auth/login");

  const [userCount, orderCount, productCount, totalRevenue, ticketCount, recentOrders, settings] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.product.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.supportSession.count({ where: { status: "human_needed" } }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.siteSettings.findUnique({ where: { id: "global" } }),
  ]);

  const storeCurrency = settings?.currency || "USD";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Admin Dashboard</h1>
          <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9375rem" }}>Track store performance, support queue, and operations.</p>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
          <Link href="/admin/support" className="btn btn-secondary">
            <MessageSquare size={16} /> Support Portal
          </Link>
          <Link href="/admin/settings" className="btn btn-primary">
            <Settings size={16} /> Settings
          </Link>
        </div>
      </div>

      <div className="admin-stat-grid" style={{ marginBottom: "2rem" }}>
        <div className="stat-card">
          <p className="stat-label">Customers</p>
          <div className="stat-value">{userCount}</div>
          <p className="stat-change">Registered accounts</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Revenue</p>
          <div className="stat-value">{formatCurrency(totalRevenue._sum.total || 0, storeCurrency)}</div>
          <p className="stat-change">Captured order value</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Orders</p>
          <div className="stat-value">{orderCount}</div>
          <p className="stat-change">Across all statuses</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Human Tickets</p>
          <div className="stat-value">{ticketCount}</div>
          <p className={`stat-change ${ticketCount > 0 ? "negative" : "positive"}`}>{ticketCount > 0 ? "Needs attention" : "No pending queue"}</p>
        </div>
      </div>

      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "1.125rem" }}>Recent Orders</h2>
          <Link href="/admin/orders" className="btn btn-tertiary">View all orders</Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td style={{ fontWeight: 700 }}>#{order.id.slice(0, 8).toUpperCase()}</td>
                <td>{order.user?.name || order.user?.email || "Guest"}</td>
                <td style={{ fontWeight: 700 }}>{formatCurrency(order.total, order.currency || storeCurrency)}</td>
                <td>
                  <span className={`badge ${order.status === "delivered" ? "badge-success" : order.status === "pending" ? "badge-warning" : "badge-info"}`}>
                    {order.status}
                  </span>
                </td>
                <td>{order.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-2" style={{ marginTop: "1.5rem" }}>
        <Link href="/admin/analytics" className="admin-card" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: 0 }}>
          <BarChart3 size={18} />
          <div>
            <p style={{ fontWeight: 700 }}>Analytics Dashboard</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>Revenue, growth, and performance charts</p>
          </div>
        </Link>
        <Link href="/admin/products" className="admin-card" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: 0 }}>
          <ShoppingBag size={18} />
          <div>
            <p style={{ fontWeight: 700 }}>Catalog Management</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>{productCount} products in inventory</p>
          </div>
        </Link>
        <Link href="/admin/support" className="admin-card" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: 0 }}>
          <TrendingUp size={18} />
          <div>
            <p style={{ fontWeight: 700 }}>Support Agent Portal</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>Open chats that require human responses</p>
          </div>
        </Link>
      </div>

      <div className="admin-card" style={{ marginTop: "1.5rem", background: "var(--surface-container-low)" }}>
        <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          <Users size={16} /> Logged in as {session.name || session.email}
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>
          Use the left sidebar to jump to Products, Orders, Support, and Store Settings.
        </p>
      </div>
    </div>
  );
}

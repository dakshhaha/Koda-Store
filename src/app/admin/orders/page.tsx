import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminApprovePaymentButton from "@/components/AdminApprovePaymentButton";
import AdminMarkStatusButton from "@/components/AdminMarkStatusButton";
import { formatCurrency, normalizeCurrency } from "@/lib/currency";

export default async function AdminOrders() {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/en-US/auth/login");

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      items: { select: { id: true, quantity: true } },
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "1.5rem" }}>Orders</h1>

      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Gateway</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                const normalizedStatus = order.status.toLowerCase();
                const canApprovePayment = ["failed", "cancelled", "pending"].includes(normalizedStatus);
                const canMarkShipped = ["paid", "pending"].includes(normalizedStatus);
                const canMarkDelivered = ["paid", "shipped"].includes(normalizedStatus);
                const orderCurrency = normalizeCurrency(order.currency);
                return (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500 }}>{order.user?.name || "Guest"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>{order.user?.email || "No email"}</div>
                      </div>
                    </td>
                    <td>{itemCount}</td>
                    <td style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{formatCurrency(order.total, orderCurrency)}</td>
                    <td><span className="badge badge-info">{order.paymentGateway}</span></td>
                    <td>
                      <span className={`badge ${
                        order.status === "paid" || order.status === "delivered" ? "badge-success" :
                        order.status === "shipped" ? "badge-info" :
                        order.status === "cancelled" ? "badge-error" :
                        "badge-warning"
                      }`}>{order.status}</span>
                    </td>
                    <td style={{ color: "var(--on-surface-variant)", fontSize: "0.8125rem" }}>{order.createdAt.toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {canApprovePayment && <AdminApprovePaymentButton orderId={order.id} />}
                        {canMarkShipped && <AdminMarkStatusButton orderId={order.id} status="shipped" />}
                        {canMarkDelivered && <AdminMarkStatusButton orderId={order.id} status="delivered" />}
                        {!canApprovePayment && !canMarkShipped && !canMarkDelivered && (
                          <span style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>No action</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

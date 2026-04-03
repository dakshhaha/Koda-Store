import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, MapPin, Calendar, ArrowLeft, ShoppingBag, MessageSquare, Key, Trash2, Edit2 } from "lucide-react";
import UserEditForm from "./UserEditForm";

export default async function AdminUserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/en-US/auth/login");

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } } },
      },
      supportSessions: {
        orderBy: { updatedAt: "desc" },
        take: 10,
      },
      reviews: {
        include: { product: true },
      },
    },
  });

  if (!user) return notFound();

  return (
    <div>
      <Link href="/admin/users" className="btn btn-tertiary" style={{ marginBottom: "2rem", display: "inline-flex", gap: "0.5rem" }}>
        <ArrowLeft size={16} /> Back to Users
      </Link>

      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "2rem", alignItems: "start" }}>
        {/* Main Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* User Edit Form */}
          <div className="admin-card">
            <h2 style={{ fontSize: "1.125rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Edit2 size={18} /> Edit User Details
            </h2>
            <UserEditForm user={user} />
          </div>

          {/* Orders */}
          <div className="admin-card">
            <h2 style={{ fontSize: "1.125rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShoppingBag size={18} /> Orders ({user.orders.length})
            </h2>
            {user.orders.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>No orders yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {user.orders.map((order) => (
                  <div key={order.id} style={{ padding: "0.75rem", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>#{order.id.substring(0, 8).toUpperCase()}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>
                        {order.items.map((item) => `${item.product.name} (x${item.quantity})`).join(", ")}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 800 }}>${order.total.toFixed(2)}</p>
                      <span className={`badge ${order.status === "paid" || order.status === "delivered" ? "badge-success" : order.status === "cancelled" ? "badge-error" : "badge-warning"}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Support Sessions */}
          <div className="admin-card">
            <h2 style={{ fontSize: "1.125rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MessageSquare size={18} /> Support Sessions ({user.supportSessions.length})
            </h2>
            {user.supportSessions.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>No support sessions.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {user.supportSessions.map((s) => (
                  <Link key={s.id} href={`/admin/support/${s.id}`} style={{ padding: "0.75rem", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.8125rem" }}>Session #{s.id.substring(0, 8).toUpperCase()}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>
                        {new Date(s.updatedAt).toLocaleDateString()} · {s.status.replace("_", " ")}
                      </p>
                    </div>
                    <span className={`badge ${s.status === "resolved" ? "badge-success" : s.status === "human_needed" ? "badge-warning" : "badge-info"}`}>
                      {s.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="admin-card">
            <h3 style={{ fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "1.25rem" }}>Profile</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--primary-container)", color: "var(--on-primary-container)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={24} />
                </div>
                <div>
                  <p style={{ fontWeight: 700 }}>{user.name || "No name"}</p>
                  <span className={`badge ${user.role === "admin" ? "badge-error" : user.role === "support" ? "badge-info" : "badge-warning"}`}>{user.role}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}>
                <Mail size={14} /> {user.email}
              </div>
              {user.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}>
                  <Phone size={14} /> {user.phone}
                </div>
              )}
              {(user.city || user.country) && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}>
                  <MapPin size={14} /> {[user.city, user.state, user.zip, user.country].filter(Boolean).join(", ")}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>
                <Calendar size={14} /> Joined {user.createdAt.toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h3 style={{ fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "1.25rem" }}>Addresses ({user.addresses.length})</h3>
            {user.addresses.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>No saved addresses.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {user.addresses.map((addr) => (
                  <div key={addr.id} style={{ padding: "0.75rem", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem" }}>
                    <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{addr.type} {addr.isDefault && "(Default)"}</p>
                    <p style={{ color: "var(--on-surface-variant)" }}>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}</p>
                    <p style={{ color: "var(--on-surface-variant)" }}>{addr.city}, {addr.state} {addr.zip}, {addr.country}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-card">
            <h3 style={{ fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "1.25rem" }}>Reviews ({user.reviews.length})</h3>
            {user.reviews.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>No reviews yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {user.reviews.map((review) => (
                  <div key={review.id} style={{ padding: "0.5rem", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem" }}>
                    <p style={{ fontWeight: 600 }}>{review.product.name}</p>
                    <p>Rating: {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                    {review.comment && <p style={{ color: "var(--on-surface-variant)" }}>{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

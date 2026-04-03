import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, MapPin, Calendar, Edit2, Trash2, Key, ShoppingBag, MessageSquare } from "lucide-react";

export default async function AdminUsers() {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/en-US/auth/login");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      city: true,
      country: true,
      createdAt: true,
      _count: {
        select: { orders: true, supportSessions: true },
      },
    },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <User /> User Management
          </h1>
          <p style={{ color: "var(--on-surface-variant)", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            View, edit, and manage all registered users.
          </p>
        </div>
        <div className="badge badge-info">{users.length} total users</div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Location</th>
                <th>Orders</th>
                <th>Sessions</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--primary-container)", color: "var(--on-primary-container)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <User size={14} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.name || "No name"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.8125rem" }}>
                      {user.phone && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Phone size={12} /> {user.phone}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--on-surface-variant)" }}>
                        <Mail size={12} /> {user.email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${user.role === "admin" ? "badge-error" : user.role === "support" ? "badge-info" : "badge-warning"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>
                    {user.city && user.country ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <MapPin size={12} /> {user.city}, {user.country}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>{user._count.orders}</td>
                  <td style={{ textAlign: "center" }}>{user._count.supportSessions}</td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Calendar size={12} /> {user.createdAt.toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      <Link href={`/admin/users/${user.id}`} className="btn btn-tertiary" style={{ padding: "0.35rem 0.5rem", fontSize: "0.75rem" }}>
                        <Edit2 size={12} /> Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

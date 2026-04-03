import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { User, MapPin, Phone, Mail, ArrowLeft } from "lucide-react";
import AdminChatInterface from "./AdminChatInterface";

export default async function AdminSupportSessionPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "support")) {
    return redirect(`/en-US/auth/login?redirect=${encodeURIComponent(`/admin/support/${id}`)}`);
  }

  const supportSession = await prisma.supportSession.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
            take: 5
          },
          addresses: true
        }
      }
    }
  });

  if (!supportSession) return notFound();

  const user = supportSession.user;
  const messages = JSON.parse(supportSession.messages || "[]");

  return (
    <div className="container section">
      <Link href="/admin/support" className="btn btn-tertiary" style={{ marginBottom: '2rem', display: 'inline-flex', gap: '0.5rem' }}>
        <ArrowLeft size={16} /> Back to Tickets
      </Link>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '3rem', alignItems: 'start' }}>
        {/* Chat Main Area */}
        <div style={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
          <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="user-profile-badge" style={{ width: '40px', height: '40px', justifyContent: 'center' }}>
                <User size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.125rem' }}>Chat with {user?.name || "Guest"}</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Status: {supportSession.status.replace("_", " ")}</p>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
            <AdminChatInterface 
              sessionId={id} 
              initialMessages={messages} 
              user={user}
              orders={user?.orders || []}
            />
          </div>
        </div>

        {/* Sidebar: User Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="admin-card">
            <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Customer Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)' }}>
                  <User size={18} style={{ color: 'var(--primary)' }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{user?.name || "Guest Account"}</p>
                    <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>ID: {user?.id.substring(0,8) || "N/A"}</p>
                  </div>
               </div>

               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontVariantNumeric: 'tabular-nums' }}>
                  <Mail size={16} /> <span style={{ fontSize: '0.8125rem' }}>{user?.email || "No email"}</span>
               </div>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Phone size={16} /> <span style={{ fontSize: '0.8125rem' }}>{user?.phone || "No phone"}</span>
               </div>

               <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <MapPin size={16} style={{ marginTop: '0.25rem' }} /> 
                  <span style={{ fontSize: '0.8125rem' }}>{user?.address}, {user?.city}, {user?.zip}, {user?.country}</span>
               </div>
            </div>
          </div>

          <div className="admin-card">
             <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Recent Orders</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {user?.orders.map(order => (
                   <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', padding: '0.75rem', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <p style={{ fontWeight: 700 }}>#{order.id.substring(0,8).toUpperCase()}</p>
                        <p style={{ opacity: 0.7, fontSize: '0.6875rem' }}>{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 800 }}>${order.total.toFixed(2)}</p>
                        <span style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem', borderRadius: '4px', background: 'var(--surface-container-high)' }}>{order.status}</span>
                      </div>
                   </div>
                ))}
                {user?.orders.length === 0 && <p style={{ fontSize: '0.8125rem', opacity: 0.5 }}>No orders yet.</p>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Truck, CheckCircle, ChevronRight, AlertCircle } from "lucide-react";
import PayOnlineButton from "@/components/PayOnlineButton";
import { formatCurrency, normalizeCurrency } from "@/lib/currency";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) return redirect(`/${locale}/auth/login`);

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } }
  });

  const activeOrders = orders.filter(order => order.status.toLowerCase() !== "cancelled");
  const cancelledOrders = orders.filter(order => order.status.toLowerCase() === "cancelled");

  return (
    <div className="container section">
      <h1 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Order History</h1>

      {activeOrders.length === 0 && cancelledOrders.length === 0 ? (
        <div className="empty-state">
          <Clock size={48} style={{ color: 'var(--on-surface-variant)', marginBottom: '1.5rem' }} />
          <h2>You haven&apos;t placed any orders yet.</h2>
          <p>Start shopping our collections to see your orders here.</p>
          <Link href={`/${locale}/products`} className="btn btn-primary" style={{ marginTop: '2rem' }}>Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           {activeOrders.map((order, i) => {
              const normalizedStatus = order.status.toLowerCase();
              const canPayOnline = ["pending", "failed"].includes(normalizedStatus);
              const isCodOrder = order.paymentGateway === "cod";
              const orderCurrency = normalizeCurrency(order.currency);
              const statusColor = order.status === 'delivered' ? '#16a34a' : order.status === 'shipped' ? '#2563eb' : '#d97706';
              const statusIcon = order.status === 'delivered' ? <CheckCircle size={14} /> : order.status === 'shipped' ? <Truck size={14} /> : <Clock size={14} />;

              return (
                <div key={order.id} className="admin-card animate-in" style={{ animationDelay: `${i * 0.1}s`, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '2rem', alignItems: 'center' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem' }}>Order #{order.id.substring(0, 8).toUpperCase()}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{order.createdAt.toLocaleDateString()}</span>
                          <span className="badge" style={{ backgroundColor: `${statusColor}20`, color: statusColor, padding: '0.25rem 0.75rem', fontSize: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                             {statusIcon} {order.status.toUpperCase()}
                          </span>
                       </div>
                       
                       <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                         {order.items.map(item => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-container-low)', padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.75rem' }}>
                               <span>{item.product.name} (x{item.quantity})</span>
                            </div>
                         ))}
                       </div>
                   </div>

                   <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                      <div style={{ textAlign: 'right' }}>
                         <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '0.25rem' }}>Total Amount</p>
                         <p style={{ fontWeight: 800, fontSize: '1.25rem' }}>{formatCurrency(order.total, orderCurrency, locale)}</p>
                         <p style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginTop: '0.35rem' }}>
                           Payment: {order.paymentGateway.toUpperCase()} ({orderCurrency})
                         </p>
                         {canPayOnline && isCodOrder && (
                           <p style={{ fontSize: '0.6875rem', color: '#854d00', fontWeight: 700, marginTop: '0.25rem' }}>
                             COD selected. Pay online now to speed up fulfillment.
                           </p>
                         )}
                      </div>

                      <div style={{ display: 'grid', gap: '0.625rem', justifyItems: 'end' }}>
                        <Link href={`/${locale}/orders/${order.id}/track`} className="btn btn-secondary" style={{ padding: '0.625rem 1rem' }}>
                           View Details <ChevronRight size={16} />
                        </Link>
                        {canPayOnline && <PayOnlineButton orderId={order.id} locale={locale} compact />}
                      </div>
                   </div>
                </div>
              );
           })}

          {cancelledOrders.length > 0 && (
            <details style={{ marginTop: '2rem' }}>
              <summary style={{ cursor: 'pointer', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface-variant)', padding: '0.75rem 0', borderBottom: '1px solid var(--outline-variant)', marginBottom: '1rem' }}>
                Cancelled Orders ({cancelledOrders.length})
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {cancelledOrders.map((order, i) => {
                  const orderCurrency = normalizeCurrency(order.currency);
                  return (
                    <div key={`cancelled-${order.id}`} className="admin-card" style={{ opacity: 0.7, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '1.5rem', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem' }}>Order #{order.id.substring(0, 8).toUpperCase()}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{order.createdAt.toLocaleDateString()}</span>
                          <span className="badge badge-error">{order.status.toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                          {order.items.map(item => (
                            <span key={item.id} style={{ fontSize: '0.75rem', background: 'var(--surface-container-low)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                              {item.product.name} (x{item.quantity})
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 800, fontSize: '1.125rem' }}>{formatCurrency(order.total, orderCurrency, locale)}</p>
                        <Link href={`/${locale}/orders/${order.id}/track`} style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>View details</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Support CTA */}
      <div className="admin-card spotlight-card animate-in" style={{ marginTop: '4rem', padding: '3rem', textAlign: 'center', background: 'var(--surface-container-low)', border: '1px dashed var(--outline-variant)' }}>
         <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Need help with your order?</h3>
         <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Our AI and Support Agents are available to assist with any order or delivery inquiries.
         </p>
         <button className="btn btn-tertiary" style={{ display: 'inline-flex', gap: '0.5rem' }}>
            <AlertCircle size={16} /> Contact Support
         </button>
      </div>
    </div>
  );
}

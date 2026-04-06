import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/currency";
import QRCode from "qrcode";
import { Package, Truck, CheckCircle2, Clock, MapPin, QrCode, Share2 } from "lucide-react";
import Link from "next/link";

export default async function PublicTrackingPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id: orderId, locale } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true }
      },
      user: {
        select: { name: true }
      }
    }
  });

  if (!order) {
    return notFound();
  }

  // Generate QR Code for the current tracking URL
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://koda-store.vercel.app'}/${locale}/track/${order.id}`;
  const qrCodeDataUrl = await QRCode.toDataURL(publicUrl, {
    margin: 2,
    scale: 8,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  const statusSteps = [
    { label: "Ordered", status: "pending", icon: Clock },
    { label: "Processing", status: "processing", icon: Package },
    { label: "Shipped", status: "shipped", icon: Truck },
    { label: "Delivered", status: "delivered", icon: CheckCircle2 },
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.status === order.status);
  
  return (
    <div className="container section" style={{ maxWidth: '900px' }}>
      <div className="card animate-in" style={{ padding: '2.5rem', marginBottom: '2rem', border: '1px solid var(--outline-variant)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <span className="card-meta" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>Live Tracking</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-muted">Placed on {order.createdAt.toLocaleDateString(locale, { dateStyle: 'long' })}</p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
             <div style={{ 
               background: 'var(--primary-container)', 
               color: 'var(--on-primary-container)',
               padding: '0.5rem 1rem',
               borderRadius: 'var(--radius-full)',
               fontSize: '0.875rem',
               fontWeight: 600,
               textTransform: 'uppercase',
               display: 'inline-block'
             }}>
               {order.status}
             </div>
          </div>
        </div>

        {/* PROGRESS TRACKER */}
        <div style={{ marginTop: '4rem', marginBottom: '4rem', position: 'relative' }}>
          <div style={{ 
            position: 'absolute', 
            top: '24px', 
            left: '0', 
            right: '0', 
            height: '2px', 
            background: 'var(--outline-variant)',
            zIndex: 0
          }} />
          <div style={{ 
            position: 'absolute', 
            top: '24px', 
            left: '0', 
            width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`, 
            height: '2px', 
            background: 'var(--primary)',
            zIndex: 0,
            transition: 'width 1s ease-in-out'
          }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            {statusSteps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              
              return (
                <div key={step.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '50%', 
                    background: isActive ? 'var(--primary)' : 'var(--surface-container-highest)', 
                    color: isActive ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.75rem',
                    boxShadow: isCurrent ? '0 0 0 4px var(--primary-container)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <Icon size={20} />
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                    textAlign: 'center'
                  }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px', gap: '3rem', borderTop: '1px solid var(--outline-variant)', paddingTop: '2.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Shipping Details</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ padding: '0.75rem', background: 'var(--surface-container-low)', borderRadius: '12px' }}>
                <MapPin size={24} className="text-primary" />
              </div>
              <div>
                <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{order.user.name}</p>
                <p className="text-muted" style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                  {order.shippingAddress || 'No shipping address provided'}
                </p>
                {order.trackingNumber && (
                   <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--surface-container-lowest)', borderRadius: '8px', border: '1px dashed var(--outline-variant)' }}>
                     <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>Courier tracking number</p>
                     <p style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}>{order.trackingNumber}</p>
                     {order.trackingUrl && (
                       <a href={order.trackingUrl} target="_blank" rel="noopener" className="link-primary" style={{ fontSize: '0.875rem', marginTop: '0.5rem', display: 'inline-block' }}>
                        Track on Courier Site &rarr;
                       </a>
                     )}
                   </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div className="card" style={{ padding: '1rem', background: 'white' }}>
              <img src={qrCodeDataUrl} alt="Order QR Code" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            <p style={{ fontSize: '0.75rem', marginTop: '0.75rem' }} className="text-muted">Scan to track on mobile</p>
            <button className="btn btn-secondary w-full" style={{ marginTop: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
               <Share2 size={14} />
               Share Status
            </button>
          </div>
        </div>
      </div>

      {/* ITEMS SUMMARY */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Order Summary</h3>
      <div className="card" style={{ padding: '1.5rem' }}>
        {order.items.map((item, i) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: i > 0 ? '1rem 0' : '0 0 1rem 0', borderTop: i > 0 ? '1px solid var(--outline-variant)' : 'none' }}>
             <div style={{ display: 'flex', gap: '1rem' }}>
               <div style={{ width: '60px', height: '60px', background: 'var(--surface-container)', borderRadius: '8px', overflow: 'hidden' }}>
                 <img src={(item.product.images as string[])[0] || "/placeholder.png"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               </div>
               <div>
                 <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.product.name}</p>
                 <p style={{ fontSize: '0.75rem' }} className="text-muted">Quantity: {item.quantity}</p>
               </div>
             </div>
             <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatCurrency(item.price * item.quantity, order.currency, locale)}</p>
          </div>
        ))}
        
        <div style={{ marginTop: '1rem', borderTop: '2px solid var(--outline-variant)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <p style={{ fontWeight: 600 }}>Total Paid</p>
           <p style={{ fontWeight: 700, fontSize: '1.25rem' }}>{formatCurrency(order.total, order.currency, locale)}</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <Link href={`/${locale}/`} className="btn btn-primary">Back to Store</Link>
      </div>
    </div>
  );
}

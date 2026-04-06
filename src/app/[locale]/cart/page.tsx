"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { useParams } from "next/navigation";
import { convertUsdToCurrency, currencyFromLocale, formatCurrency, normalizeCurrency } from "@/lib/currency";

export default function CartPage() {
  const { cart, removeFromCart, addToCart, cartTotal } = useCart();
  const { locale } = useParams() as { locale: string };
  const currency = normalizeCurrency(currencyFromLocale(locale));
  const money = (amountUsd: number) => formatCurrency(convertUsdToCurrency(amountUsd, currency), currency, locale);

  if (cart.length === 0) {
    return (
      <div className="container section empty-state">
        <ShoppingBag size={64} style={{ color: 'var(--on-surface-variant)', marginBottom: '1.5rem', opacity: 0.3 }} />
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Your cart is empty.</h2>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2.5rem' }}>Start shopping our latest collections.</p>
        <Link href={`/${locale}/products`} className="btn btn-primary btn-lg">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Shopping Cart</h1>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '3rem', alignItems: 'start' }}>
        {/* Cart Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {cart.map(item => (
            <div key={item.id} className="admin-card animate-in" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <div style={{ width: '120px', aspectRatio: '1/1', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--surface-container-low)', flexShrink: 0 }}>
                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{item.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>{money(item.price)}</p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-full)', padding: '0.25rem' }}>
                      <button className="btn btn-tertiary" style={{ padding: '0.25rem', minWidth: 'auto' }} onClick={() => addToCart(item as unknown as Record<string, unknown>, -1)} disabled={item.quantity <= 1}><Minus size={14} /></button>
                      <span style={{ width: '30px', textAlign: 'center', fontWeight: 700, fontSize: '0.875rem' }}>{item.quantity}</span>
                      <button className="btn btn-tertiary" style={{ padding: '0.25rem', minWidth: 'auto' }} onClick={() => addToCart(item as unknown as Record<string, unknown>, 1)}><Plus size={14} /></button>
                   </div>
                   <button className="btn btn-tertiary" style={{ color: 'var(--error)', fontSize: '0.75rem' }} onClick={() => removeFromCart(item.id)}>
                      <Trash2 size={14} /> Remove
                   </button>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 800, fontSize: '1.25rem' }}>{money(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Sidebar */}
        <div className="admin-card animate-in" style={{ animationDelay: '0.1s', position: 'sticky', top: '6rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Order Summary</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--on-surface-variant)' }}>Subtotal</span>
              <span style={{ fontWeight: 700 }}>{money(cartTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
               <span style={{ color: 'var(--on-surface-variant)' }}>Shipping</span>
               <span style={{ color: '#16a34a', fontWeight: 700 }}>Free</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
             <span style={{ fontWeight: 700 }}>Total</span>
             <span style={{ fontWeight: 800, fontSize: '1.5rem' }}>{money(cartTotal)}</span>
          </div>

          <Link href={`/${locale}/checkout`} className="btn btn-primary btn-lg" style={{ width: '100%', height: '3.5rem' }}>
             Proceed to Checkout <ArrowRight size={18} />
          </Link>

          <p style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', textAlign: 'center', marginTop: '1.5rem' }}>
             Secure payment powered by encrypted gateways.
          </p>
        </div>
      </div>
    </div>
  );
}

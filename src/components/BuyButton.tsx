"use client";

import { useCart } from "@/context/CartContext";
import { ShoppingCart, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BuyButton({ product, locale }: { product: any, locale: string }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();

  const handleAddToCart = () => {
    setLoading(true);
    addToCart(product, quantity);
    setAdded(true);
    setLoading(false);
    setTimeout(() => setAdded(false), 3000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push(`/${locale}/checkout`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1rem' }}>
        <select 
          className="btn btn-secondary" 
          style={{ height: '3.5rem', fontSize: '1rem', borderRadius: 'var(--radius-md)', padding: '0 1rem' }}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 10].map(q => <option key={q} value={q}>{q}</option>)}
        </select>
        
        <button 
          className="btn btn-primary btn-lg" 
          style={{ height: '3.5rem', fontSize: '1rem', fontWeight: 700 }}
          onClick={handleBuyNow}
        >
          <ShoppingCart size={20} /> Buy Now
        </button>
      </div>
      
      <button 
        className={`btn ${added ? 'btn-secondary' : 'btn-tertiary'}`} 
        style={{ width: '100%', height: '3.5rem', border: added ? 'none' : '1px solid var(--outline-variant)' }}
        onClick={handleAddToCart}
        disabled={loading}
      >
        {added ? <><CheckCircle size={18} /> Added to Cart</> : "Add to Cart"}
      </button>
    </div>
  );
}

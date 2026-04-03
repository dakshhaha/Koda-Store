"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare, Plus, Loader2, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function ProductReviewSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: "" });
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/products/reviews?productId=${productId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setReviews(data);
        setLoading(false);
      });
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/products/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, ...form })
      });
      if (res.ok) {
        const newReview = await res.json();
        setReviews([newReview, ...reviews]);
        setForm({ rating: 5, comment: "" });
        setShowForm(false);
      } else {
        alert("Authorization failed. Ensure you are logged in to curate feedback.");
      }
    } finally { setSubmitting(false); }
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div style={{ marginTop: '4rem', paddingTop: '4rem', borderTop: '1px solid var(--outline-variant)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <MessageSquare size={20} /> Curator Feedback
        </h2>
        {!showForm && (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Contribute Perspective
          </button>
        )}
      </div>

      {showForm && (
        <div className="admin-card animate-in" style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Your Perspective</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Rating (1-5)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map(star => (
                   <button 
                     type="button" 
                     key={star} 
                     onClick={() => setForm({...form, rating: star})}
                     style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                   >
                     <Star size={24} fill={star <= form.rating ? "var(--primary)" : "none"} color={star <= form.rating ? "var(--primary)" : "var(--outline)"} />
                   </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Observations</label>
              <textarea 
                placeholder="Share your experience with the craftsmanship..." 
                value={form.comment} 
                onChange={e => setForm({...form, comment: e.target.value})}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Sharing..." : "Commit Feedback"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-2">
        {reviews.map((rev, i) => (
          <div key={rev.id} className="admin-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={14} fill={star <= rev.rating ? "var(--primary)" : "none"} color={star <= rev.rating ? "var(--primary)" : "var(--outline)"} />
              ))}
            </div>
            <p style={{ fontStyle: 'italic', color: 'var(--on-surface-variant)', fontSize: '0.9375rem', marginBottom: '1rem' }}>&quot;{rev.comment}&quot;</p>
            <p style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>— {rev.user.name}</p>
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
         <div className="empty-state" style={{ background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)' }}>
            <p>No feedback curations yet for this piece. Be the first to observe.</p>
         </div>
      )}
    </div>
  );
}

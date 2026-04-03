"use client";

import { useEffect, useState } from "react";
import { Plus, Trash, Ticket } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrder: number;
  active: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrder, setMinOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (res.ok) setCoupons(data);
    } catch {}
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          description,
          discountType,
          discountValue: Number(discountValue),
          minOrder: Number(minOrder),
          active: true,
        }),
      });

      if (res.ok) {
        setIsCreating(false);
        setCode("");
        setDescription("");
        setDiscountValue(10);
        setMinOrder(0);
        fetchCoupons();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create coupon");
      }
    } catch (e) {
      alert("Error creating coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to completely delete this coupon?")) return;
    try {
      await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
      fetchCoupons();
    } catch {}
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Coupons</h1>
          <p className="section-subtitle">Manage store discount codes and offers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {isCreating && (
        <form className="admin-card validate" onSubmit={handleCreate}>
          <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>Create New Coupon</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Coupon Code</label>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER10" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. 10% off summer sale" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Discount Type</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Discount Value</label>
              <input type="number" min="1" step="any" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Minimum Order Amount ($)</label>
              <input type="number" min="0" step="any" value={minOrder} onChange={e => setMinOrder(Number(e.target.value))} required />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Coupon"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)} disabled={saving}>Cancel</button>
          </div>
        </form>
      )}

      <div className="admin-card">
        {loading ? (
          <p>Loading...</p>
        ) : coupons.length === 0 ? (
          <div className="empty-state">
            <Ticket size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>No coupons have been created yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', letterSpacing: '1px' }}>{c.code}</td>
                    <td>{c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}</td>
                    <td>${c.minOrder}</td>
                    <td>
                      <span className="badge" style={{ background: c.active ? '#16a34a20' : '#ba1a1a20', color: c.active ? '#16a34a' : '#ba1a1a' }}>
                        {c.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-tertiary" style={{ color: 'var(--error)' }} onClick={() => handleDelete(c.id)}>
                        <Trash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

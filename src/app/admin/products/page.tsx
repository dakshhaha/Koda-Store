"use client";

import { useEffect, useState } from "react";
import { prisma } from "@/lib/prisma";
import { Plus, Edit, Trash2, Loader2, PackageOpen, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: string;
  category?: { name: string } | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        alert("Failed to delete product.");
      }
    } catch (err) {
      alert("Error deleting product.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}><Loader2 className="animate-spin" size={32} /></div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em" }}>Catalog Management</h1>
          <p style={{ color: "var(--on-surface-variant)", fontSize: "0.95rem" }}>Review inventory and manage product details.</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary" style={{ padding: "0.8rem 1.5rem", borderRadius: "12px", fontWeight: 700 }}>
          <Plus size={18} /> Add New Entry
        </Link>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: "hidden", borderRadius: "16px", border: "1px solid var(--outline-variant)" }}>
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--surface-container-low)" }}>
            <tr>
              <th style={{ textAlign: "left", padding: "1.25rem" }}>Product Detail</th>
              <th style={{ textAlign: "left" }}>Category</th>
              <th style={{ textAlign: "left" }}>Price</th>
              <th style={{ textAlign: "left" }}>Stock</th>
              <th style={{ textAlign: "left" }}>Status</th>
              <th style={{ textAlign: "right", paddingRight: "1.25rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const images = JSON.parse(product.images || "[]") as string[];
              return (
                <tr key={product.id} style={{ borderTop: "1px solid var(--outline-variant)", transition: "background 0.2s" }} className="hover-row">
                  <td style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "10px", overflow: "hidden", background: "var(--surface-container-low)", flexShrink: 0, border: "1px solid var(--outline-variant)" }}>
                      <img src={images[0] || "/placeholder.png"} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{product.name}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--on-surface-variant)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                           <ExternalLink size={10} /> /{product.slug}
                        </div>
                    </div>
                  </td>
                  <td style={{ fontSize: "0.9rem" }}>{product.category?.name || "Ungrouped"}</td>
                  <td style={{ fontWeight: 800, color: "var(--primary)" }}>${product.price.toFixed(2)}</td>
                  <td style={{ fontSize: "0.9rem" }}>{product.stock}</td>
                  <td>
                    <span style={{ 
                        padding: "0.35rem 0.65rem", 
                        borderRadius: "8px", 
                        fontSize: "0.75rem", 
                        fontWeight: 900,
                        background: product.stock > 0 ? "#16a34a1a" : "#ba1a1a1a",
                        color: product.stock > 0 ? "#15803d" : "#b91c1c"
                    }}>
                      {product.stock > 0 ? "AVAILABLE" : "OUT OF STOCK"}
                    </span>
                  </td>
                  <td style={{ paddingRight: "1.25rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <Link href={`/admin/products/${product.id}/edit`} className="btn btn-tertiary btn-sm" style={{ width: "36px", height: "36px", borderRadius: "10px" }}>
                         <Edit size={16} />
                      </Link>
                      <button 
                        className="btn btn-tertiary btn-sm" 
                        style={{ width: "36px", height: "36px", borderRadius: "10px", color: "var(--error)" }}
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
                <tr>
                    <td colSpan={6} style={{ padding: "4rem", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "var(--on-surface-variant)" }}>
                            <PackageOpen size={48} strokeWidth={1} />
                            <p style={{ fontWeight: 600 }}>No products found. Start by adding one!</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

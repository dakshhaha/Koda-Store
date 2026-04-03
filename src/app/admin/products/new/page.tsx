"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Loader2, X, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function AdminProductNew() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    salePrice: "",
    stock: "0",
    categoryId: "",
    featured: false,
    images: [] as string[],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch {}
    };
    loadCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, result.url]
        }));
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (err: any) {
      setError("Upload error: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    if (!formData.name || !formData.slug || !formData.price) {
      setError("Name, Slug, and Price are required.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images: JSON.stringify(formData.images),
          price: parseFloat(formData.price) || 0,
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
          stock: parseInt(formData.stock) || 0,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create product.");
      }

      setSuccess("Product created successfully.");
      setTimeout(() => router.push("/admin/products"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/admin/products" className="btn btn-tertiary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ArrowLeft size={16} /> Back
          </Link>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Add New Product</h1>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Creating..." : "Create Product"}
        </button>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem", fontWeight: 700 }}>{error}</div>}
      {success && <div style={{ background: "#dcfce7", color: "#15803d", padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem", fontWeight: 700 }}>{success}</div>}

      <div className="admin-card" style={{ padding: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div className="form-group">
            <label>Product Name</label>
            <input id="name" value={formData.name} onChange={handleChange} placeholder="e.g. Premium Wireless Headphones" />
          </div>
          <div className="form-group">
            <label>URL Slug</label>
            <input id="slug" value={formData.slug} onChange={handleChange} placeholder="e.g. premium-wireless-headphones" />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: "1.5rem" }}>
          <label>Full Description</label>
          <textarea id="description" value={formData.description} onChange={handleChange} rows={5} placeholder="Describe the features, benefits and tech specs..." />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
          <div className="form-group">
            <label>Price ($)</label>
            <input id="price" type="number" step="0.01" value={formData.price} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Sale Price ($)</label>
            <input id="salePrice" type="number" step="0.01" value={formData.salePrice} onChange={handleChange} placeholder="None" />
          </div>
          <div className="form-group">
            <label>In Stock Quantity</label>
            <input id="stock" type="number" value={formData.stock} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
          <div className="form-group">
            <label>Product Category</label>
            <select id="categoryId" value={formData.categoryId} onChange={handleChange}>
              <option value="">Ungrouped</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", alignSelf: "center", marginTop: "1.5rem" }}>
            <input type="checkbox" id="featured" checked={formData.featured} onChange={handleChange} style={{ width: "22px", height: "22px" }} />
            <label htmlFor="featured" style={{ margin: 0, fontWeight: 700 }}>Featured on Homepage</label>
          </div>
        </div>

        {/* Media Management Area */}
        <div style={{ marginTop: "2.5rem" }}>
           <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ImageIcon size={18} /> Product Images
           </h3>
           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {formData.images.map((url, i) => (
                <div key={i} style={{ position: "relative", width: "100%", aspectRatio: "1/1", borderRadius: "10px", overflow: "hidden", background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}>
                   <img src={url} alt={`Upload ${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                   <button onClick={() => removeImage(i)} style={{ position: "absolute", top: "5px", right: "5px", background: "rgba(239, 68, 68, 0.9)", color: "white", border: "none", borderRadius: "50%", padding: "5px", cursor: "pointer" }}>
                      <Trash2 size={14} />
                   </button>
                </div>
              ))}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ aspectRatio: "1/1", border: "2px dashed var(--outline-variant)", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "var(--surface-container-low)", cursor: "pointer", color: "var(--on-surface-variant)" }}
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>{uploading ? "Uploading..." : "Add Image"}</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} hidden accept="image/*" />
           </div>
        </div>
      </div>
    </div>
  );
}

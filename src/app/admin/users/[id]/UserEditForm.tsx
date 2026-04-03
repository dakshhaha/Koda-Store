"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Key, Trash2, Loader2 } from "lucide-react";

interface UserEditFormProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
  };
}

export default function UserEditForm({ user }: UserEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    email: user.email || "",
    name: user.name || "",
    role: user.role || "customer",
    phone: user.phone || "",
    address: user.address || "",
    city: user.city || "",
    state: user.state || "",
    zip: user.zip || "",
    country: user.country || "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ...formData }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update user.");
      }

      setSuccess("User updated successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this user and all their data? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?userId=${user.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user.");
      }
      router.push("/admin/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
      {error && (
        <div style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", background: "#ba1a1a1a", color: "#7f1d1d", fontSize: "0.875rem", fontWeight: 600 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", background: "#16a34a1a", color: "#166534", fontSize: "0.875rem", fontWeight: 600 }}>
          {success}
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input id="name" value={formData.name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={formData.email} onChange={handleChange} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="role">Role</label>
          <select id="role" value={formData.role} onChange={handleChange}>
            <option value="customer">Customer</option>
            <option value="support">Support Agent</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input id="phone" value={formData.phone || ""} onChange={handleChange} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input id="address" value={formData.address || ""} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="city">City</label>
          <input id="city" value={formData.city || ""} onChange={handleChange} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="state">State</label>
          <input id="state" value={formData.state || ""} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="zip">ZIP</label>
          <input id="zip" value={formData.zip || ""} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="country">Country</label>
          <input id="country" value={formData.country || ""} onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="password" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <Key size={14} /> New Password (leave blank to keep current)
        </label>
        <input id="password" type="password" placeholder="Enter new password..." value={formData.password} onChange={handleChange} />
      </div>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {loading ? "Saving..." : "Save Changes"}
        </button>
        {user.role !== "admin" && (
          <button type="button" className="btn btn-secondary" style={{ color: "var(--error)", borderColor: "var(--error)" }} onClick={handleDelete} disabled={loading}>
            <Trash2 size={14} /> Delete User
          </button>
        )}
      </div>
    </form>
  );
}

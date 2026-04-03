"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Bell, Trash2, Plus, Settings, Wrench } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  active: boolean;
  priority: number;
  createdAt: string;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  info: { bg: "#dbeafe", text: "#1e40af", label: "Info" },
  warning: { bg: "#fef3c7", text: "#92400e", label: "Warning" },
  success: { bg: "#d1fae5", text: "#065f46", label: "Success" },
  error: { bg: "#fee2e2", text: "#991b1b", label: "Alert" },
};

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("info");
  const [newPriority, setNewPriority] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsRes, annRes] = await Promise.all([
          fetch("/api/admin/settings"),
          fetch("/api/announcements"),
        ]);

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setMaintenanceMode(data.maintenanceMode || false);
          setMaintenanceMessage(data.maintenanceMessage || "We're currently performing maintenance. Please check back shortly.");
        }

        if (annRes.ok) {
          const data = await annRes.json();
          setAnnouncements(data.announcements || []);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleMaintenance = async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode: !maintenanceMode, maintenanceMessage }),
      });

      if (response.ok) {
        setMaintenanceMode(!maintenanceMode);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to toggle maintenance mode.");
      }
    } catch {
      setError("Failed to toggle maintenance mode.");
    }
  };

  const saveMaintenanceMessage = async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode, maintenanceMessage }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save message.");
      }
    } catch {
      setError("Failed to save message.");
    }
  };

  const createAnnouncement = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          type: newType,
          priority: newPriority,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements((prev) => [data.announcement, ...prev]);
        setNewTitle("");
        setNewContent("");
        setNewType("info");
        setNewPriority(0);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create announcement.");
      }
    } catch {
      setError("Failed to create announcement.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAnnouncement = async (id: string, active: boolean) => {
    try {
      await fetch("/api/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !active }),
      });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, active: !active } : a))
      );
    } catch {
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch {
    }
  };

  if (loading) {
    return <div className="container section"><h2>Loading...</h2></div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "1.5rem" }}>Announcements & Maintenance</h1>

      {error && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem", borderRadius: "var(--radius-md)", background: "#ba1a1a1a", color: "#7f1d1d", fontSize: "0.875rem", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Maintenance Mode */}
      <div className="admin-card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Wrench size={18} /> Maintenance Mode
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <button
            type="button"
            onClick={toggleMaintenance}
            className="btn"
            style={{
              background: maintenanceMode ? "var(--error)" : "var(--surface-container-high)",
              color: maintenanceMode ? "white" : "var(--on-surface-variant)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {maintenanceMode ? "Maintenance ON" : "Maintenance OFF"}
          </button>
          <span style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>
            When enabled, storefront shows a maintenance page to all non-admin users.
          </span>
        </div>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Maintenance Message</label>
          <textarea
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            rows={2}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--outline-variant)",
              background: "var(--surface-container-low)",
              resize: "vertical",
            }}
          />
          <button type="button" className="btn btn-secondary" onClick={saveMaintenanceMessage} style={{ width: "fit-content" }}>
            <Settings size={14} /> Save Message
          </button>
        </div>
      </div>

      {/* Create Announcement */}
      <div className="admin-card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Bell size={18} /> Create Announcement
        </h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Flash Sale This Weekend" />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Alert</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority (higher = first)</label>
              <input type="number" value={newPriority} onChange={(e) => setNewPriority(Number(e.target.value))} />
            </div>
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              placeholder="Announcement details shown to users..."
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--outline-variant)",
                background: "var(--surface-container-low)",
                resize: "vertical",
              }}
            />
          </div>
          <button className="btn btn-primary" onClick={createAnnouncement} disabled={saving} style={{ width: "fit-content" }}>
            <Plus size={14} /> {saving ? "Creating..." : "Create Announcement"}
          </button>
        </div>
      </div>

      {/* Existing Announcements */}
      <div className="admin-card">
        <h2 style={{ fontSize: "1.125rem", marginBottom: "1rem" }}>Active Announcements ({announcements.length})</h2>
        {announcements.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>No announcements yet. Create one above to show banners on the storefront.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {announcements.map((ann) => {
              const colors = TYPE_COLORS[ann.type] || TYPE_COLORS.info;
              return (
                <div
                  key={ann.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                    background: colors.bg,
                    opacity: ann.active ? 1 : 0.6,
                  }}
                >
                  <AlertCircle size={18} style={{ color: colors.text, flexShrink: 0, marginTop: "0.125rem" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: colors.text }}>{ann.title}</h3>
                      <span style={{ fontSize: "0.625rem", background: colors.text, color: "white", padding: "0.125rem 0.5rem", borderRadius: "100px" }}>
                        {colors.label} · P{ann.priority}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: colors.text, marginBottom: "0.5rem" }}>{ann.content}</p>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => toggleAnnouncement(ann.id, ann.active)}
                        style={{ fontSize: "0.75rem", background: "none", border: "none", cursor: "pointer", color: colors.text, textDecoration: "underline" }}
                      >
                        {ann.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAnnouncement(ann.id)}
                        style={{ fontSize: "0.75rem", background: "none", border: "none", cursor: "pointer", color: "#ba1a1a", display: "flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

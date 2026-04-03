"use client";

import { useEffect, useState } from "react";
import { X, Megaphone, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: number;
}

const TYPE_CONFIG: Record<string, { bg: string; text: string; icon: typeof Megaphone }> = {
  info: { bg: "#dbeafe", text: "#1e40af", icon: Megaphone },
  warning: { bg: "#fef3c7", text: "#92400e", icon: AlertTriangle },
  success: { bg: "#d1fae5", text: "#065f46", icon: CheckCircle2 },
  error: { bg: "#fee2e2", text: "#991b1b", icon: AlertCircle },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = () => {
      fetch("/api/announcements")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.announcements)) {
            setAnnouncements(data.announcements);
          }
        })
        .catch(() => {});
    };

    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 5000);
    return () => clearInterval(interval);
  }, []);

  const visible = announcements.filter((a) => a.id !== dismissed);
  if (visible.length === 0) return null;

  const topAnnouncement = visible[0];
  const config = TYPE_CONFIG[topAnnouncement.type] || TYPE_CONFIG.info;
  const Icon = config.icon;

  return (
    <div
      style={{
        background: config.bg,
        color: config.text,
        padding: "0.75rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        fontSize: "0.875rem",
        fontWeight: 600,
        position: "relative",
        zIndex: 99,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
        <Icon size={18} />
        <div>
          <span style={{ fontWeight: 800 }}>{topAnnouncement.title}</span>
          {topAnnouncement.content && (
            <span style={{ fontWeight: 400, marginLeft: "0.5rem" }}>{topAnnouncement.content}</span>
          )}
        </div>
      </div>
      <button
        onClick={() => setDismissed(topAnnouncement.id)}
        style={{ background: "none", border: "none", cursor: "pointer", color: config.text, padding: "0.25rem" }}
        aria-label="Dismiss announcement"
      >
        <X size={16} />
      </button>
    </div>
  );
}

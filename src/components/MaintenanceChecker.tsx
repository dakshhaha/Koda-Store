"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MaintenanceChecker() {
  const router = useRouter();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [siteIsOffline, setSiteIsOffline] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch("/api/maintenance", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(!!data.isAdmin);
          setSiteIsOffline(!!data.maintenanceMode);

          if (data.maintenanceMode && !data.isAdmin) {
            setMaintenanceMode(true);
            setMaintenanceMessage(data.maintenanceMessage || "We're currently performing maintenance.");
          } else {
            setMaintenanceMode(false);
          }
        }
      } catch {
        // Ignore errors
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 5000);
    return () => clearInterval(interval);
  }, [maintenanceMode, router]);

  if (maintenanceMode) {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-container)",
        padding: "2rem",
      }}>
        <div style={{ textAlign: "center", maxWidth: "480px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>🔧</div>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Under Maintenance</h1>
          <p style={{ color: "var(--on-surface-variant)", fontSize: "1rem", lineHeight: "1.6" }}>
            {maintenanceMessage}
          </p>
        </div>
      </div>
    );
  }

  // Admin bypass indicator
  if (isAdmin && siteIsOffline) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFC107",
        color: "#000",
        fontSize: "12px",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}>
        ⚠️ SITE IS IN MAINTENANCE MODE - ONLY ADMINS CAN ACCESS
      </div>
    );
  }

  return null;
}

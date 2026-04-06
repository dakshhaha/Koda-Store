"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, CheckCircle, Loader2 } from "lucide-react";

interface AdminMarkStatusButtonProps {
  orderId: string;
  status: "shipped" | "delivered";
}

export default function AdminMarkStatusButton({ orderId, status }: AdminMarkStatusButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    const actionLabel = status === "shipped" ? "shipped" : "delivered";
    if (!confirm(`Are you sure you want to mark this order as ${actionLabel}?`)) return;

    setLoading(true);
    try {
      const endpoint = `/api/admin/orders/${orderId}/mark-${status}`;
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Failed to mark as ${actionLabel}`);

      alert(`Success: ${data.message}`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const Icon = status === "shipped" ? Truck : CheckCircle;
  const label = status === "shipped" ? "Mark Shipped" : "Mark Delivered";
  const btnClass = status === "shipped" ? "btn-secondary" : "btn-primary";

  return (
    <button
      onClick={handleUpdate}
      disabled={loading}
      className={`btn ${btnClass}`}
      style={{
        fontSize: "0.75rem",
        padding: "0.4rem 0.75rem",
        gap: "0.4rem",
        height: "auto",
        minWidth: "130px",
        justifyContent: "center",
      }}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <>
          <Icon size={14} />
          {label}
        </>
      )}
    </button>
  );
}

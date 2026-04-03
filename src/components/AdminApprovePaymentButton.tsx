"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function AdminApprovePaymentButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/approve-payment`, {
        method: "POST",
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Approval failed.");
      }

      router.refresh();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Approval failed.");
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <div style={{ display: "grid", gap: "0.35rem" }}>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ fontSize: "0.75rem", padding: "0.45rem 0.7rem" }}
        onClick={handleApprove}
        disabled={loading}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
        {loading ? "Approving..." : "Approve Payment"}
      </button>
      {error && <span style={{ fontSize: "0.6875rem", color: "var(--error)", fontWeight: 600 }}>{error}</span>}
    </div>
  );
}

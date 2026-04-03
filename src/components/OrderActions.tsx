"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, RotateCcw, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface OrderActionsProps {
  orderId: string;
  locale: string;
  canCancel: boolean;
  canRefund: boolean;
  canReturn: boolean;
}

export default function OrderActions({ orderId, locale, canCancel, canRefund, canReturn }: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string, message: string) => {
    if (!confirm(message)) return;
    setLoading(action);
    try {
      const response = await fetch(`/api/orders/${orderId}/${action}`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `${action} failed.`);
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : `${action} failed.`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <Link href={`/${locale}/orders/${orderId}/receipt`} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
        <Download size={14} /> Download Receipt
      </Link>
      {canCancel && (
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.8125rem', color: 'var(--error)', borderColor: 'var(--error)' }}
          onClick={() => handleAction("cancel", "Are you sure you want to cancel this order?")}
          disabled={loading !== null}
        >
          <XCircle size={14} /> {loading === "cancel" ? "Cancelling..." : "Cancel Order"}
        </button>
      )}
      {canRefund && (
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.8125rem', color: '#d97706', borderColor: '#d97706' }}
          onClick={() => handleAction("refund", "Are you sure you want to request a refund? This will notify our support team.")}
          disabled={loading !== null}
        >
          <RotateCcw size={14} /> {loading === "refund" ? "Requesting..." : "Request Refund"}
        </button>
      )}
      {canReturn && (
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.8125rem', color: '#2563eb', borderColor: '#2563eb' }}
          onClick={() => handleAction("return", "Are you sure you want to return this order?")}
          disabled={loading !== null}
        >
          <AlertTriangle size={14} /> {loading === "return" ? "Processing..." : "Return Items"}
        </button>
      )}
    </div>
  );
}

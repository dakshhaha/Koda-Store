"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard } from "lucide-react";
import type { PaymentGatewayName } from "@/lib/payment";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface PayOnlineButtonProps {
  orderId: string;
  locale: string;
  compact?: boolean;
}

interface PaymentPayload {
  success: boolean;
  orderId: string;
  gateway: PaymentGatewayName;
  amount: number;
  currency: string;
  payment: {
    id: string;
    redirectUrl?: string;
    publicKey?: string;
  };
  error?: string;
}

const ONLINE_GATEWAYS: Array<{ id: PaymentGatewayName; label: string }> = [
  { id: "stripe", label: "Stripe" },
  { id: "razorpay", label: "Razorpay" },
  { id: "paypal", label: "PayPal" },
  { id: "flutterwave", label: "Flutterwave" },
];

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function PayOnlineButton({ orderId, locale, compact = false }: PayOnlineButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gateways, setGateways] = useState<Array<{ id: PaymentGatewayName; label: string }>>([]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayName>("stripe");
  const [error, setError] = useState("");

  useEffect(() => {
    const hydrateGateways = async () => {
      try {
        const response = await fetch("/api/admin/settings");
        if (!response.ok) throw new Error("Unable to load payment settings.");

        const settings = await response.json();
        const hiddenGateways = Array.isArray(settings?.hiddenGateways) ? settings.hiddenGateways : [];
        const visible = ONLINE_GATEWAYS.filter((gateway) => !hiddenGateways.includes(gateway.id));

        if (visible.length === 0) {
          setGateways([]);
          setError("Online payment is currently unavailable.");
          return;
        }

        setGateways(visible);
        const preferred = visible.find((gateway) => gateway.id === settings?.paymentGateway)?.id || visible[0].id;
        setSelectedGateway(preferred);
      } catch {
        setGateways(ONLINE_GATEWAYS);
        setSelectedGateway("stripe");
      }
    };

    hydrateGateways();
  }, []);

  const currentGatewayLabel = useMemo(
    () => gateways.find((gateway) => gateway.id === selectedGateway)?.label || "Online Gateway",
    [gateways, selectedGateway]
  );

  const verifyAndRedirect = async (paymentId: string, gateway: PaymentGatewayName, extra?: { razorpayOrderId?: string; razorpaySignature?: string }) => {
    const verifyResponse = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, paymentId, gateway, ...extra }),
    });

    const verifyPayload = await verifyResponse.json();
    if (!verifyResponse.ok || (!verifyPayload.verified && !verifyPayload.success)) {
      throw new Error(verifyPayload.error || "Payment verification failed.");
    }

    router.push(`/${locale}/orders/${orderId}/receipt`);
    router.refresh();
  };

  const handlePayOnline = async () => {
    if (gateways.length === 0 || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/orders/${orderId}/pay-online`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway: selectedGateway, locale }),
      });

      const payload = (await response.json()) as PaymentPayload;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to initialize online payment.");
      }

      if (payload.gateway === "razorpay") {
        const loaded = await loadRazorpayScript();
        if (!loaded || !window.Razorpay) {
          throw new Error("Razorpay SDK failed to load.");
        }

        setLoading(false);
        const razorpay = new window.Razorpay({
          key: payload.payment.publicKey,
          amount: Math.round(Number(payload.amount) * 100),
          currency: payload.currency,
          name: "Koda Store",
          description: `Order ${String(orderId).slice(0, 8).toUpperCase()}`,
          order_id: payload.payment.id,
          handler: async (result: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string }) => {
            try {
              setLoading(true);
              if (!result.razorpay_payment_id || !result.razorpay_order_id || !result.razorpay_signature) {
                throw new Error("Razorpay verification data is missing.");
              }
              await verifyAndRedirect(result.razorpay_payment_id, "razorpay", {
                razorpayOrderId: result.razorpay_order_id,
                razorpaySignature: result.razorpay_signature,
              });
            } catch (handlerError) {
              setLoading(false);
              setError(handlerError instanceof Error ? handlerError.message : "Payment verification failed.");
            }
          },
          modal: {
            ondismiss: () => {
              setError("Payment window closed. You can try again.");
            },
          },
        });

        razorpay.open();
        return;
      }

      if (payload.payment.redirectUrl) {
        window.location.href = payload.payment.redirectUrl;
        return;
      }

      await verifyAndRedirect(payload.payment.id, payload.gateway);
    } catch (payError) {
      setError(payError instanceof Error ? payError.message : "Unable to start online payment.");
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <select
          value={selectedGateway}
          onChange={(event) => setSelectedGateway(event.target.value as PaymentGatewayName)}
          disabled={loading || gateways.length === 0}
          style={{
            minWidth: compact ? "130px" : "170px",
            height: compact ? "2.125rem" : "2.5rem",
            background: "var(--surface-container-low)",
            color: "var(--on-surface)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "var(--radius-sm)",
            padding: "0 0.5rem",
            fontSize: "0.8125rem",
          }}
        >
          {gateways.map((gateway) => (
            <option key={gateway.id} value={gateway.id} style={{ background: "var(--surface-container-low)", color: "var(--on-surface)" }}>
              {gateway.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePayOnline}
          disabled={loading || gateways.length === 0}
          style={{ padding: compact ? "0.5rem 0.85rem" : undefined, fontSize: compact ? "0.75rem" : undefined }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
          {loading ? "Processing..." : `Pay Online (${currentGatewayLabel})`}
        </button>
      </div>

      {error && (
        <p style={{ fontSize: "0.75rem", color: "var(--error)", fontWeight: 600 }}>{error}</p>
      )}
    </div>
  );
}

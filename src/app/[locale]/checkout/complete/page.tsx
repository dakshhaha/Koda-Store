"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { PaymentGatewayName } from "@/lib/payment";

type VerificationState = "processing" | "failed";

export default function CheckoutCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useParams() as { locale: string };
  const { clearCart } = useCart();
  const [state, setState] = useState<VerificationState>("processing");
  const [errorMessage, setErrorMessage] = useState("Verifying payment with your gateway...");

  const orderId = searchParams.get("orderId") || "";
  const gateway = (searchParams.get("gateway") || "stripe") as PaymentGatewayName;

  const paymentId = useMemo(() => {
    return (
      searchParams.get("paymentId") ||
      searchParams.get("token") ||
      searchParams.get("transaction_id") ||
      searchParams.get("trxref") ||
      searchParams.get("tx_ref") ||
      ""
    );
  }, [searchParams]);

  useEffect(() => {
    const verify = async () => {
      if (!orderId || !paymentId) {
        setState("failed");
        setErrorMessage("Missing payment reference from the gateway callback.");
        return;
      }

      try {
        const response = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, paymentId, gateway }),
        });

        const data = await response.json();
        if (!response.ok || (!data.verified && !data.success)) {
          throw new Error(data.error || "Payment verification failed.");
        }

        clearCart();
        router.replace(`/${locale}/orders/${orderId}/receipt`);
      } catch (error) {
        setState("failed");
        setErrorMessage(error instanceof Error ? error.message : "Payment verification failed.");
      }
    };

    verify();
  }, [clearCart, gateway, locale, orderId, paymentId, router]);

  if (state === "processing") {
    return (
      <div className="container section empty-state">
        <Loader2 size={44} className="animate-spin" style={{ color: "var(--primary)", marginBottom: "1rem" }} />
        <h2>Finalizing payment</h2>
        <p>{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="container section empty-state">
      <AlertTriangle size={44} style={{ color: "var(--error)", marginBottom: "1rem" }} />
      <h2>Payment verification failed</h2>
      <p>{errorMessage}</p>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1rem" }}>
        <Link href={`/${locale}/checkout`} className="btn btn-primary">
          <CheckCircle size={16} /> Try checkout again
        </Link>
        <Link href={`/${locale}/orders`} className="btn btn-secondary">
          View orders
        </Link>
      </div>
    </div>
  );
}

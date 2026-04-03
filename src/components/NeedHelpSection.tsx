"use client";

import Link from "next/link";

interface NeedHelpSectionProps {
  orderId: string;
  locale: string;
  receiptHref: string;
}

export default function NeedHelpSection({ locale, receiptHref }: NeedHelpSectionProps) {
  const openChat = () => {
    const chatWidget = document.querySelector(".ai-chat-toggle") as HTMLElement;
    if (chatWidget) chatWidget.click();
  };

  return (
    <div className="admin-card animate-in" style={{ animationDelay: "0.3s", background: "var(--surface-container-low)", border: "1px dashed var(--outline-variant)" }}>
      <h3 style={{ fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        Need Help with This Order?
      </h3>
      <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)", lineHeight: "1.5", marginBottom: "1rem" }}>
        Our AI assistant and support team can help with refunds, returns, or any order issues.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Link href={receiptHref} className="btn btn-secondary" style={{ fontSize: "0.8125rem", justifyContent: "center" }}>
          Download Receipt
        </Link>
        <button
          type="button"
          className="btn btn-tertiary"
          style={{ fontSize: "0.8125rem", justifyContent: "center" }}
          onClick={openChat}
        >
          Chat with AI Assistant
        </button>
      </div>
    </div>
  );
}

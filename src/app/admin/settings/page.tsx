"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Settings,
  CreditCard,
  Cpu,
  Database,
  Save,
  CheckCircle,
  Eye,
  EyeOff,
  UserRound,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

const GATEWAYS = [
  { id: "stripe", name: "Stripe", desc: "Hosted checkout for cards and wallet payments.", fees: "2.9% + 30c" },
  { id: "razorpay", name: "Razorpay", desc: "UPI, cards, and netbanking for India-first checkout.", fees: "2% domestic" },
  { id: "cod", name: "Cash on Delivery", desc: "Accept payment at delivery and settle later.", fees: "No online gateway fee" },
];

const AI_PROVIDERS = [
  { id: "gemini", name: "Google Gemini", desc: "Fast responses with reliable intent handling.", provider: "Google" },
  { id: "openrouter", name: "OpenRouter", desc: "Unified access to multiple model families.", provider: "Unified" },
  { id: "claude", name: "Anthropic Claude", desc: "Excellent long-form support conversations.", provider: "Anthropic" },
  { id: "openai", name: "OpenAI GPT", desc: "High quality answer consistency.", provider: "OpenAI" },
];

export default function AdminSettings() {
  const [activeGateway, setActiveGateway] = useState("stripe");
  const [activeAI, setActiveAI] = useState("gemini");
  const [storeName, setStoreName] = useState("Koda Store");
  const [currency, setCurrency] = useState("USD");
  const [taxRate, setTaxRate] = useState(0);
  const [hiddenGateways, setHiddenGateways] = useState<string[]>([]);
  const [adminProfile, setAdminProfile] = useState<{ name?: string; email?: string }>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [settingsRes, profileRes] = await Promise.all([fetch("/api/admin/settings"), fetch("/api/user/profile")]);

        if (!settingsRes.ok) {
          const payload = await settingsRes.json();
          throw new Error(payload.error || "Failed to load settings");
        }

        const data = await settingsRes.json();
        setStoreName(data.storeName || "Koda Store");
        setActiveGateway(data.paymentGateway || "stripe");
        setActiveAI(data.aiProvider || "gemini");
        setCurrency(data.currency || "USD");
        setTaxRate(typeof data.taxRate === "number" ? data.taxRate : 0);
        setHiddenGateways(Array.isArray(data.hiddenGateways) ? data.hiddenGateways : []);

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setAdminProfile({ name: profile?.name, email: profile?.email });
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const visibleGateways = useMemo(() => GATEWAYS.filter((gateway) => !hiddenGateways.includes(gateway.id)), [hiddenGateways]);

  const toggleGatewayVisibility = (id: string) => {
    setError("");

    setHiddenGateways((previous) => {
      if (previous.includes(id)) {
        return previous.filter((gatewayId) => gatewayId !== id);
      }

      const currentlyVisible = GATEWAYS.map((gateway) => gateway.id).filter((gatewayId) => !previous.includes(gatewayId));
      if (currentlyVisible.length <= 1 && currentlyVisible.includes(id)) {
        setError("At least one payment gateway must stay visible at checkout.");
        return previous;
      }

      if (activeGateway === id) {
        const replacement = currentlyVisible.find((gatewayId) => gatewayId !== id);
        if (replacement) {
          setActiveGateway(replacement);
        }
      }

      return [...previous, id];
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentGateway: activeGateway,
          aiProvider: activeAI,
          storeName,
          currency,
          taxRate: Number.isNaN(taxRate) ? 0 : taxRate,
          hiddenGateways,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save settings");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container section empty-state">
        <h2 style={{ fontSize: "1.25rem" }}>Loading settings...</h2>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Settings /> Admin Settings
          </h1>
          <p style={{ color: "var(--on-surface-variant)", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            Configure payments, support AI, and store defaults.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link href="/admin/support" className="btn btn-secondary">
            <MessageSquare size={16} /> Support Portal
          </Link>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || saved}>
            {saved ? (
              <>
                <CheckCircle size={16} /> Saved
              </>
            ) : (
              <>
                <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: "1.25rem", padding: "0.875rem 1rem", borderRadius: "var(--radius-md)", background: "#ba1a1a1a", color: "#7f1d1d", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <UserRound size={18} /> Admin Account
        </h2>
        <div className="form-row">
          <div className="form-group">
            <label>Admin Name</label>
            <input value={adminProfile.name || "Admin"} disabled />
          </div>
          <div className="form-group">
            <label>Admin Email</label>
            <input value={adminProfile.email || "admin@kodastore.com"} disabled />
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "1.25rem" }}>General Store Settings</h2>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="storeName">Store Name</label>
            <input id="storeName" value={storeName} onChange={(event) => setStoreName(event.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="currency">Default Currency</label>
            <select id="currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="NGN">NGN - Nigerian Naira</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="BRL">BRL - Brazilian Real</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="taxRate">Tax Rate (%)</label>
            <input
              id="taxRate"
              type="number"
              step="0.01"
              value={taxRate}
              onChange={(event) => setTaxRate(parseFloat(event.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "0.375rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <CreditCard size={18} /> Payment Gateways
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)", marginBottom: "1.25rem" }}>
          Select the default gateway and hide any provider from checkout.
        </p>
        <div className="gateway-grid">
          {GATEWAYS.map((gateway) => {
            const hidden = hiddenGateways.includes(gateway.id);
            const active = activeGateway === gateway.id;

            return (
              <div
                key={gateway.id}
                className={`gateway-card ${active ? "active" : ""}`}
                onClick={() => {
                  if (!hidden) {
                    setActiveGateway(gateway.id);
                  }
                }}
                style={{ opacity: hidden ? 0.45 : 1, position: "relative" }}
              >
                <p className="gateway-name">{gateway.name}</p>
                <p className="gateway-desc">{gateway.desc}</p>
                <p style={{ fontSize: "0.625rem", color: "var(--primary)", fontWeight: 700, marginTop: "0.5rem" }}>Fees: {gateway.fees}</p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleGatewayVisibility(gateway.id);
                  }}
                  style={{
                    position: "absolute",
                    top: "0.75rem",
                    right: "0.75rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: hidden ? "var(--error)" : "var(--on-surface-variant)",
                  }}
                  title={hidden ? "Show at checkout" : "Hide from checkout"}
                >
                  {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            );
          })}
        </div>
        <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>
          Visible at checkout: {visibleGateways.map((gateway) => gateway.name).join(", ") || "None"}
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "0.375rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Cpu size={18} /> AI Chat Provider
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)", marginBottom: "1.25rem" }}>
          Choose which model powers customer support responses.
        </p>
        <div className="gateway-grid">
          {AI_PROVIDERS.map((provider) => (
            <div key={provider.id} className={`gateway-card ${activeAI === provider.id ? "active" : ""}`} onClick={() => setActiveAI(provider.id)}>
              <p className="gateway-name">{provider.name}</p>
              <p className="gateway-desc">{provider.desc}</p>
              <span style={{ fontSize: "0.625rem", textTransform: "uppercase", color: "var(--primary)", fontWeight: 700 }}>{provider.provider}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <h2 style={{ fontSize: "1.125rem", marginBottom: "0.375rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Database size={18} /> Database Status
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)", marginBottom: "1.25rem" }}>
          Current database engine and production recommendation.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div className="gateway-card active" style={{ flex: "1", minWidth: "220px" }}>
            <p className="gateway-name">SQLite</p>
            <p className="gateway-desc">Active in this environment. Lightweight and fast for local deployments.</p>
          </div>
          <div className="gateway-card" style={{ flex: "1", minWidth: "220px" }}>
            <p className="gateway-name">PostgreSQL</p>
            <p className="gateway-desc">Recommended for scaling production traffic and larger order volume.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

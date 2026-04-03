"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  User,
  MapPin,
  CreditCard,
  ShieldCheck,
  Check,
  LayoutTemplate,
  ChevronRight,
  Landmark,
  Wallet,
  Globe2,
  Truck,
  LocateFixed,
  PlusCircle,
  Mail,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { COUNTRIES, getPhoneCode, validateZip } from "@/lib/countries";
import type { PaymentGatewayName } from "@/lib/payment";
import { convertUsdToCurrency, formatCurrency, normalizeCurrency } from "@/lib/currency";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface GatewayOption {
  id: PaymentGatewayName;
  name: string;
  Icon: LucideIcon;
  features: string[];
  fees: string;
}

interface SavedAddress {
  id: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  type: string;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  image: string;
  name: string;
  quantity: number;
  price: number;
}

interface AppliedCoupon {
  code: string;
  discountAmount: number;
  finalTotal: number;
}

const GATEWAYS: GatewayOption[] = [
  {
    id: "cod",
    name: "Cash on Delivery",
    Icon: Truck,
    features: ["Pay at doorstep", "Available for eligible regions"],
    fees: "No online processing fee",
  },
  {
    id: "stripe",
    name: "Stripe Checkout",
    Icon: CreditCard,
    features: ["Cards, Apple Pay, Google Pay"],
    fees: "2.9% + $0.30 per transaction",
  },
  {
    id: "razorpay",
    name: "Razorpay",
    Icon: Landmark,
    features: ["UPI, cards, netbanking"],
    fees: "2% per transaction",
  },
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

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const [step, setStep] = useState<"details" | "payment">("details");
  const [loading, setLoading] = useState(false);
  const [zipError, setZipError] = useState("");
  const [geoLoading, setGeoLoading] = useState(true);
  const [locationMessage, setLocationMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [autoSavedAddressId, setAutoSavedAddressId] = useState<string | null>(null);
  const [availableGateways, setAvailableGateways] = useState<GatewayOption[]>(GATEWAYS);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayName>("stripe");
  const [paymentNotice, setPaymentNotice] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneCode: "+1",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useParams() as { locale: string };
  const requestedBrowserGeoRef = useRef(false);

  const paymentState = searchParams.get("payment");

  const isAddressReady = useMemo(
    () =>
      Boolean(
        formData.firstName &&
          formData.lastName &&
          formData.email &&
          formData.phone &&
          formData.address &&
          formData.city &&
          formData.state &&
          formData.zip &&
          formData.country &&
          validateZip(formData.country, formData.zip)
      ),
    [formData]
  );

  const discountedTotal = useMemo(() => {
    if (!appliedCoupon) return cartTotal;
    return Math.max(0, cartTotal - appliedCoupon.discountAmount);
  }, [appliedCoupon, cartTotal]);

  useEffect(() => {
    if (paymentState === "cancelled") {
      setPaymentNotice("Payment was cancelled. You can choose another method and try again.");
    }
  }, [paymentState]);

  useEffect(() => {
    const hydrateCheckout = async () => {
      try {
        const [profileRes, settingsRes] = await Promise.all([
          fetch("/api/user/profile", { cache: "no-store" }),
          fetch("/api/admin/settings", { cache: "no-store" }),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          const nameParts = (data?.name || "").trim().split(" ");
          const saved = Array.isArray(data?.addresses) ? (data.addresses as SavedAddress[]) : [];

          setSavedAddresses(saved);

          const defaultAddress = saved.find((addr) => addr.isDefault) || saved[0];
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            setAutoSavedAddressId(defaultAddress.id);
          }

          setFormData((prev) => ({
            ...prev,
            firstName: nameParts[0] || prev.firstName,
            lastName: nameParts.slice(1).join(" ") || prev.lastName,
            email: data?.email || prev.email,
            phone: data?.phone?.replace(/^\+\d+\s?/, "") || prev.phone,
            address: defaultAddress?.addressLine1 || data?.address || prev.address,
            city: defaultAddress?.city || data?.city || prev.city,
            state: defaultAddress?.state || data?.state || prev.state,
            zip: defaultAddress?.zip || data?.zip || prev.zip,
            country: defaultAddress?.country || data?.country || prev.country,
            phoneCode: getPhoneCode(defaultAddress?.country || data?.country || prev.country),
          }));
        }

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          const hiddenGateways = Array.isArray(settings?.hiddenGateways) ? settings.hiddenGateways : [];
          const visibleGateways = GATEWAYS.filter((gateway) => !hiddenGateways.includes(gateway.id));

          if (visibleGateways.length > 0) {
            setAvailableGateways(visibleGateways);
            const preferredGateway =
              visibleGateways.find((gateway) => gateway.id === settings?.paymentGateway)?.id || visibleGateways[0].id;
            setSelectedGateway(preferredGateway);
          } else {
            setAvailableGateways([]);
          }
        }
      } catch {
        setAvailableGateways(GATEWAYS.filter((gateway) => gateway.id !== "square"));
      }
    };

    hydrateCheckout();
  }, []);

  useEffect(() => {
    fetch("/api/geo")
      .then((response) => response.json())
      .then((geo) => {
        if (geo?.countryCode) {
          setFormData((prev) => ({
            ...prev,
            country: prev.country === "US" ? geo.countryCode : prev.country,
            city: prev.city || geo.city || "",
            state: prev.state || geo.region || "",
            zip: prev.zip || geo.zip || "",
            phoneCode: prev.phoneCode === "+1" ? getPhoneCode(geo.countryCode) : prev.phoneCode,
          }));
        }
        setGeoLoading(false);
      })
      .catch(() => setGeoLoading(false));
  }, []);

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Browser geolocation is not available on this device.");
      return;
    }

    setLocating(true);
    setLocationMessage("Requesting location permission...");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(`/api/geo/reverse?lat=${coords.latitude}&lon=${coords.longitude}`);
          if (!response.ok) {
            throw new Error("reverse-geocode-failed");
          }

          const data = await response.json();
          const countryCode = String(data?.countryCode || "").toUpperCase();

          setFormData((prev) => ({
            ...prev,
            address: data?.addressLine1 || prev.address,
            city: data?.city || prev.city,
            state: data?.state || prev.state,
            zip: data?.zip || prev.zip,
            country: COUNTRIES.some((item) => item.code === countryCode) ? countryCode : prev.country,
            phoneCode: COUNTRIES.some((item) => item.code === countryCode) ? getPhoneCode(countryCode) : prev.phoneCode,
          }));

          setLocationMessage("Location detected. You can edit any field before payment.");
        } catch {
          setLocationMessage("Location permission granted, but address lookup failed. Please fill manually.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationMessage("Location permission denied. You can still enter address manually.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (requestedBrowserGeoRef.current) return;
    requestedBrowserGeoRef.current = true;

    const timer = setTimeout(() => {
      requestBrowserLocation();
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isAddressReady) return;

    const timeout = setTimeout(async () => {
      setAddressSaving(true);
      try {
        await fetch("/api/user/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            phone: `${formData.phoneCode} ${formData.phone}`,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            country: formData.country,
          }),
        });

        const addressResponse = await fetch("/api/user/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedAddressId || autoSavedAddressId,
            addressLine1: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            country: formData.country,
            type: "shipping",
            isDefault: true,
          }),
        });

        if (addressResponse.ok) {
          const saved = (await addressResponse.json()) as SavedAddress;
          if (saved?.id) {
            setSelectedAddressId(saved.id);
            setAutoSavedAddressId(saved.id);
            setSavedAddresses((prev) => {
              const others = prev.filter((item) => item.id !== saved.id);
              return [{ ...saved, isDefault: true }, ...others.map((item) => ({ ...item, isDefault: false }))];
            });
          }
        }
      } catch {
      } finally {
        setAddressSaving(false);
      }
    }, 1100);

    return () => clearTimeout(timeout);
  }, [formData, isAddressReady, selectedAddressId, autoSavedAddressId]);

  const applySavedAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setAutoSavedAddressId(address.id);
    setFormData((prev) => ({
      ...prev,
      address: address.addressLine1,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phoneCode: getPhoneCode(address.country),
    }));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = event.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (id === "zip") {
      setZipError("");
    }
  };

  const handleCountryChange = (code: string) => {
    setFormData((prev) => ({ ...prev, country: code, phoneCode: getPhoneCode(code) }));
  };

  const handleNextStep = () => {
    if (!validateZip(formData.country, formData.zip)) {
      setZipError("Invalid ZIP/postal code for your country.");
      return;
    }

    if (!formData.phone) {
      alert("Phone number is required for delivery.");
      return;
    }

    setStep("payment");
  };

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }

    setApplyingCoupon(true);
    setCouponError("");

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: cartTotal }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.valid) {
        throw new Error(payload.error || "Coupon is invalid.");
      }

      setAppliedCoupon({
        code: payload.code,
        discountAmount: Number(payload.discountAmount || 0),
        finalTotal: Number(payload.finalTotal || cartTotal),
      });
    } catch (error) {
      setAppliedCoupon(null);
      setCouponError(error instanceof Error ? error.message : "Unable to apply coupon.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const finalizePayment = async (
    orderId: string,
    paymentId: string,
    gateway: PaymentGatewayName,
    extra?: { razorpayOrderId?: string; razorpaySignature?: string }
  ) => {
    const verifyResponse = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, paymentId, gateway, ...extra }),
    });

    const verification = await verifyResponse.json();
    if (!verifyResponse.ok || (!verification.verified && !verification.success)) {
      throw new Error(verification.error || "Payment could not be verified.");
    }

    clearCart();
    router.push(`/${locale}/orders/${orderId}/receipt`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (availableGateways.length === 0) {
      alert("No payment gateway is currently available. Please contact support.");
      return;
    }

    setLoading(true);
    setPaymentNotice("");

    try {
      const currency = normalizeCurrency(COUNTRIES.find((country) => country.code === formData.country)?.currency || "USD");

      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: discountedTotal,
          currency,
          gateway: selectedGateway,
          couponCode: appliedCoupon?.code || null,
          shippingDetails: {
            ...formData,
            phone: `${formData.phoneCode} ${formData.phone}`,
            locale,
          },
          cartItems: cart,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to start payment.");
      }

      if (selectedGateway === "cod") {
        clearCart();
        router.push(`/${locale}/orders/${data.orderId}/receipt`);
        return;
      }

      const payment = data.payment;
      if (selectedGateway === "razorpay") {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || !window.Razorpay) {
          throw new Error("Razorpay SDK failed to load.");
        }

        setLoading(false);

        const razorpay = new window.Razorpay({
          key: payment.publicKey,
          amount: Math.round(Number(data?.totals?.total || convertUsdToCurrency(discountedTotal, currency)) * 100),
          currency,
          name: "Koda Store",
          description: `Order ${String(data.orderId).slice(0, 8).toUpperCase()}`,
          order_id: payment.id,
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            contact: `${formData.phoneCode}${formData.phone}`,
          },
          handler: async (result: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string }) => {
            try {
              setLoading(true);
              if (!result?.razorpay_payment_id || !result?.razorpay_order_id || !result?.razorpay_signature) {
                throw new Error("Razorpay payment verification data is missing.");
              }
              await finalizePayment(data.orderId, result.razorpay_payment_id, "razorpay", {
                razorpayOrderId: result.razorpay_order_id,
                razorpaySignature: result.razorpay_signature,
              });
            } catch (error) {
              setLoading(false);
              alert(error instanceof Error ? error.message : "Payment verification failed.");
            }
          },
          modal: {
            ondismiss: () => {
              setPaymentNotice("Payment popup closed. Your order is still pending.");
            },
          },
        });

        razorpay.open();
        return;
      }

      if (payment.redirectUrl) {
        window.location.href = payment.redirectUrl;
        return;
      }

      await finalizePayment(data.orderId, payment.id, selectedGateway);
    } catch (error) {
      setLoading(false);
      alert(`Payment failed: ${error instanceof Error ? error.message : "Please try again."}`);
    }
  };

  const checkoutCurrency = normalizeCurrency(COUNTRIES.find((country) => country.code === formData.country)?.currency || "USD");
  const money = (amountUsd: number) =>
    formatCurrency(convertUsdToCurrency(amountUsd, checkoutCurrency), checkoutCurrency, locale);

  if (cart.length === 0) {
    return (
      <div className="container section empty-state">
        <CreditCard size={48} style={{ color: "var(--on-surface-variant)", marginBottom: "1rem", opacity: 0.3 }} />
        <h2>Your cart is empty</h2>
        <p style={{ color: "var(--on-surface-variant)", marginBottom: "2rem" }}>Add some products before checking out.</p>
        <a href={`/${locale}/products`} className="btn btn-primary">
          Browse Products
        </a>
      </div>
    );
  }

  return (
    <div className="container section">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2.5rem", fontSize: "0.875rem" }}>
        <span style={{ fontWeight: step === "details" ? 700 : 400, color: step === "details" ? "var(--primary)" : "var(--on-surface-variant)" }}>
          1. Shipping Details
        </span>
        <ChevronRight size={14} color="var(--on-surface-variant)" />
        <span style={{ fontWeight: step === "payment" ? 700 : 400, color: step === "payment" ? "var(--primary)" : "var(--on-surface-variant)" }}>
          2. Payment Method
        </span>
      </div>

      <h1 style={{ fontSize: "2rem", marginBottom: "2.5rem" }}>Checkout</h1>

      {paymentNotice && (
        <div style={{ marginBottom: "1.5rem", padding: "0.875rem 1rem", borderRadius: "var(--radius-md)", background: "#f59e0b20", color: "#92400e", fontSize: "0.875rem", fontWeight: 600 }}>
          {paymentNotice}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "2.5rem", alignItems: "start" }}>
        <div>
          {step === "details" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleNextStep();
              }}
            >
              {savedAddresses.length > 0 && (
                <div className="admin-card animate-in" style={{ marginBottom: "1.5rem" }}>
                  <h2 style={{ fontSize: "1.125rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <MapPin size={18} /> Use a Saved Address
                  </h2>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {savedAddresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => applySavedAddress(address)}
                        className="btn btn-secondary"
                        style={{
                          justifyContent: "space-between",
                          textAlign: "left",
                          background: selectedAddressId === address.id ? "var(--secondary-container)" : "var(--surface-container-low)",
                          border: selectedAddressId === address.id ? "1px solid var(--primary)" : "1px solid transparent",
                          color: "var(--on-surface)",
                          padding: "0.75rem 1rem",
                        }}
                      >
                        <span style={{ fontSize: "0.8125rem", lineHeight: 1.4 }}>
                          {address.addressLine1}, {address.city}, {address.state} {address.zip}, {address.country}
                        </span>
                        {selectedAddressId === address.id && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-tertiary"
                    onClick={() => {
                      setSelectedAddressId(null);
                      setAutoSavedAddressId(null);
                    }}
                    style={{ marginTop: "0.75rem" }}
                  >
                    <PlusCircle size={14} /> Add or change address manually
                  </button>
                </div>
              )}

              <div className="admin-card animate-in">
                <h2 style={{ fontSize: "1.125rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <User size={18} /> Contact Information
                </h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input id="firstName" placeholder="John" value={formData.firstName} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input id="lastName" placeholder="Doe" value={formData.lastName} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem", alignItems: "center" }}>
                    <input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleInputChange} required />
                    <span style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                      <Mail size={14} /> Auto-filled
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number (required for delivery)</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <select id="phoneCode" value={formData.phoneCode} onChange={(event) => setFormData((prev) => ({ ...prev, phoneCode: event.target.value }))} style={{ width: "130px", flexShrink: 0 }}>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.phone}>
                          {country.phone} ({country.code})
                        </option>
                      ))}
                    </select>
                    <input id="phone" type="tel" placeholder="555 123 4567" value={formData.phone} onChange={handleInputChange} required style={{ flex: 1 }} />
                  </div>
                </div>
              </div>

              <div className="admin-card animate-in" style={{ animationDelay: "0.1s", marginTop: "1.5rem" }}>
                <h2 style={{ fontSize: "1.125rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                    <MapPin size={18} /> Billing + Shipping Address
                  </span>
                  <button type="button" className="btn btn-tertiary" onClick={requestBrowserLocation} disabled={locating} style={{ fontSize: "0.75rem" }}>
                    <LocateFixed size={14} /> {locating ? "Detecting..." : "Use my location"}
                  </button>
                </h2>

                {(geoLoading || locationMessage || addressSaving) && (
                  <p style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", marginBottom: "0.75rem" }}>
                    {geoLoading && "Detecting region from IP... "}
                    {locationMessage}
                    {addressSaving && " Saving address automatically..."}
                  </p>
                )}

                <div className="form-group">
                  <label htmlFor="address">Street Address</label>
                  <input id="address" placeholder="123 Main Street, Apt 4B" value={formData.address} onChange={handleInputChange} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input id="city" placeholder="Mumbai" value={formData.city} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">State / Province</label>
                    <input id="state" placeholder="Maharashtra" value={formData.state} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="zip">ZIP / Postal Code</label>
                    <input id="zip" placeholder="400001" value={formData.zip} onChange={handleInputChange} required />
                    {zipError && <p style={{ color: "var(--error)", fontSize: "0.75rem", marginTop: "0.25rem" }}>{zipError}</p>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <select id="country" value={formData.country} onChange={(event) => handleCountryChange(event.target.value)}>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary btn-lg" type="submit" style={{ width: "100%", marginTop: "1.5rem", height: "3.25rem" }}>
                Continue to Payment <ChevronRight size={18} />
              </button>
            </form>
          )}

          {step === "payment" && (
            <div className="animate-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.125rem" }}>Choose Payment Method</h2>
                <button className="btn btn-tertiary btn-sm" onClick={() => setStep("details")} style={{ fontSize: "0.8125rem" }}>
                  Back to Shipping
                </button>
              </div>

              {availableGateways.length === 0 && (
                <div className="admin-card" style={{ marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.875rem", color: "var(--error)", fontWeight: 600 }}>
                    No payment methods are available right now. Please contact support.
                  </p>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {availableGateways.find(g => g.id === "cod") && (
                  <button
                    type="button"
                    className="admin-card"
                    onClick={() => setSelectedGateway("cod")}
                    style={{
                      cursor: "pointer",
                      border: selectedGateway === "cod" ? "2px solid var(--primary)" : "2px solid transparent",
                      transition: "all 0.2s",
                      textAlign: "left",
                      margin: 0
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--primary-container)", color: "var(--on-primary-container)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Truck size={16} />
                        </span>
                        <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Cash on Delivery</h3>
                      </div>
                      {selectedGateway === "cod" && (
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", marginTop: "0.75rem" }}>Pay at doorstep when your order arrives. Available for eligible regions.</p>
                  </button>
                )}

                <div style={{ height: "1px", background: "var(--outline-variant)", margin: "0.5rem 0" }} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {availableGateways.find(g => g.id === "stripe") && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway("stripe")}
                      style={{
                        cursor: "pointer",
                        border: selectedGateway === "stripe" ? "3px solid #635bff" : "2px solid var(--surface-container-high)",
                        backgroundColor: selectedGateway === "stripe" ? "#635bff" : "white",
                        borderRadius: "16px",
                        padding: "1rem",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "80px",
                        transition: "all 0.2s",
                        boxShadow: selectedGateway === "stripe" ? "0 10px 25px rgba(99, 91, 255, 0.3)" : "none"
                      }}
                    >
                      <span style={{ fontWeight: 800, fontSize: "1.5rem", color: selectedGateway === "stripe" ? "white" : "#635bff", letterSpacing: "-0.5px" }}>stripe</span>
                      {selectedGateway === "stripe" && (
                        <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", width: "20px", height: "20px", borderRadius: "50%", background: "white", color: "#635bff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )}

                  {availableGateways.find(g => g.id === "razorpay") && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway("razorpay")}
                      style={{
                        cursor: "pointer",
                        border: selectedGateway === "razorpay" ? "3px solid #3395ff" : "2px solid var(--surface-container-high)",
                        backgroundColor: selectedGateway === "razorpay" ? "#3395ff" : "white",
                        borderRadius: "16px",
                        padding: "1rem",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "80px",
                        transition: "all 0.2s",
                        gap: "0.5rem",
                        boxShadow: selectedGateway === "razorpay" ? "0 10px 25px rgba(51, 149, 255, 0.3)" : "none"
                      }}
                    >
                      <LayoutTemplate size={24} color={selectedGateway === "razorpay" ? "white" : "#3395ff"} />
                      <span style={{ fontWeight: 700, fontSize: "1.3rem", color: selectedGateway === "razorpay" ? "white" : "#02042b" }}>Razorpay</span>
                      {selectedGateway === "razorpay" && (
                        <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", width: "20px", height: "20px", borderRadius: "50%", background: "white", color: "#3395ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <button className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "1.5rem", height: "3.25rem" }} onClick={handleCheckout} disabled={loading || availableGateways.length === 0}>
                {loading
                  ? "Processing Payment..."
                  : `Pay ${money(discountedTotal)} with ${availableGateways.find((gateway) => gateway.id === selectedGateway)?.name || "Gateway"}`}
              </button>

              <p style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", textAlign: "center", marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
                <ShieldCheck size={14} />
                {selectedGateway === "cod"
                  ? "Cash on delivery selected. You can also pay online later from your orders page."
                  : "Real gateway payment with verification before receipt."}
              </p>
            </div>
          )}
        </div>

        <div className="admin-card animate-in" style={{ position: "sticky", top: "6rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>Order Summary</h3>
          {(cart as CartItem[]).map((item) => (
            <div key={item.id} style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "6px", overflow: "hidden", background: "var(--surface-container-low)", flexShrink: 0 }}>
                <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>Qty: {item.quantity}</p>
              </div>
              <span style={{ fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}>
                {money(item.price * item.quantity)}
              </span>
            </div>
          ))}

          <div style={{ marginTop: "0.5rem", marginBottom: "0.75rem" }}>
            <label htmlFor="couponCode" style={{ marginBottom: "0.375rem" }}>Coupon Code</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem" }}>
              <input
                id="couponCode"
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value)}
                placeholder="Enter code"
                style={{ height: "2.5rem" }}
              />
              <button type="button" className="btn btn-secondary" onClick={applyCoupon} disabled={applyingCoupon}>
                <Tag size={14} /> {applyingCoupon ? "Applying" : "Apply"}
              </button>
            </div>
            {appliedCoupon && (
              <p style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "#166534", fontWeight: 600 }}>
                Coupon {appliedCoupon.code} applied.
              </p>
            )}
            {couponError && (
              <p style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "var(--error)", fontWeight: 600 }}>
                {couponError}
              </p>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem", marginTop: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--on-surface-variant)" }}>Subtotal</span>
              <span>{money(cartTotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--on-surface-variant)" }}>Shipping</span>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>Free</span>
            </div>
            {appliedCoupon && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--on-surface-variant)" }}>Discount ({appliedCoupon.code})</span>
                <span style={{ color: "#166534", fontWeight: 700 }}>-{money(appliedCoupon.discountAmount)}</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: "2px solid var(--on-surface)", paddingTop: "1rem", marginTop: "0.5rem", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.125rem" }}>
            <span>Total</span>
            <span>{money(discountedTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

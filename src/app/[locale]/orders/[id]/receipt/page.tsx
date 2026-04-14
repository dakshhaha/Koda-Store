"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Download, Printer, ArrowLeft, CheckCircle, X, Sparkles, Coins, Share2 } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { useCart } from "@/context/CartContext";
import PayOnlineButton from "@/components/PayOnlineButton";
import { useRouter } from "next/navigation";
import { formatCurrency, normalizeCurrency } from "@/lib/currency";

// Simple Code128 barcode generator (subset B)
function generateBarcode128B(data: string): string {
  const START_B = 104;
  const STOP = 106;
  const codeB: Record<string, number> = {};
  for (let i = 0; i < 95; i++) {
    codeB[String.fromCharCode(32 + i)] = i;
  }

  const values = [START_B];
  for (const ch of data) {
    if (codeB[ch] !== undefined) values.push(codeB[ch]);
  }

  let checksum = values[0];
  for (let i = 1; i < values.length; i++) {
    checksum += values[i] * i;
  }
  values.push(checksum % 103);
  values.push(STOP);

  // Encoding patterns (each value → binary pattern of bar widths)
  const patterns: string[] = [
    "11011001100","11001101100","11001100110","10010011000","10010001100",
    "10001001100","10011001000","10011000100","10001100100","11001001000",
    "11001000100","11000100100","10110011100","10011011100","10011001110",
    "10111001100","10011101100","10011100110","11001110010","11001011100",
    "11001001110","11011100100","11001110100","11101101110","11101001100",
    "11100101100","11100100110","11101100100","11100110100","11100110010",
    "11011011000","11011000110","11000110110","10100011000","10001011000",
    "10001000110","10110001000","10001101000","10001100010","11010001000",
    "11000101000","11000100010","10110111000","10110001110","10001101110",
    "10111011000","10111000110","10001110110","11101110110","11010001110",
    "11000101110","11011101000","11011100010","11011101110","11101011000",
    "11101000110","11100010110","11101101000","11101100010","11100011010",
    "11101111010","11001000010","11110001010","10100110000","10100001100",
    "10010110000","10010000110","10000101100","10000100110","10110010000",
    "10110000100","10011010000","10011000010","10000110100","10000110010",
    "11000010010","11001010000","11110111010","11000010100","10001111010",
    "10100111100","10010111100","10010011110","10111100100","10011110100",
    "10011110010","11110100100","11110010100","11110010010","11011011110",
    "11011110110","11110110110","10101111000","10100011110","10001011110",
    "10111101000","10111100010","11110101000","11110100010","10111011110",
    "10111101110","11101011110","11110101110","11010000100","11010010000",
    "11010011100","1100011101011",
  ];

  let binary = "";
  for (const v of values) {
    binary += patterns[v] || "";
  }

  return binary;
}

function BarcodeCanvas({ data, width = 300, height = 60 }: { data: string; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const binary = generateBarcode128B(data);
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    const barWidth = width / binary.length;
    for (let i = 0; i < binary.length; i++) {
      if (binary[i] === "1") {
        ctx.fillStyle = "black";
        ctx.fillRect(i * barWidth, 0, barWidth + 0.5, height);
      }
    }
  }, [data, width, height]);

  return <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px` }} />;
}

interface ReceiptOrderItem {
  quantity: number;
  price: number;
  product?: { name?: string | null } | null;
}

interface ReceiptOrder {
  id: string;
  createdAt: string;
  paymentGateway?: string | null;
  status?: string | null;
  paymentId?: string | null;
  shippingAddress?: string | null;
   currency?: string | null;
  subtotal?: number | null;
  discountAmount?: number | null;
  couponCode?: string | null;
  total?: number | null;
  items?: ReceiptOrderItem[];
}

export default function ReceiptPage() {
  const { id, locale } = useParams() as { id: string; locale: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<ReceiptOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [scratched, setScratched] = useState(false);
  const [auraWon, setAuraWon] = useState(0);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showScratchModal, setShowScratchModal] = useState(false);
  const [scratchProcess, setScratchProcess] = useState<"hidden" | "scratching" | "revealed">("hidden");
  const [isWin, setIsWin] = useState(true);

  // Derive isPaid status based on order (it may be null initially, but that's okay for effects safely checked)
  const isCod = order?.paymentGateway?.toLowerCase() === "cod";
  const isPaid = order ? ["paid", "delivered", "shipped"].includes(String(order.status || "").toLowerCase()) : false;
  const isSuccessful = isPaid || (isCod && order?.status === "pending");

  useEffect(() => {
    if (typeof window !== "undefined" && isPaid) {
      if (!localStorage.getItem(`scratched_${id}`)) {
         // Show modal only if they never scratched it for this paid order
         setTimeout(() => setShowScratchModal(true), 1500);
      } else {
        setScratched(true);
        setAuraWon(Number(localStorage.getItem(`aura_${id}`) || 0));
      }
    }
  }, [id, isPaid]);

  const handleScratch = async () => {
    if (scratched || scratchProcess !== "hidden") return;
    setScratchProcess("scratching");
    
    // 80% win rate
    const won = Math.random() < 0.8;
    setIsWin(won);
    const randomAura = won ? Math.floor(Math.random() * 21) + 5 : 0;
    
    // Artificial scratch delay for animation
    setTimeout(async () => {
      setAuraWon(randomAura);
      setScratched(true);
      setScratchProcess("revealed");
      localStorage.setItem(`scratched_${id}`, "true");
      localStorage.setItem(`aura_${id}`, String(randomAura));

      if (randomAura > 0) {
        try {
          await fetch('/api/rewards/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: randomAura })
          });
          router.refresh(); // Refresh NextJS tree to update the auraCoins in NavActions dropdown
        } catch {}
      }
    }, 1500);
  };

  const closeScratchModal = () => setShowScratchModal(false);
  const verificationAttemptedRef = useRef(false);
  const { clearCart } = useCart();
  const clearCartRef = useRef(clearCart);

  useEffect(() => {
    clearCartRef.current = clearCart;
  }, [clearCart]);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
        // Generate QR code with order verification URL
        const verifyUrl = `${window.location.origin}/${locale}/orders/${id}/track`;
        QRCode.toDataURL(verifyUrl, { width: 150, margin: 1, color: { dark: "#000", light: "#fff" } })
          .then(setQrDataUrl);
      })
      .catch(() => setLoading(false));
  }, [id, locale]);

  useEffect(() => {
    const verifyIfNeeded = async () => {
      if (!order || verificationAttemptedRef.current || order.status === "paid") return;

      const paymentState = searchParams.get("payment");
      if (paymentState !== "success") return;

      const gateway = searchParams.get("gateway") || order.paymentGateway;
      const paymentId =
        searchParams.get("paymentId") ||
        searchParams.get("token") ||
        searchParams.get("transaction_id") ||
        order.paymentId;

      if (!paymentId) return;

      verificationAttemptedRef.current = true;
      setVerifyingPayment(true);

      try {
        const response = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id, paymentId, gateway }),
        });

        const result = await response.json();
        if (response.ok && result.verified) {
          clearCartRef.current();
          setOrder((prev) => (prev ? { ...prev, status: "paid", paymentId } : prev));
        } else {
          console.warn("Verification returned non-verified:", result);
        }
      } catch (err) {
        console.error("Verification error:", err);
      } finally {
        setVerifyingPayment(false);
      }
    };

    verifyIfNeeded();
  }, [order, searchParams]);

  // Poll for order status updates if still pending
  useEffect(() => {
    if (!order || order.status === "paid" || order.status === "delivered" || order.status === "shipped") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (data.status !== order.status) {
          setOrder(data);
          if (["paid", "delivered", "shipped"].includes(data.status)) {
            clearInterval(interval);
          }
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [order?.status, id]);

  useEffect(() => {
    if (order?.status === "paid") {
      clearCartRef.current();
    }
  }, [order?.status]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!order) return;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;

    const ensureSpace = (requiredSpace: number) => {
      if (y + requiredSpace > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
    };

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("KODA STORE", 20, y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Official Purchase Receipt", 20, y + 7);
    y += 20;

    const pdfCurrency = normalizeCurrency(order.currency || "USD");

    // Order Info
    doc.setFontSize(9);
    doc.text(`Order ID: ${order.id}`, 20, y);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, y + 5);
    doc.text(`Payment: ${order.paymentGateway?.toUpperCase()} (${pdfCurrency})`, 20, y + 10);
    doc.text(`Status: ${order.status?.toUpperCase()}`, 20, y + 15);

    // QR code on right
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", w - 50, y - 5, 30, 30);
    }
    y += 25;

    // Divider
    doc.setDrawColor(0);
    doc.line(20, y, w - 20, y);
    y += 8;

    // Shipping
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.text("Ship To:", 20, y);
    doc.setFont("helvetica", "normal");
    const shippingLines = doc.splitTextToSize(order.shippingAddress || "N/A", w - 70);
    doc.text(shippingLines, 45, y);
    y += Math.max(10, shippingLines.length * 4 + 4);

    // Table Header
    ensureSpace(18);
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y, w - 40, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Item", 22, y + 5.5);
    doc.text("Qty", 120, y + 5.5);
    doc.text("Price", 140, y + 5.5);
    doc.text("Total", 165, y + 5.5);
    y += 12;

    // Items
    doc.setFont("helvetica", "normal");
    if (order.items) {
      for (const item of order.items) {
        ensureSpace(10);
        const itemNameLines = doc.splitTextToSize(item.product?.name || "Product", 90);
        doc.text(itemNameLines, 22, y);
        doc.text(String(item.quantity), 122, y);
        doc.text(`${formatCurrency(item.price, pdfCurrency, locale)}`, 140, y);
        doc.text(`${formatCurrency(item.price * item.quantity, pdfCurrency, locale)}`, 165, y);
        y += Math.max(7, itemNameLines.length * 4);
      }
    }

    // Total
    y += 5;
    ensureSpace(18);
    doc.line(20, y, w - 20, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Total: ${formatCurrency(order.total || 0, pdfCurrency, locale)}`, w - 65, y);

    // Barcode - render actual barcode into PDF
    y += 12;
    ensureSpace(28);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Order Barcode:", 20, y);
    y += 3;

    // Generate barcode image from canvas
    const barcodeData = order.id.substring(0, 12).toUpperCase();
    const binary = generateBarcode128B(barcodeData);
    const barcodeCanvas = document.createElement("canvas");
    const barcodeW = 400;
    const barcodeH = 60;
    barcodeCanvas.width = barcodeW;
    barcodeCanvas.height = barcodeH;
    const bCtx = barcodeCanvas.getContext("2d");
    if (bCtx) {
      bCtx.fillStyle = "white";
      bCtx.fillRect(0, 0, barcodeW, barcodeH);
      const barWidth = barcodeW / binary.length;
      for (let i = 0; i < binary.length; i++) {
        if (binary[i] === "1") {
          bCtx.fillStyle = "black";
          bCtx.fillRect(i * barWidth, 0, barWidth + 0.5, barcodeH);
        }
      }
      const barcodeDataUrl = barcodeCanvas.toDataURL("image/png");
      doc.addImage(barcodeDataUrl, "PNG", 20, y, 78, 18);
      y += 20;
      doc.setFontSize(7);
      doc.text(barcodeData, 20, y);
    }

    // Footer
    y = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(7);
    doc.text("This is a computer-generated receipt. No signature required.", 20, y);
    doc.text(`Koda Store | Generated ${new Date().toISOString()}`, 20, y + 4);

    doc.save(`KodaStore-Receipt-${order.id.substring(0, 8).toUpperCase()}.pdf`);
  };

  if (loading) return <div className="container section empty-state"><h2>Loading receipt...</h2></div>;
  if (!order) return <div className="container section empty-state"><h2>Order not found.</h2><Link href={`/${locale}/orders`}>Go to My Orders</Link></div>;

  const orderId = order.id.substring(0, 12).toUpperCase();
  const canPayOnline = ["pending", "failed", "cancelled"].includes(String(order.status || "").toLowerCase());
  const isCodOrder = String(order.paymentGateway || "").toLowerCase() === "cod";
  const orderCurrency = normalizeCurrency(order.currency || "USD");
  const subtotal = Number(order.subtotal ?? order.total ?? 0);
  const discountAmount = Number(order.discountAmount ?? 0);
  const finalTotal = Number(order.total ?? 0);

  return (
    <div className="container section">
      {verifyingPayment && (
        <div className="no-print" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--secondary-container)', color: 'var(--on-secondary-container)', fontSize: '0.8125rem', fontWeight: 600 }}>
          Verifying payment status with gateway...
        </div>
      )}

      {canPayOnline && (
        <div className="no-print" style={{ marginBottom: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {isCodOrder ? "This order is currently Cash on Delivery." : "This order payment is still pending."}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '0.75rem' }}>
            {isCodOrder ? "Want faster dispatch? Complete payment online now." : "Complete payment online to continue processing this order."}
          </p>
          <PayOnlineButton orderId={order.id} locale={locale} />
        </div>
      )}

      {/* Actions bar (hidden in print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link href={`/${locale}/orders`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
          <ArrowLeft size={16} /> Back to My Orders
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print
          </button>
          <button className="btn btn-primary" onClick={handleDownloadPDF}>
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      {/* Receipt Body */}
      <div ref={receiptRef} className="admin-card" style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem', fontFamily: 'monospace, sans-serif' }}>
        {/* Success Banner */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '1.5rem', background: isSuccessful ? '#16a34a10' : '#d9770615', borderRadius: '8px' }}>
          <CheckCircle size={36} color={isSuccessful ? "#16a34a" : "#d97706"} style={{ marginBottom: '0.75rem' }} />
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            {isPaid ? "Payment Successful" : isCod ? "Order Confirmed" : "Payment Pending"}
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>
            {isPaid ? "Thank you for your order!" : isCod ? "Your order has been placed and will be paid on delivery." : "Your payment is still being confirmed with the gateway."}
          </p>
        </div>

        {/* Inline block removed in favor of Modal */}

        {/* Store Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid #000' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>KODA STORE</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Official Purchase Receipt</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8125rem' }}>
            <p><strong>Order ID:</strong> {orderId}</p>
            <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Payment:</strong> {order.paymentGateway?.toUpperCase() || "STRIPE"}</p>
            <p><strong>Status:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>{order.status?.toUpperCase()}</span></p>
          </div>
        </div>

        {/* Shipping Info */}
        <div style={{ marginBottom: '2rem', fontSize: '0.875rem' }}>
          <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Ship To:</p>
          <p style={{ color: 'var(--on-surface-variant)' }}>{order.shippingAddress || "Address on file"}</p>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem 0', fontWeight: 700 }}>Product</th>
              <th style={{ textAlign: 'center', padding: '0.5rem 0', fontWeight: 700 }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '0.5rem 0', fontWeight: 700 }}>Unit Price</th>
              <th style={{ textAlign: 'right', padding: '0.5rem 0', fontWeight: 700 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: ReceiptOrderItem, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e5e5' }}>
                <td style={{ padding: '0.75rem 0' }}>{item.product?.name || "Product"}</td>
                <td style={{ textAlign: 'center', padding: '0.75rem 0' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right', padding: '0.75rem 0' }}>{formatCurrency(item.price || 0, orderCurrency, locale)}</td>
                <td style={{ textAlign: 'right', padding: '0.75rem 0', fontWeight: 600 }}>{formatCurrency((item.price || 0) * item.quantity, orderCurrency, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ borderTop: '2px solid #000', paddingTop: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <span>Subtotal</span><span>{formatCurrency(subtotal, orderCurrency, locale)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <span>Shipping</span><span style={{ color: '#16a34a' }}>Free</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span style={{ color: '#166534', fontWeight: 700 }}>-{formatCurrency(discountAmount, orderCurrency, locale)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, paddingTop: '0.75rem', borderTop: '1px solid #e5e5e5' }}>
            <span>{canPayOnline ? 'Total Due' : 'Total Paid'}</span><span>{formatCurrency(finalTotal, orderCurrency, locale)}</span>
          </div>
        </div>

        {/* QR Code and Barcode */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '1.5rem', borderTop: '1px dashed #ccc' }}>
          <div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>Scan to track your order:</p>
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" style={{ width: '120px', height: '120px' }} />}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>Order Barcode:</p>
            <BarcodeCanvas data={orderId} width={200} height={50} />
            <p style={{ fontSize: '0.625rem', fontFamily: 'monospace', letterSpacing: '0.1em', marginTop: '0.25rem' }}>{orderId}</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e5e5', textAlign: 'center' }}>
          <p style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)' }}>
            This is a computer-generated receipt. No signature required.
          </p>
          <p style={{ fontSize: '0.625rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>
            Koda Store | support@kodastore.com | Generated {new Date().toISOString().split('T')[0]}
          </p>
        </div>
      </div>
      {/* Scratch Modal Overlay */}
      {showScratchModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', padding: '1rem' }} onClick={closeScratchModal}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              background: 'linear-gradient(180deg, #111, #0a0a0a)', 
              borderRadius: '24px', 
              width: '100%', 
              maxWidth: '400px', 
              border: '1px solid rgba(255,255,255,0.1)', 
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
              position: 'relative',
              overflow: 'hidden',
              transform: 'scale(1)',
              animation: 'fadeInUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            {/* Modal Header */}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
              <button onClick={closeScratchModal} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '2.5rem 2rem 2rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem' }}>Mystery Reward 🎁</h2>
              <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '2rem' }}>Every purchase gives you a chance to win exclusive Aura.</p>

              {/* The Scratch Card */}
              <div 
                style={{
                  position: 'relative', width: '100%', height: '180px', borderRadius: '16px', overflow: 'hidden', 
                  cursor: scratchProcess === 'hidden' ? 'pointer' : 'default',
                  background: 'linear-gradient(135deg, #1e1b4b, #3730a3)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)', marginBottom: '2rem'
                }}
                onClick={handleScratch}
              >
                {/* Result Block */}
                {scratchProcess === 'revealed' && (
                  <div style={{ color: '#fff', textAlign: 'center', padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeInUp 0.6s ease-out' }}>
                    {isWin ? (
                      <>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '50%', marginBottom: '0.5rem', animation: 'pulse 2s infinite' }}>
                          <Coins size={36} color="#facc15" />
                        </div>
                        <h4 style={{ fontSize: '2rem', fontWeight: 900, color: '#facc15', marginBottom: '0.25rem', textShadow: '0 0 20px rgba(250,204,21,0.5)' }}>{auraWon} Aura</h4>
                        <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>Added to Wallet! 🎉</p>
                      </>
                    ) : (
                      <>
                        <div style={{ padding: '0.75rem', borderRadius: '50%', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '2rem' }}>😢</span>
                        </div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>Better luck next time</h4>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>No Aura awarded this time.</p>
                      </>
                    )}
                  </div>
                )}

                {/* Scratching Animation Layer */}
                {scratchProcess === 'scratching' && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'silver', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeOut 0.5s ease 1s forwards' }}>
                    <div style={{ 
                      width: '100%', height: '100%', 
                      backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.8) 50%, transparent 60%)', 
                      backgroundSize: '200% 200%', 
                      animation: 'shimmer 1.5s infinite linear' 
                    }} />
                  </div>
                )}

                {/* Unscratched Foil Layer */}
                {scratchProcess === 'hidden' && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(135deg, #d4d4d8 0%, #f4f4f5 50%, #d4d4d8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ 
                      position: 'absolute', inset: 0, opacity: 0.4, mixBlendMode: 'overlay',
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #a1a1aa 10px, #a1a1aa 20px)'
                    }} />
                    <div style={{ position: 'absolute', width: '80%', height: '80%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 70%)', mixBlendMode: 'overlay' }}></div>
                    <strong style={{ fontSize: '1.25rem', color: '#52525b', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem', textShadow: '0 1px 0 #fff' }}>
                      <Sparkles color="#71717a" /> TAP TO SCRATCH <Sparkles color="#71717a" />
                    </strong>
                  </div>
                )}
              </div>

              {/* Refer & Earn CTA */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', border: '1px dashed rgba(255,255,255,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
                  <Share2 size={20} /> <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Refer & Earn 500 Aura</span>
                </div>
                <p style={{ color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                  Want more Aura? Invite a friend! Get 100 Aura on signup + 400 more after their first delivery.
                </p>
                <Link href={`/${locale}/referrals`} className="btn" style={{ background: '#f59e0b', color: '#000', width: '100%', borderRadius: '12px', fontWeight: 800 }}>
                  Get Invite Link
                </Link>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

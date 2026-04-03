import Link from "next/link";

export default function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <div className="container section" style={{ maxWidth: "800px" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Terms & Conditions</h1>
      <p style={{ color: "var(--on-surface-variant)", marginBottom: "2rem" }}>Last updated: April 2, 2026</p>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>1. Acceptance of Terms</h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: "1.6", color: "var(--on-surface-variant)" }}>
          By accessing and using Koda Store, you accept and agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>2. Products & Pricing</h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: "1.6", color: "var(--on-surface-variant)" }}>
          All product prices are listed in the currency detected from your location. Prices may change without notice. We reserve the right to modify or discontinue products at any time. Product images are for illustration purposes only.
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>3. Orders & Payment</h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: "1.6", color: "var(--on-surface-variant)" }}>
          Orders are confirmed upon successful payment. We accept online payments via Stripe, Razorpay, PayPal, Flutterwave, and Cash on Delivery (COD). For COD orders, payment is collected at the time of delivery. We reserve the right to cancel any order if stock is unavailable or if fraud is suspected.
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>4. Shipping & Delivery</h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: "1.6", color: "var(--on-surface-variant)" }}>
          We ship worldwide with tracking. Free delivery on orders over $200 (or equivalent). Delivery times vary by region (typically 3-7 business days). We are not responsible for delays caused by customs or shipping carriers.
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>5. Returns & Refunds</h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: "1.6", color: "var(--on-surface-variant)" }}>
          Returns are accepted within 30 days of delivery for eligible products. Items must be unused and in original packaging. Refunds are processed to the original payment method within 5-10 business days. Shipping costs for returns are the customer's responsibility unless the item is defective.
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>6. Coupons & Discounts</h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: "1.6", color: "var(--on-surface-variant)" }}>
          Coupon codes are subject to availability, minimum order values, and expiration dates. Only one coupon can be applied per order. We reserve the right to modify or revoke coupons at any time.
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>7. User Accounts</h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: "1.6", color: "var(--on-surface-variant)" }}>
          You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and notify us immediately of any unauthorized access. We reserve the right to suspend or terminate accounts that violate these terms.
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>8. AI Assistant & Support</h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: "1.6", color: "var(--on-surface-variant)" }}>
          Our AI assistant provides automated support for product discovery, order tracking, and general inquiries. For complex issues, you may be connected to a human support agent. AI responses are generated automatically and may not always be accurate.
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>9. Privacy</h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: "1.6", color: "var(--on-surface-variant)" }}>
          We collect and process personal data as described in our Privacy Policy. By using our services, you consent to our data practices.
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>10. Limitation of Liability</h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: "1.6", color: "var(--on-surface-variant)" }}>
          Koda Store shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our total liability shall not exceed the amount paid for the specific product or service giving rise to the claim.
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>11. Governing Law</h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: "1.6", color: "var(--on-surface-variant)" }}>
          These terms shall be governed by and construed in accordance with applicable law. Any disputes shall be resolved in the appropriate courts.
        </p>
      </div>

      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link href="/en-US" className="btn btn-primary">Back to Store</Link>
        <Link href="/en-US/auth/signup" className="btn btn-secondary">Create Account</Link>
      </div>
    </div>
  );
}

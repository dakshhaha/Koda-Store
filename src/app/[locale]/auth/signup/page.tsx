"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { User, Mail, Lock, Phone, MapPin, Globe } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    country: "US",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || "en-US";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/${locale}/auth/login?registered=true`);
      } else {
        setError(data.error || "Failed to create your curation account");
      }
    } catch (err) {
      setError("Connection error. Our curators are unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-in">
        <div className="auth-header">
          <Link href={`/${locale}`} className="logo" style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'inline-block' }}>
            KODA<span className="logo-accent">STORE</span>
          </Link>
          <h1 className="auth-title">Initialize Profile</h1>
          <p className="auth-subtitle">Join the elite editorial marketplace.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSignup}>
          {/* Identity */}
          <div className="form-group">
            <label htmlFor="name">Full Identity</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--on-surface-variant)' }} />
              <input id="name" placeholder="Johnathan Doe" style={{ paddingLeft: '2.75rem' }} value={formData.name} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Access</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--on-surface-variant)' }} />
              <input id="email" type="email" placeholder="john@example.com" style={{ paddingLeft: '2.75rem' }} value={formData.email} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Secure Cypher</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--on-surface-variant)' }} />
              <input id="password" type="password" placeholder="••••••••" style={{ paddingLeft: '2.75rem' }} value={formData.password} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Identifier</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--on-surface-variant)' }} />
              <input id="phone" type="tel" placeholder="+1 (555) 123-4567" style={{ paddingLeft: '2.75rem' }} value={formData.phone} onChange={handleInputChange} required />
            </div>
          </div>

          {/* Logistics Coordination */}
          <div style={{ margin: '1.5rem 0 1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--outline-variant)' }}>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)' }}>Delivery Logistics</h3>
          </div>

          <div className="form-group">
            <label htmlFor="address">Shipment Registry (Address)</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--on-surface-variant)' }} />
              <input id="address" placeholder="123 Curandero Blvd" style={{ paddingLeft: '2.75rem' }} value={formData.address} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input id="city" placeholder="New York" value={formData.city} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="zip">ZIP/Postal</label>
              <input id="zip" placeholder="10001" value={formData.zip} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="country">Region</label>
            <div style={{ position: 'relative' }}>
              <Globe size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--on-surface-variant)' }} />
              <select id="country" style={{ paddingLeft: '2.75rem' }} value={formData.country} onChange={handleInputChange}>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '1.5rem' }} disabled={loading}>
            {loading ? "Registering Identity..." : "Join the Curation"}
          </button>
        </form>

        <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', lineHeight: '1.5' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.35rem' }}>By creating an account, you automatically agree to our <Link href={`/${locale}/terms`} target="_blank" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Terms & Conditions</Link> and <Link href={`/${locale}/privacy`} target="_blank" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Privacy Policy</Link>.</p>
        </div>

        <div className="auth-footer">
          Already a member? <Link href={`/${locale}/auth/login`}>Authorize here</Link>
        </div>
      </div>
    </div>
  );
}

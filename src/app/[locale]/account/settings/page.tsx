"use client";

import { useState, useEffect } from "react";
import { User, MapPin, Shield, Globe, Plus, Trash2, Home, Building, Phone, Save, Lock, Eye, EyeOff, LocateFixed } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { COUNTRIES, getPhoneCode, validateZip } from "@/lib/countries";

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "security" | "preferences">("profile");
  const [user, setUser] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const { locale } = useParams();
  const router = useRouter();

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [zipError, setZipError] = useState("");
  const [addressLocating, setAddressLocating] = useState(false);
  const [addressLocationMessage, setAddressLocationMessage] = useState("");
  const [addressForm, setAddressForm] = useState({
    id: null as string | null,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    type: "shipping",
    isDefault: false
  });

  // Password change
  const [passwordData, setPasswordData] = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [uRes, aRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/user/addresses")
      ]);
      if (uRes.ok) setUser(await uRes.json());
      if (aRes.ok) {
        const aData = await aRes.json();
        if (Array.isArray(aData)) setAddresses(aData);
      }
    } catch (err) {
      console.error("Failed to load account data", err);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text: string) => { setMessage(text); setTimeout(() => setMessage(""), 3000); };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      });
      if (res.ok) showMsg("Profile saved successfully.");
      else showMsg("Failed to save profile.");
    } finally { setSaving(false); }
  };

  const handleAddressSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate zip
    if (!validateZip(addressForm.country, addressForm.zip)) {
      setZipError(`Invalid ZIP/postal code for the selected country.`);
      return;
    }
    setZipError("");
    setSaving(true);
    try {
      await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm)
      });
      setShowAddressForm(false);
      setAddressForm({ id: null, addressLine1: "", addressLine2: "", city: "", state: "", zip: "", country: "US", type: "shipping", isDefault: false });
      fetchData();
      showMsg("Address saved.");
    } finally { setSaving(false); }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try {
      await fetch("/api/user/addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      fetchData();
      showMsg("Address deleted.");
    } catch { showMsg("Failed to delete address."); }
  };

  const handleCountryChange = (newCountry: string) => {
    const c = COUNTRIES.find(x => x.code === newCountry);
    setUser({ ...user, country: newCountry, currency: c?.currency || "USD" });
  };

  const detectAddressFromLocation = () => {
    if (!navigator.geolocation) {
      setAddressLocationMessage("Location is not supported in this browser.");
      return;
    }

    setAddressLocating(true);
    setAddressLocationMessage("Requesting location permission...");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(`/api/geo/reverse?lat=${coords.latitude}&lon=${coords.longitude}`);
          if (!response.ok) throw new Error("reverse-geocode-failed");
          const data = await response.json();

          setAddressForm((prev) => ({
            ...prev,
            addressLine1: data.addressLine1 || prev.addressLine1,
            city: data.city || prev.city,
            state: data.state || prev.state,
            zip: data.zip || prev.zip,
            country: COUNTRIES.some((country) => country.code === data.countryCode) ? data.countryCode : prev.country,
          }));
          setAddressLocationMessage("Location detected. You can edit the address before saving.");
        } catch {
          setAddressLocationMessage("Unable to detect exact address. Please complete the fields manually.");
        } finally {
          setAddressLocating(false);
        }
      },
      () => {
        setAddressLocationMessage("Location permission denied. You can still enter address manually.");
        setAddressLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  if (loading) return <div className="container section empty-state"><h2>Loading your account...</h2></div>;
  if (!user) return <div className="container section empty-state"><h2>Please log in to view your account.</h2></div>;

  return (
    <div className="container section">
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Account Settings</h1>
      <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2.5rem', fontSize: '0.9375rem' }}>Manage your profile, addresses, and preferences.</p>

      {message && (
        <div style={{ padding: '0.75rem 1.25rem', background: '#16a34a15', color: '#16a34a', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2.5rem' }}>
        {/* Sidebar */}
        <aside>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {([
              { key: "profile", label: "My Profile", icon: <User size={16} /> },
              { key: "addresses", label: "Saved Addresses", icon: <MapPin size={16} /> },
              { key: "preferences", label: "Country & Currency", icon: <Globe size={16} /> },
              { key: "security", label: "Password & Security", icon: <Shield size={16} /> },
            ] as const).map(tab => (
              <button
                key={tab.key}
                className={`admin-nav-link ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div>
          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="admin-card animate-in">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Personal Information</h2>
              <form onSubmit={handleProfileSave}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input value={user.name || ""} onChange={e => setUser({...user, name: e.target.value})} placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input value={user.email || ""} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>Email cannot be changed. Contact support if needed.</p>
                </div>
                <div className="form-group">
                  <label>Phone Number (required for delivery)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      value={getPhoneCode(user.country || "US")}
                      onChange={e => {
                        const c = COUNTRIES.find(x => x.phone === e.target.value);
                        if (c) setUser({...user, country: c.code});
                      }}
                      style={{ width: '120px', flexShrink: 0 }}
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.phone}>{c.phone} ({c.code})</option>
                      ))}
                    </select>
                    <input
                      value={user.phone || ""}
                      onChange={e => setUser({...user, phone: e.target.value})}
                      placeholder="555 123 4567"
                      type="tel"
                      required
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: '1rem' }}>
                  <Save size={16} /> {saving ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </div>
          )}

          {/* ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="animate-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Saved Addresses</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => { setAddressForm({ id: null, addressLine1: "", addressLine2: "", city: "", state: "", zip: "", country: "US", type: "shipping", isDefault: false }); setAddressLocationMessage(""); setShowAddressForm(true); }}>
                  <Plus size={16} /> Add New Address
                </button>
              </div>

              {addresses.length === 0 && (
                <div className="empty-state" style={{ background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', padding: '3rem' }}>
                  <MapPin size={32} style={{ color: 'var(--on-surface-variant)', marginBottom: '1rem' }} />
                  <p>No addresses saved yet. Add one to speed up checkout.</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {addresses.map((addr: any) => (
                  <div key={addr.id} className="admin-card" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                      {addr.type === 'shipping' ? <Home size={16} color="var(--primary)" /> : <Building size={16} color="var(--tertiary)" />}
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>{addr.type}</span>
                      {addr.isDefault && <span style={{ fontSize: '0.625rem', background: '#16a34a15', color: '#16a34a', padding: '0.125rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>Default</span>}
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.name}</p>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem', marginTop: '0.25rem', lineHeight: 1.5 }}>
                      {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}<br />
                      {addr.city}, {addr.state} {addr.zip}<br />
                      {COUNTRIES.find(c => c.code === addr.country)?.name || addr.country}
                    </p>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                      <button className="btn btn-tertiary btn-sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => { setAddressForm(addr); setZipError(""); setAddressLocationMessage(""); setShowAddressForm(true); }}>Edit</button>
                      <button className="btn btn-tertiary btn-sm" style={{ color: 'var(--error)', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => deleteAddress(addr.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Address Form Modal */}
              {showAddressForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                  <div className="admin-card" style={{ width: '100%', maxWidth: '520px', margin: '1rem', maxHeight: '90vh', overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>{addressForm.id ? "Edit Address" : "Add New Address"}</h3>
                    <form onSubmit={handleAddressSave}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Auto-fill using your current location</p>
                        <button type="button" className="btn btn-tertiary btn-sm" onClick={detectAddressFromLocation} disabled={addressLocating}>
                          <LocateFixed size={14} /> {addressLocating ? "Detecting..." : "Use My Location"}
                        </button>
                      </div>
                      {addressLocationMessage && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '0.75rem' }}>{addressLocationMessage}</p>
                      )}
                      <div className="form-group">
                        <label>Street Address</label>
                        <input value={addressForm.addressLine1} onChange={e => setAddressForm({...addressForm, addressLine1: e.target.value})} placeholder="123 Main Street" required />
                      </div>
                      <div className="form-group">
                        <label>Apartment, Suite, etc. (optional)</label>
                        <input value={addressForm.addressLine2 || ""} onChange={e => setAddressForm({...addressForm, addressLine2: e.target.value})} placeholder="Apt 4B" />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>City</label>
                          <input value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} placeholder="New York" required />
                        </div>
                        <div className="form-group">
                          <label>State / Province</label>
                          <input value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} placeholder="NY" required />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>ZIP / Postal Code</label>
                          <input value={addressForm.zip} onChange={e => { setAddressForm({...addressForm, zip: e.target.value}); setZipError(""); }} placeholder="10001" required />
                          {zipError && <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{zipError}</p>}
                        </div>
                        <div className="form-group">
                          <label>Country</label>
                          <select value={addressForm.country} onChange={e => setAddressForm({...addressForm, country: e.target.value})}>
                            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Address Type</label>
                        <select value={addressForm.type} onChange={e => setAddressForm({...addressForm, type: e.target.value})}>
                          <option value="shipping">Shipping</option>
                          <option value="billing">Billing</option>
                        </select>
                      </div>
                      <div style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                          <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})} style={{ width: 'auto' }} /> Set as default address
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Address"}</button>
                        <button className="btn btn-secondary" type="button" onClick={() => setShowAddressForm(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COUNTRY & CURRENCY */}
          {activeTab === 'preferences' && (
            <div className="admin-card animate-in">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Country & Currency</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem' }}>
                Change your country to update your currency and language preferences. Prices will be shown in your selected currency.
              </p>
              <form onSubmit={handleProfileSave}>
                <div className="form-group">
                  <label>Your Country</label>
                  <select value={user.country || "US"} onChange={e => handleCountryChange(e.target.value)}>
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select value={user.currency || "USD"} onChange={e => setUser({...user, currency: e.target.value})}>
                    {[...new Set(COUNTRIES.map(c => c.currency))].sort().map(cur => {
                      const c = COUNTRIES.find(x => x.currency === cur);
                      return <option key={cur} value={cur}>{cur} ({c?.symbol})</option>;
                    })}
                  </select>
                  <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>
                    Currency is auto-set when you change country but you can override it.
                  </p>
                </div>
                <div className="form-group">
                  <label>Language</label>
                  <select value={user.locale || "en-US"} onChange={e => setUser({...user, locale: e.target.value})}>
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="hi">Hindi</option>
                    <option value="ja">Japanese</option>
                    <option value="zh">Chinese</option>
                    <option value="ar">Arabic</option>
                    <option value="pt">Portuguese</option>
                  </select>
                </div>
                <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: '1rem' }}>
                  <Save size={16} /> {saving ? "Saving..." : "Save Preferences"}
                </button>
              </form>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <div className="admin-card animate-in">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Password & Security</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (passwordData.newPass !== passwordData.confirm) { showMsg("Passwords do not match."); return; }
                if (passwordData.newPass.length < 8) { showMsg("Password must be at least 8 characters."); return; }
                setSaving(true);
                try {
                  const res = await fetch("/api/user/password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ currentPassword: passwordData.current, newPassword: passwordData.newPass })
                  });
                  if (res.ok) { showMsg("Password changed successfully."); setPasswordData({ current: "", newPass: "", confirm: "" }); }
                  else { const d = await res.json(); showMsg(d.error || "Failed to change password."); }
                } finally { setSaving(false); }
              }}>
                <div className="form-group">
                  <label>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? "text" : "password"} value={passwordData.current} onChange={e => setPasswordData({...passwordData, current: e.target.value})} required />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" value={passwordData.newPass} onChange={e => setPasswordData({...passwordData, newPass: e.target.value})} placeholder="Minimum 8 characters" required />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" value={passwordData.confirm} onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} required />
                </div>
                <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: '1rem' }}>
                  <Lock size={16} /> {saving ? "Updating..." : "Change Password"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

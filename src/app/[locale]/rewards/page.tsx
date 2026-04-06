"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Coins, Ticket, Sparkles, Gift, Share2, Copy, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface UserProfile {
  id: string;
  name: string;
  auraCoins: number;
}

export default function RewardsPage() {
  const { locale } = useParams();
  const { data: session, status: sessionStatus } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchProfile();
    } else if (sessionStatus === "unauthenticated") {
      setProfile(null);
      setLoading(false);
    }
  }, [sessionStatus]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data && data.id) {
        setProfile({
          id: data.id,
          name: data.name || "",
          auraCoins: data.auraCoins || 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile in rewards:", err);
    }
    setLoading(false);
  };

  const referralCode = profile?.id 
    ? String(profile.id).substring(0, 8).toUpperCase()
    : "";
    
  const fallbackOrigin = "https://koda-store.vercel.app";
  const origin = typeof window !== "undefined" && window.location.hostname !== "localhost" 
    ? window.location.origin 
    : fallbackOrigin;

  const inviteLink = referralCode ? `${origin}/invite/${referralCode}` : "";

  const copyReferral = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = async (cost: number, discountValue: number) => {
    if (!profile || profile.auraCoins < cost) return;
    
    if (!confirm(`Redeem ${cost} Aura Coins for a $${discountValue} discount coupon?`)) return;
    
    setRedeeming(true);
    try {
      const code = `AURA${discountValue}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      const res1 = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          description: `Aura Rewards - $${discountValue} Off`,
          discountType: "fixed",
          discountValue,
          minOrder: 0,
          active: true
        })
      });

      if (res1.ok) {
        await fetch("/api/rewards/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: -cost })
        });
        
        await fetchProfile();
        alert(`Success! Your coupon code is ${code}. It applies $${discountValue} off at checkout!`);
      } else {
        alert("Failed to redeem reward. Please try again.");
      }
    } catch {
      alert("Error redeeming reward.");
    }
    setRedeeming(false);
  };

  if (loading) return <div className="container section empty-state"><h2>Loading Aura...</h2></div>;
  if (!profile) return <div className="container section empty-state"><h2>Please login to view your Aura Rewards.</h2><Link href={`/${locale}/auth/login`} className="btn btn-primary mt-4">Login</Link></div>;

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh', color: 'var(--on-surface)', paddingBottom: '5rem', fontFamily: 'var(--font-body)' }}>
      {/* Hero Section */}
      <div style={{ position: 'relative', padding: '6rem 2rem 4rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '800px', height: '400px', background: 'radial-gradient(circle, rgba(100, 57, 0, 0.08) 0%, rgba(0,0,0,0) 70%)', zIndex: 0, pointerEvents: 'none' }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '80px', 
            height: '80px', 
            borderRadius: '24px', 
            background: 'linear-gradient(135deg, var(--primary), var(--primary-container))', 
            marginBottom: '1.5rem', 
            boxShadow: '0 20px 40px rgba(100, 57, 0, 0.15)', 
            animation: 'pulse 3s infinite' 
          }}>
            <Sparkles size={40} color="#fff" />
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em', color: 'var(--primary)' }}>Aura Rewards</h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--on-surface-variant)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
            Premium loyalty for distinguished curators. Accumulate Aura and unlock exclusive vault privileges.
          </p>
        </div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          
          {/* Wallet Card */}
          <div style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', borderRadius: '32px', padding: '2.5rem', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--primary)' }}></div>
            <h3 style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
              <Coins size={16} /> My Aura Balance
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <div style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1, color: 'var(--on-surface)' }}>{profile.auraCoins}</div>
              <div style={{ fontSize: '1.25rem', color: 'var(--primary)', fontWeight: 700 }}>Coins</div>
            </div>
            
            <Link href={`/${locale}/orders`} style={{ marginTop: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.625rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none' }}>
              <Sparkles size={18} /> View Unclaimed Rewards <ArrowRight size={16} />
            </Link>
          </div>

          {/* Referral Summary */}
          <div style={{ background: 'var(--surface-container-highest)', borderRadius: '32px', padding: '2.5rem', border: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Earn 500 Aura</h3>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem', lineHeight: 1.6 }}>Share your invite link. When they shop, you both receive 500 Aura Coins instantly.</p>
            <Link href={`/${locale}/referrals`} className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem' }}>
              Get My Invite Link
            </Link>
          </div>
        </div>

        {/* Store Section */}
        <div style={{ marginTop: '4rem', background: 'var(--surface-container-low)', padding: '3rem', borderRadius: '40px', border: '1px solid var(--outline-variant)' }}>
          <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
             <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>The Redemption Vault</h2>
             <p style={{ color: 'var(--on-surface-variant)' }}>Exchange your Aura for store credit coupons.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* $10 Credit */}
            <div className="reward-card highlight-hover" style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: '28px', padding: '2.5rem', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
              <div style={{ height: '64px', width: '64px', borderRadius: '20px', background: 'rgba(100, 57, 0, 0.05)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Ticket size={28} />
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>$10 Reward</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '2.5rem', flex: 1, lineHeight: 1.6 }}>A flat $10 discount applicable to any order. One-time use coupon.</p>
              
              <button 
                onClick={() => handleRedeem(1000, 10)}
                disabled={redeeming || profile.auraCoins < 1000}
                className="btn"
                style={{ 
                  width: '100%', 
                  background: profile.auraCoins >= 1000 ? 'var(--primary)' : 'var(--outline-variant)', 
                  color: profile.auraCoins >= 1000 ? 'white' : 'var(--on-surface-variant)',
                  cursor: profile.auraCoins >= 1000 ? 'pointer' : 'not-allowed',
                  fontWeight: 700
                }}
              >
                Redeem for 1,000 Aura
              </button>
            </div>

            {/* $25 Credit */}
            <div className="reward-card highlight-hover" style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: '28px', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '64px', width: '64px', borderRadius: '20px', background: 'rgba(100, 57, 0, 0.05)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Ticket size={28} />
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>$25 Reward</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '2.5rem', flex: 1, lineHeight: 1.6 }}>Premium reward for top curators. $25 discount on your entire purchase.</p>
              
              <button 
                onClick={() => handleRedeem(2500, 25)}
                disabled={redeeming || profile.auraCoins < 2500}
                className="btn"
                style={{ 
                  width: '100%', 
                  background: profile.auraCoins >= 2500 ? 'var(--primary)' : 'var(--outline-variant)', 
                  color: profile.auraCoins >= 2500 ? 'white' : 'var(--on-surface-variant)',
                  cursor: profile.auraCoins >= 2500 ? 'pointer' : 'not-allowed',
                  fontWeight: 700
                }}
              >
                Redeem for 2,500 Aura
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

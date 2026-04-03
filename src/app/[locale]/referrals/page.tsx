"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Share2, Copy, CheckCircle2, Gift, Users, ArrowRight, Clock, CheckCircle, Award } from "lucide-react";
import Link from "next/link";

interface ReferralEntry {
  id: string;
  status: string;
  rewardAwarded: boolean;
  createdAt: string;
  referred: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  };
}

export default function ReferralsPage() {
  const { locale } = useParams();
  const [profile, setProfile] = useState<{id: string, name: string, auraCoins: number} | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referralStats, setReferralStats] = useState<{ totalReferrals: number; registeredCount: number; rewardedCount: number } | null>(null);
  const [referralHistory, setReferralHistory] = useState<ReferralEntry[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchReferralStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      if (data.authenticated && data.user) {
        const rawUser = data.user;
        setProfile({
          id: rawUser.userId || rawUser.id || "",
          name: rawUser.name || "",
          auraCoins: rawUser.auraCoins || 0,
        });
      }
    } catch {}
    setLoading(false);
  };

  const fetchReferralStats = async () => {
    try {
      const res = await fetch("/api/referrals/stats", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        console.log("Referral stats received:", JSON.stringify(data, null, 2));
        setReferralStats({
          totalReferrals: data.totalReferrals,
          registeredCount: data.registeredCount,
          rewardedCount: data.rewardedCount,
        });
        setReferralHistory(data.referrals || []);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Referral stats failed:", res.status, errData);
      }
    } catch (err) {
      console.error("Referral stats fetch error:", err);
    }
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

  if (loading) return (
    <div className="container section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="loader"></div>
    </div>
  );

  if (!profile) {
    return (
      <div className="container section empty-state">
        <Users size={48} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
        <h2>Sign in to start referring</h2>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem' }}>Share Koda Store with your friends and earn Aura together.</p>
        <Link href={`/${locale}/auth/login`} className="btn btn-primary">Login to Account</Link>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh', color: 'var(--on-surface)', paddingBottom: '5rem', transition: 'background-color 0.3s' }}>
      {/* Hero Section */}
      <div style={{ position: 'relative', padding: '6rem 2rem 4rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: '800px', 
          height: '400px', 
          background: 'radial-gradient(circle, rgba(100, 57, 0, 0.1) 0%, rgba(0,0,0,0) 70%)', 
          zIndex: 0, 
          pointerEvents: 'none' 
        }}></div>

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
            boxShadow: '0 20px 40px rgba(100, 57, 0, 0.2)' 
          }}>
            <Users size={36} color="#fff" />
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Invite friends. <span style={{ color: 'var(--primary)' }}>Earn Aura.</span>
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--on-surface-variant)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Share the curated experience of Koda Store. When a friend joins and completes their first purchase, you both get rewarded.
          </p>

          <div style={{ 
            marginTop: '2rem',
            background: 'var(--surface-container-low)', 
            padding: '1rem 1.5rem', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--outline-variant)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '1rem' 
          }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 10px #16a34a' }}></div>
            <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', fontWeight: 600 }}>Active Program: <span style={{ color: 'var(--on-surface)' }}>500 Aura Per Referral</span></span>
          </div>

          <div style={{ 
            marginTop: '1.5rem',
            background: 'var(--surface-container-lowest)', 
            padding: '1.25rem 1.5rem', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--outline-variant)', 
            display: 'inline-flex', 
            flexDirection: 'column',
            gap: '0.5rem',
            textAlign: 'left',
            maxWidth: '500px'
          }}>
            <span style={{ color: 'var(--on-surface)', fontSize: '0.875rem', fontWeight: 700 }}>How rewards are split:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ background: 'rgba(100, 57, 0, 0.1)', color: 'var(--primary)', padding: '0.25rem 0.625rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>100 Aura</span>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem' }}>Credited instantly when your friend signs up</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', padding: '0.25rem 0.625rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>400 Aura</span>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem' }}>Credited after their first order is delivered</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
        {/* Referral Stats Cards */}
        {referralStats && referralStats.totalReferrals > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem', 
            marginBottom: '3rem' 
          }}>
            <div style={{ 
              background: 'var(--surface-container)', 
              border: '1px solid var(--outline-variant)', 
              borderRadius: '20px', 
              padding: '1.5rem', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{referralStats.totalReferrals}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Total Invites</div>
            </div>
            <div style={{ 
              background: 'var(--surface-container)', 
              border: '1px solid var(--outline-variant)', 
              borderRadius: '20px', 
              padding: '1.5rem', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#16a34a' }}>{referralStats.registeredCount}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Joined</div>
            </div>
            <div style={{ 
              background: 'var(--surface-container)', 
              border: '1px solid var(--outline-variant)', 
              borderRadius: '20px', 
              padding: '1.5rem', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>{referralStats.rewardedCount * 400 + referralStats.totalReferrals * 100}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Aura Earned</div>
            </div>
          </div>
        )}

        {/* Referral Link Card */}
        <div style={{ 
          background: 'var(--surface-container)', 
          border: '1px solid var(--outline-variant)', 
          borderRadius: '32px', 
          padding: 'clamp(1.5rem, 5vw, 3rem)', 
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center', 
          marginBottom: '3rem' 
        }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>Your Unique Invite Link</h3>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            gap: '0.75rem', 
            background: 'var(--surface-container-lowest)', 
            borderRadius: '20px', 
            border: '1px solid var(--outline-variant)', 
            padding: '0.75rem', 
            alignItems: 'center', 
            marginBottom: '2rem' 
          }}>
            <div style={{ 
              flex: '1 1 200px', 
              padding: '0.5rem 1rem', 
              color: 'var(--on-surface)', 
              fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', 
              fontFamily: 'var(--font-body)', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap', 
              textAlign: 'left',
              fontWeight: 500
            }}>
              {inviteLink || "Generating link..."}
            </div>
            <button 
              onClick={copyReferral}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.625rem', 
                background: 'var(--primary)', 
                color: 'var(--on-primary)', 
                border: 'none', 
                borderRadius: '14px', 
                padding: '0.875rem 1.5rem', 
                fontWeight: 700, 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                minWidth: '140px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {copied ? <><CheckCircle2 size={18} /> Copied!</> : <><Copy size={18} /> Copy Link</>}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
            <div style={{ padding: '2rem', background: 'var(--surface-container-low)', borderRadius: '24px', border: '1px solid var(--outline-variant)' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><Share2 size={24} /></div>
              <h4 style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '1rem' }}>1. Share</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>Send your link to friends who appreciate quality.</p>
            </div>
            <div style={{ padding: '2rem', background: 'var(--surface-container-low)', borderRadius: '24px', border: '1px solid var(--outline-variant)' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><Gift size={24} /></div>
              <h4 style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '1rem' }}>2. They Shop</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>They complete their first order on Koda Store.</p>
            </div>
            <div style={{ padding: '2rem', background: 'var(--surface-container-low)', borderRadius: '24px', border: '1px solid var(--outline-variant)' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><CheckCircle2 size={24} /></div>
              <h4 style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '1rem' }}>3. Win-Win</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>You get 100 Aura on signup + 400 more after their first delivery.</p>
            </div>
          </div>
        </div>

        {/* Referral History */}
        <div style={{ 
          background: 'var(--surface-container)', 
          border: '1px solid var(--outline-variant)', 
          borderRadius: '32px', 
          padding: 'clamp(1.5rem, 5vw, 3rem)', 
          boxShadow: 'var(--shadow-lg)',
          marginBottom: '3rem' 
        }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Your Referrals</h3>
          {referralHistory.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {referralHistory.map((ref) => (
                <div key={ref.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--surface-container-low)',
                  borderRadius: '16px',
                  padding: '1rem 1.5rem',
                  border: '1px solid var(--outline-variant)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}>
                      {(ref.referred.name || ref.referred.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{ref.referred.name || ref.referred.email.split('@')[0]}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} />
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {ref.rewardAwarded ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: 'rgba(22, 163, 74, 0.1)',
                        color: '#16a34a',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}>
                        <Award size={14} /> +500 Aura
                      </span>
                    ) : ref.status === 'registered' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}>
                        <Award size={14} /> +100 Aura
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: 'rgba(107, 114, 128, 0.1)',
                        color: '#6b7280',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}>
                        <Clock size={14} /> Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--on-surface-variant)' }}>
              <Users size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.875rem' }}>No referrals yet. Share your invite link to get started!</p>
            </div>
          )}
        </div>

        {/* Community Stats or CTA */}
        <div style={{ 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, var(--primary), var(--primary-container))', 
          padding: '3rem', 
          borderRadius: '32px', 
          color: 'var(--on-primary)',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Ready to grow the circle?</h3>
          <p style={{ opacity: 0.9, marginBottom: '2rem', maxWidth: '500px', marginInline: 'auto' }}>Every referral helps us build a better marketplace of curated essentials.</p>
          <Link href={`/${locale}/rewards`} className="btn" style={{ background: '#fff', color: 'var(--primary)', padding: '1rem 2.5rem', borderRadius: '16px', fontSize: '1rem' }}>
            Browse Rewards Store <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}

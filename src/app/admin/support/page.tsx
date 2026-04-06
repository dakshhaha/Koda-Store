"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, User, Clock, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function AdminSupportPortal() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/admin/support/list");
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && sessions.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <MessageSquare /> Customer Support
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div className={`badge ${sessions.length > 0 ? 'badge-error' : 'badge-success'}`}>
             {sessions.length} Urgent Tickets
           </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state animate-in">
          <CheckCircle size={48} style={{ color: '#16a34a', marginBottom: '1rem' }} />
          <h2>Everything is under control.</h2>
          <p>The AI is currently handling all customer questions.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {sessions.map(session => {
            const lastMessage = session.chatMessages?.[0];

            return (
              <div key={session.id} className="admin-card animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="user-profile-badge" style={{ padding: '0.75rem', width: '40px', height: '40px', justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
                      <User size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem' }}>{session.user?.name || "Guest"}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{session.user?.email || "No email"}</p>
                    </div>
                  </div>
                  <span className="badge badge-warning">Human Needed</span>
                </div>

                <div style={{ padding: '1rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', flex: 1 }}>
                   <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>Last Message</p>
                   <p style={{ fontSize: '0.875rem', fontStyle: 'italic' }}>&quot;{lastMessage?.content || "No messages"}&quot;</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                    <Clock size={14} /> Updated at {new Date(session.updatedAt).toLocaleTimeString()}
                  </div>
                  <Link href={`/admin/support/${session.id}`} className="btn btn-primary btn-sm">Respond to Customer</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Access Control Information */}
      <div className="admin-card" style={{ marginTop: '4rem', background: 'var(--on-surface)', color: 'white' }}>
         <h2 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1rem' }}>Admin Support Console</h2>
         <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', lineHeight: '1.6' }}>
            This portal gives you access to customer profiles, order history, and chat logs to provide help. 
            All messages are logged and saved securely in our database.
         </p>
         <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem' }}>
            <div>
               <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.5 }}>Service Status</p>
               <p style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={14} color="#f59e0b" /> Operations Normal</p>
            </div>
            <div>
               <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.5 }}>Security</p>
               <p style={{ fontWeight: 700 }}>Securely Encrypted</p>
            </div>
         </div>
      </div>
    </div>
  );
}

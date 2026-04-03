"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { User, Bot, Send, Loader2, CheckCircle, Shield, Key, Mail, Ban, RotateCcw, ChevronRight, LayoutGrid } from "lucide-react";

interface Message {
  role: string;
  content: string;
  timestamp?: string;
  isHuman?: boolean;
}

interface AdminChatInterfaceProps {
  sessionId: string;
  initialMessages: Message[];
  user?: { id: string; email: string; name: string | null } | null;
  orders?: Array<{ id: string; status: string; total: number; createdAt: Date }>;
}

export default function AdminChatInterface({ sessionId, initialMessages, user, orders = [] }: AdminChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Audio notification with resume logic
  const playNotificationSound = useCallback(async () => {
     try {
       if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
       }
       if (audioCtxRef.current.state === "suspended") {
          await audioCtxRef.current.resume();
       }
       
       // Bubble/Heavy Pop Sound
       const oscillator = audioCtxRef.current.createOscillator();
       const gainNode = audioCtxRef.current.createGain();
       
       oscillator.connect(gainNode);
       gainNode.connect(audioCtxRef.current.destination);
       
       oscillator.type = "triangle";
       oscillator.frequency.setValueAtTime(150, audioCtxRef.current.currentTime);
       oscillator.frequency.exponentialRampToValueAtTime(450, audioCtxRef.current.currentTime + 0.1);
       
       gainNode.gain.setValueAtTime(0.2, audioCtxRef.current.currentTime);
       gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.15);
       
       oscillator.start();
       oscillator.stop(audioCtxRef.current.currentTime + 0.15);
     } catch (err) {}
  }, []);

  // Pre-emptively resume on first interaction
  useEffect(() => {
    const resume = () => {
      audioCtxRef.current?.resume();
      window.removeEventListener("mousedown", resume);
    };
    window.addEventListener("mousedown", resume);
    return () => window.removeEventListener("mousedown", resume);
  }, []);

  useEffect(() => {
    const pollId = setInterval(async () => {
       try {
          const res = await fetch(`/api/admin/support/session?id=${sessionId}`);
          const data = await res.json();
          if (data.messages) {
             const newMsgs = JSON.parse(data.messages);
             if (newMsgs.length > messages.length) {
                if (newMsgs[newMsgs.length - 1].role === "user") playNotificationSound();
                setMessages(newMsgs);
             }
          }
       } catch (err) {}
    }, 2000);
    return () => clearInterval(pollId);
  }, [sessionId, messages.length, playNotificationSound]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    
    // Explicitly resume audio context on send too
    audioCtxRef.current?.resume();

    setLoading(true);
    try {
      const res = await fetch("/api/admin/support/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content: input }),
      });

      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: input, timestamp: new Date().toISOString(), isHuman: true }]);
        setInput("");
      }
    } catch (err) {
      alert("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, params: any = {}) => {
    if (!user || !user.id) return;
    const confirmMsg = `Are you sure?`;
    if (!confirm(confirmMsg)) return;

    setActionLoading(action);
    try {
      const res = await fetch("/api/admin/support/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: user.id, ...params }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Done");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const resolveTicket = async () => {
    if (!confirm("Resolve ticket?")) return;
    setResolving(true);
    try {
      const res = await fetch("/api/admin/support/message", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) });
      if (res.ok) window.location.href = "/admin/support";
    } catch (err) {
       alert("Error resolving.");
    } finally {
       setResolving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--surface-container-low)', overflow: 'hidden' }}>
      {/* Dynamic Header */}
      <div style={{ padding: '0.75rem 2rem', background: 'white', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, zIndex: 10 }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--primary-container)', color: 'var(--on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
               {user?.name?.[0] || "?"}
            </div>
            <div>
               <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>{user?.name || "Guest User"}</h2>
               <p style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{user?.email || "No email provided"}</p>
            </div>
         </div>
         <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={resolveTicket} className="btn" style={{ background: '#16a34a', color: 'white', padding: '0.5rem 1rem', fontSize: '12px', borderRadius: 'var(--radius-md)' }} disabled={resolving}>
               {resolving ? <Loader2 className="animate-spin" size={14} /> : "Resolve Session"}
            </button>
         </div>
      </div>

      {/* Optimized Chat Area */}
      <div 
        ref={scrollRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          background: 'var(--surface-container-low)'
        }}
      >
        {messages.filter(m => m.role !== "system").map((m, i) => (
          <div key={i} style={{ 
            alignSelf: m.role === "user" ? 'flex-start' : 'flex-end',
            maxWidth: '75%',
            display: 'flex',
            gap: '1rem',
            flexDirection: m.role === "user" ? 'row' : 'row-reverse'
          }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: m.role === "user" ? 'white' : 'var(--on-surface)', color: m.role === "user" ? 'var(--primary)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
               {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div style={{ 
               padding: '1.25rem', 
               borderRadius: m.role === "user" ? '0 1.25rem 1.25rem 1.25rem' : '1.25rem 0 1.25rem 1.25rem',
               background: m.role === "user" ? 'white' : 'var(--on-surface)',
               color: m.role === "user" ? 'black' : 'white',
               boxShadow: 'var(--shadow-sm)',
               border: m.role === "user" ? '1px solid var(--outline-variant)' : 'none',
               fontSize: '0.925rem',
               lineHeight: '1.6',
               wordBreak: 'break-word',
               overflowWrap: 'anywhere'
            }}>
               {m.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ padding: '0.75rem 1.5rem', background: 'white', borderTop: '1px solid var(--outline-variant)', flexShrink: 0 }}>
         <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', maxWidth: '1000px', margin: '0 auto' }}>
            <input 
               style={{ flex: 1, padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: '0.9rem' }}
               placeholder="Type your message here..."
               value={input}
               onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 1.25rem', borderRadius: 'var(--radius-lg)' }} disabled={loading}>
               {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
         </form>
      </div>

      {/* FIXED FEATURES PANEL - Improved Responsiveness */}
      <div style={{ 
         background: 'white', 
         borderTop: '3px solid var(--primary)', 
         padding: '1.25rem 1.5rem', 
         display: 'flex', 
         gap: '2rem',
         flexShrink: 0,
         minHeight: '220px',
         width: '100%',
         overflowX: 'auto',
         flexWrap: 'wrap'
      }}>
         {/* Identity Section */}
         <div style={{ minWidth: '280px', flex: '1 0 280px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Shield size={14} /> Identity Management
            </h4>
            {!user?.id ? (
               <div style={{ padding: '1rem', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--outline-variant)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)' }}>GUEST SESSION</p>
                  <p style={{ fontSize: '0.65rem', opacity: 0.7 }}>No account actions available.</p>
               </div>
            ) : (
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.75rem', height: 'auto', flexDirection: 'column', gap: '0.5rem' }} onClick={() => {
                     const pass = prompt("Enter new temporary password:");
                     if(pass) handleAction("reset_password", { data: { newPassword: pass } });
                  }}>
                     <Key size={16} /> <span>Reset Password</span>
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.75rem', height: 'auto', flexDirection: 'column', gap: '0.5rem' }} onClick={() => {
                     const email = prompt("Enter new email:", user?.email);
                     if(email) handleAction("change_email", { data: { newEmail: email } });
                  }}>
                     <Mail size={16} /> <span>Change Email</span>
                  </button>
               </div>
            )}
         </div>

         {/* Orders Grid */}
         <div style={{ flex: '1 1 400px', minWidth: '320px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', fontWeight: 800, marginBottom: '1rem' }}>
               Transaction History
            </h4>
            <div style={{ 
               display: 'flex', 
               gap: '0.75rem', 
               overflowX: 'auto', 
               paddingBottom: '0.75rem',
               scrollbarWidth: 'thin'
            }}>
               {orders.map(order => (
                  <div key={order.id} style={{ 
                    minWidth: '220px', 
                    padding: '1rem', 
                    border: '1px solid var(--outline-variant)', 
                    borderRadius: 'var(--radius-lg)', 
                    background: 'var(--surface-container-low)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>#{order.id.slice(0,8)}</div>
                        <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.85rem' }}>${order.total.toFixed(2)}</div>
                     </div>
                     <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-tertiary btn-sm" style={{ flex: 1, fontSize: '10px', color: 'var(--error)', background: '#fee2e2', padding: '0.4rem' }} onClick={() => handleAction("cancel_order", { orderId: order.id })}>
                           Cancel
                        </button>
                        <button className="btn btn-tertiary btn-sm" style={{ flex: 1, fontSize: '10px', color: 'var(--primary)', background: 'var(--primary-container)', padding: '0.4rem' }} onClick={() => handleAction("refund_order", { orderId: order.id })}>
                           Refund
                        </button>
                     </div>
                  </div>
               ))}
               {orders.length === 0 && (
                 <div style={{ fontSize: '0.75rem', opacity: 0.5, border: '1px dashed var(--outline-variant)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', width: '100%', textAlign: 'center' }}>
                   No recent orders found.
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}

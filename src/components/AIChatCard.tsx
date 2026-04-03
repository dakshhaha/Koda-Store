"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, User, Bot, Loader2, BadgeAlert, Sparkles, ArrowLeft, Plus, ChevronRight, Clock, CheckCircle, ShieldAlert } from "lucide-react";
import type { ChatMessage } from "@/lib/ai";

interface ChatUiMessage extends ChatMessage {
  timestamp?: string;
  isHuman?: boolean;
}

interface SupportSessionSummary {
  id: string;
  status: string;
  updatedAt: string;
  preview: string;
}

const SYSTEM_MESSAGE: ChatUiMessage = {
  role: "system",
  content:
    "You are Koda, the Koda Store AI. You help users find products, explain offers, and resolve order/payment issues clearly.",
};

const GREETING_MESSAGE: ChatUiMessage = {
  role: "assistant",
  content: "Hi there! I'm Koda. How can I help you with your shopping today?",
};

export default function AIChatCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("chat");
  const [messages, setMessages] = useState<ChatUiMessage[]>([SYSTEM_MESSAGE, GREETING_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState<"ai_handling" | "human_needed" | "agent_active" | "resolved">("ai_handling");
  const [error, setError] = useState("");
  const [sessionHistory, setSessionHistory] = useState<SupportSessionSummary[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("support_sid");
    }
    return null;
  });
  
  const [waitStats, setWaitStats] = useState<{ estimatedWaitMinutes: number; activeWaitCount: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, view]);

  // Auth Status Polling for Auto-Logout
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/status");
        const data = await res.json();
        if (data.forcedLogout) {
          setShowLogoutModal(true);
        }
      } catch (err) {}
    };

    const authInterval = setInterval(checkAuth, 5000);
    return () => clearInterval(authInterval);
  }, []);

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
      
      oscillator.type = "triangle"; // Warmer than sine
      oscillator.frequency.setValueAtTime(200, audioCtxRef.current.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioCtxRef.current.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.15, audioCtxRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.15);
      
      oscillator.start();
      oscillator.stop(audioCtxRef.current.currentTime + 0.15);
    } catch (err) { }
  }, []);

  useEffect(() => {
    const resume = () => {
      audioCtxRef.current?.resume();
      window.removeEventListener("mousedown", resume);
    };
    window.addEventListener("mousedown", resume);
    return () => window.removeEventListener("mousedown", resume);
  }, []);

  const loadSession = (sid: string) => {
    setSessionId(sid);
    localStorage.setItem("support_sid", sid);
    setView("chat");
  };

  const startNewChat = () => {
    const newId = Math.random().toString(36).substring(2, 12);
    setSessionId(newId);
    localStorage.setItem("support_sid", newId);
    setMessages([SYSTEM_MESSAGE, GREETING_MESSAGE]);
    setChatStatus("ai_handling");
    setWaitStats(null);
    setView("chat");
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (data.success) {
        setSessionHistory(data.sessions || []);
      }
    } catch { }
  };

  useEffect(() => {
    if (view === "list" && isOpen) {
      fetchHistory();
    }
  }, [view, isOpen]);

  const syncSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(`/api/chat?sessionId=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
      const payload = await response.json();
      if (payload?.status) setChatStatus(payload.status);
      if (Array.isArray(payload?.messages)) {
        const remoteMessages = payload.messages.filter((m: any) => m.role !== "system");
        setMessages(prev => {
          const localFiltered = prev.filter(m => m.role !== "system");
          if (remoteMessages.length > localFiltered.length) {
            if (isOpen) playNotificationSound();
            return [SYSTEM_MESSAGE, ...remoteMessages];
          }
          return prev;
        });
      }
    } catch { }
  }, [sessionId, playNotificationSound, isOpen]);

  useEffect(() => {
    if (chatStatus === "human_needed" && isOpen) {
      fetch("/api/chat/stats")
        .then(res => res.json())
        .then(data => setWaitStats(data))
        .catch(() => { });
    }
  }, [chatStatus, isOpen]);

  useEffect(() => {
    if (!isOpen || view === "list") return;

    if (!sessionId) {
      startNewChat();
      return;
    }

    syncSession();
    const pollId = setInterval(syncSession, 2000);
    return () => clearInterval(pollId);
  }, [isOpen, view, sessionId, syncSession]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || loading || !sessionId) return;
    
    // Explicitly resume audio context
    audioCtxRef.current?.resume();

    const userMessage: ChatUiMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const requestMessages = [...messages, userMessage];
    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: requestMessages, sessionId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to get assistant response.");
      }

      if (payload.status) {
        setChatStatus(payload.status);
      }

      if (payload.response) {
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            content: payload.response,
            timestamp: new Date().toISOString(),
          },
        ]);
        playNotificationSound();
      }

      await syncSession();
    } catch {
      setError("Sorry, I couldn't connect right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const statusLabel =
    chatStatus === "agent_active"
      ? "Agent connected"
      : chatStatus === "human_needed"
        ? "Switching to human agent..."
        : chatStatus === "resolved"
          ? "Conversation resolved"
          : "AI assistant active";

  const renderProductCard = (match: string, p: string) => {
    try {
      const [id, name, price, img, slug] = p.split(":");
      return (
        <a
          key={id}
          href={`/products/${slug}`}
          className="chat-product-card glass"
          target="_blank"
          rel="noopener noreferrer"
        >
          {img && <img src={img} alt={name} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />}
          <div className="chat-product-info">
            <span className="chat-product-name">{name}</span>
            <span className="chat-product-price">${price}</span>
          </div>
          <ChevronRight size={14} className="chat-product-arrow" />
        </a>
      );
    } catch {
      return match;
    }
  };

  const formatMessage = (content: string) => {
    const productRegex = /\[\[PRODUCT:(.*?)\]\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = productRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      parts.push(renderProductCard(match[0], match[1]));
      lastIndex = productRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <>
      <button
        className="ai-chat-toggle animate-in"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Assistant"
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="sparkle-icon" />}
      </button>

      {isOpen && (
        <div className="ai-chat-card animate-in">
          <div className="ai-chat-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {view === "chat" ? (
                <button onClick={() => setView("list")} className="chat-header-btn">
                  <ArrowLeft size={16} />
                </button>
              ) : (
                <Sparkles size={18} className="sparkle-icon" />
              )}
              <div>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 800, color: 'var(--primary)' }}>Koda AI</h3>
                <p style={{ fontSize: "0.6875rem", opacity: 0.8 }}>{view === "chat" ? statusLabel : "Session History"}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
            >
              <X size={18} />
            </button>
          </div>

          <div className="ai-chat-messages" ref={scrollRef}>
            {view === "list" ? (
              <div style={{ padding: "0.5rem" }}>
                <button onClick={startNewChat} className="new-chat-btn">
                  <Plus size={16} /> Start New Chat
                </button>
                {sessionHistory.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(s => (
                  <button key={s.id} onClick={() => loadSession(s.id)} className="history-item">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <span className="history-id" style={{ color: s.status === 'resolved' ? 'var(--on-surface-variant)' : 'var(--primary)' }}>
                        Chat #{s.id.slice(0, 4)} {s.status === 'resolved' && '(Closed)'}
                      </span>
                      <span className="history-date"><Clock size={10} /> {new Date(s.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="history-preview">{s.preview}</div>
                  </button>
                ))}
                {sessionHistory.length === 0 && (
                  <div className="empty-history">No past conversations found.</div>
                )}
              </div>
            ) : (
              <>
                {chatStatus === "human_needed" && (
                  <div style={{ margin: "0.75rem", padding: "1rem", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, #854d0008, #64390012)", border: "1px solid #854d0020", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#643900", fontWeight: 700, fontSize: "0.75rem" }}>
                      <Loader2 size={14} className="animate-spin" /> please wait agent will take over chat shortly
                    </div>
                    {waitStats && (
                      <div style={{ fontSize: "0.6875rem", color: "var(--on-surface-variant)", opacity: 0.9 }}>
                        Estimated wait: <span style={{ fontWeight: 800, color: "var(--primary)" }}>{waitStats.estimatedWaitMinutes} mins</span>
                        <span style={{ margin: "0 0.5rem", opacity: 0.3 }}>|</span>
                        Queue: <span style={{ fontWeight: 800 }}>{waitStats.activeWaitCount} pending</span>
                      </div>
                    )}
                  </div>
                )}
                {chatStatus === "agent_active" && (
                  <div style={{ margin: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "var(--radius-md)", background: "#16a34a12", color: "#16a34a", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700 }}>
                    <CheckCircle size={14} /> Agent has connected to the chat.
                  </div>
                )}
                {chatStatus === "resolved" && (
                  <div style={{ margin: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "var(--radius-md)", background: "var(--surface-container-high)", color: "var(--on-surface-variant)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
                    <CheckCircle size={14} color="#16a34a" /> This chat has been resolved.
                  </div>
                )}
                {messages
                  .filter((message) => message.role !== "system")
                  .map((message, index) => {
                    const assistantByHuman = message.role === "assistant" && message.isHuman;
                    return (
                      <div key={index} className={`chat-message ${message.role === "user" ? "user" : "assistant"}`}>
                        <div className="chat-avatar">
                          {message.role === "user" || assistantByHuman ? <User size={12} /> : <Sparkles size={12} />}
                        </div>
                        <div className="chat-bubble">
                          {formatMessage(message.content)}
                          {assistantByHuman && (
                            <div style={{ marginTop: "0.35rem", fontSize: "0.625rem", opacity: 0.75, fontWeight: 700 }}>
                              Agent Message
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </>
            )}

            {loading && (
              <div className="chat-message assistant">
                <div className="chat-avatar"><Sparkles size={12} /></div>
                <div className="chat-bubble loading">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              </div>
            )}
          </div>

          {view === "chat" && (
            <>
              {error && (
                <p style={{ padding: "0.25rem 0.9rem", color: "var(--error)", fontSize: "0.75rem", fontWeight: 600 }}>
                  {error}
                </p>
              )}
              <form className="ai-chat-input" onSubmit={handleSend}>
                <input
                  placeholder={
                    chatStatus === "resolved"
                      ? "Conversation closed."
                      : chatStatus === "human_needed"
                        ? "Waiting for agent..."
                        : "Ask Koda anything..."
                  }
                  readOnly={chatStatus === "resolved" || chatStatus === "human_needed"}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  autoFocus
                />
                <button type="submit" disabled={loading || chatStatus === "resolved" || chatStatus === "human_needed"}>
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Auto Logout Popup */}
      {showLogoutModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass animate-in" style={{ maxWidth: '400px', width: '100%', background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ background: 'var(--error-container)', color: 'var(--error)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <ShieldAlert size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Security Notice</h3>
            <p style={{ fontSize: '0.9375rem', color: 'var(--on-surface-variant)', lineHeight: '1.6', marginBottom: '2rem' }}>
              Your password was changed. Please login again to continue using the application.
            </p>
            <button 
              onClick={() => {
                localStorage.removeItem("support_sid");
                window.location.href = "/";
              }}
              style={{ 
                display: 'block', 
                width: '100%', 
                padding: '1rem', 
                background: 'var(--primary)', 
                color: 'white', 
                borderRadius: 'var(--radius-md)', 
                fontWeight: 700, 
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </>
  );
}

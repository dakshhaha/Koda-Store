"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, ShoppingCart, Settings, Globe, ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface NavActionsProps {
  session: { userId: string; email: string; name?: string; role: string } | null;
  locale: string;
  currency: string;
}

export default function NavActions({ session, locale, currency }: NavActionsProps) {
  const router = useRouter();
  const { cartCount } = useCart();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openDropdown = () => {
    clearCloseTimer();
    setIsDropdownOpen(true);
  };

  const closeDropdown = (delay = 140) => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, delay);
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsDropdownOpen(false);
      router.push(`/${locale}`);
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="nav-actions">
      <div className="locale-badge" title={`Currency: ${currency}`}>
        <Globe size={14} />
        <span>{locale}</span>
      </div>
      
      <Link href={`/${locale}/cart`} className="btn btn-secondary cart-btn">
        <ShoppingCart size={18} />
        Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
      </Link>

      {!session ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href={`/${locale}/auth/login`} className="btn btn-tertiary" style={{ fontSize: '0.875rem' }}>Log In</Link>
          <Link href={`/${locale}/auth/signup`} className="btn btn-primary">Sign Up</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            className="profile-menu"
            onMouseEnter={openDropdown}
            onMouseLeave={() => closeDropdown()}
          >
            <button
              type="button"
              className="user-profile-badge"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              onFocus={openDropdown}
              aria-haspopup="menu"
              aria-expanded={isDropdownOpen}
            >
              <User size={16} />
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{session.name || session.email.split("@")[0]}</span>
              <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>

            <div
              className={`profile-dropdown ${isDropdownOpen ? "open" : ""}`}
              role="menu"
              onMouseEnter={openDropdown}
              onMouseLeave={() => closeDropdown()}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  closeDropdown(0);
                }
              }}
            >
              <Link href={`/${locale}/account/settings`} className="dropdown-link">
                <Settings size={14} /> Account Settings
              </Link>
              <button 
                className="dropdown-link logout"
                onClick={handleLogout}
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

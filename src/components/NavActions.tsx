"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, ShoppingCart, Settings, Globe, ChevronDown, Coins } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface NavActionsProps {
  locale: string;
  currency: string;
  session: any;
  user?: any;
}

export default function NavActions({ locale, currency, session, user }: NavActionsProps) {
  const router = useRouter();
  const { cartCount } = useCart();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearCloseTimer = () => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
      dropdownTimerRef.current = null;
    }
  };

  const openDropdown = () => {
    clearCloseTimer();
    setIsDropdownOpen(true);
  };

  const closeDropdown = (delay = 300) => {
    clearCloseTimer();
    dropdownTimerRef.current = setTimeout(() => {
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
              className="profile-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="avatar-placeholder">
                <User size={16} />
              </div>
              <span className="profile-name">{user?.name || "Member"}</span>
              <ChevronDown size={14} className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div 
                className="profile-dropdown animate-scale-up"
                onMouseEnter={openDropdown}
                onMouseLeave={() => closeDropdown(100)}
              >
                <div className="dropdown-header">
                  <span className="user-email">{user?.email || session?.email}</span>
                  <div className="aura-coin-balance">
                    <span className="coin-icon-circle">
                      <Coins size={18} />
                    </span>
                    <span>{session?.auraCoins ?? user?.auraCoins ?? 0} Aura Coins</span>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <Link href={`/${locale}/rewards`} className="dropdown-link">
                  <Coins size={14} /> Rewards Store
                </Link>
                <Link href={`/${locale}/referrals`} className="dropdown-link">
                  <User size={14} /> Refer & Earn
                </Link>
                <Link href={`/${locale}/orders`} className="dropdown-link">
                  <ShoppingCart size={14} /> Order History
                </Link>
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}

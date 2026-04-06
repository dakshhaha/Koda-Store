"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  MessageSquare,
  House,
  Megaphone,
  Users,
  Ticket,
  BarChart3,
} from "lucide-react";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/support", label: "Support", icon: MessageSquare },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <p className="admin-sidebar-title">Admin Panel</p>
        <nav>
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`admin-nav-link ${isActive(link.href) ? "active" : ""}`}
            >
              <link.icon size={16} />
              {link.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(194,198,212,0.15)' }}>
          <Link href="/" className="admin-nav-link">
            <House size={16} /> Back to Store
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-main">
        {/* Mobile nav */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}
          className="admin-mobile-nav">
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? "btn btn-primary" : "btn btn-secondary"}
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}
            >
              <link.icon size={14} /> {link.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

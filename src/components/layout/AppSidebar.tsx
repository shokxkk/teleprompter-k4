"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import {
  LayoutDashboard,
  MessageSquare,
  Layers,
  BookOpen,
  Calendar,
  Camera,
  BarChart2,
  LogOut,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/shooting", label: "Телесуфлёр k4", icon: Camera },
];

interface AppSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: "1.25rem 1rem", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Sparkles size={16} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-text-primary)", lineHeight: 1.2 }}>
              Телесуфлёр k4
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)" }}>Профессиональная версия</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.5rem" }}>
        <div className="section-title" style={{ marginTop: "0.25rem" }}>Рабочее пространство</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive(href) ? "nav-item-active" : ""}`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Advertiser Contact Footer */}
      <div style={{ padding: "0.75rem 0.5rem", borderTop: "1px solid var(--color-border)", background: "rgba(99, 102, 241, 0.04)" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "0.5rem", letterSpacing: "0.5px" }}>
          Реклама и Связь
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <a
            href="mailto:shokxk@gmail.com"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#4f46e5", textDecoration: "none", fontWeight: 500 }}
          >
            <span>✉️ shokxk@gmail.com</span>
          </a>
          <a
            href="https://t.me/headsales"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#0284c7", textDecoration: "none", fontWeight: 500 }}
          >
            <span>💬 Telegram: @headsales</span>
          </a>
        </div>
      </div>
    </aside>
  );
}

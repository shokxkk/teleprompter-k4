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

      {/* User */}
      <div style={{ padding: "0.75rem 0.5rem", borderTop: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.375rem" }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #c7d2fe, #a5b4fc)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "#4338ca",
          }}>
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name ?? "Пользователь"}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const csrfRes = await fetch("/api/auth/csrf");
                const csrfData = await csrfRes.json();
                await fetch("/api/auth/signout", {
                  method: "POST",
                  headers: { "Content-Type": "application/x-www-form-urlencoded" },
                  body: new URLSearchParams({ csrfToken: csrfData.csrfToken, json: "true" }),
                });
              } finally {
                window.location.href = "/auth/login";
              }
            }}
            className="btn btn-ghost btn-icon"
            title="Выйти"
            style={{ flexShrink: 0 }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

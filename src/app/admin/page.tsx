"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  Eye,
  Activity,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  FileText,
  Smartphone,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface AnalyticsData {
  today: number;
  thisMonth: number;
  total: number;
  onlineNow: number;
  history: Array<{ date: string; count: number }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/visitor-stats");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to load visitor analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const maxHistoryCount = data?.history ? Math.max(...data.history.map((h) => h.count), 1) : 1;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09090b",
        color: "#f4f4f5",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "1.5rem",
      }}
    >
      {/* Top Bar Header */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto 2rem auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          borderBottom: "1px solid #27272a",
          paddingBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img
            src="/logo.png"
            alt="sufler.uz"
            style={{ width: 48, height: 48, borderRadius: "12px", border: "1px solid #6366f1" }}
          />
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              sufler.uz <span style={{ fontSize: "0.8rem", background: "#312e81", color: "#a5b4fc", padding: "0.2rem 0.6rem", borderRadius: "6px" }}>Админ Панель</span>
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#a1a1aa", margin: 0, marginTop: "0.2rem" }}>
              Статистика посещаемости и активности пользователей приложения
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={fetchStats}
            style={{
              background: "#27272a",
              color: "#fff",
              border: "1px solid #3f3f46",
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <RefreshCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Обновить
          </button>

          <Link
            href="/shooting"
            style={{
              background: "#4f46e5",
              color: "#fff",
              textDecoration: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <ArrowLeft size={16} /> Перейти в Телесуфлёр
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* 4 Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
          {/* Card 1: Today */}
          <div style={{ background: "#18181b", padding: "1.5rem", borderRadius: "14px", border: "1px solid #27272a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#a1a1aa", fontWeight: 600 }}>Посетителей сегодня</span>
              <div style={{ background: "rgba(34, 197, 94, 0.15)", padding: "0.5rem", borderRadius: "10px" }}>
                <Users size={20} color="#4ade80" />
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#ffffff" }}>
              {data ? data.today.toLocaleString() : "..."}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#4ade80", marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <TrendingUp size={14} /> +18% по сравнению со вчера
            </div>
          </div>

          {/* Card 2: This Month */}
          <div style={{ background: "#18181b", padding: "1.5rem", borderRadius: "14px", border: "1px solid #27272a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#a1a1aa", fontWeight: 600 }}>Посетителей за месяц</span>
              <div style={{ background: "rgba(59, 130, 246, 0.15)", padding: "0.5rem", borderRadius: "10px" }}>
                <Calendar size={20} color="#60a5fa" />
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#ffffff" }}>
              {data ? data.thisMonth.toLocaleString() : "..."}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#60a5fa", marginTop: "0.4rem" }}>
              Текущий месяц: sufler.uz
            </div>
          </div>

          {/* Card 3: Total Visitors */}
          <div style={{ background: "#18181b", padding: "1.5rem", borderRadius: "14px", border: "1px solid #27272a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#a1a1aa", fontWeight: 600 }}>Всего просмотров</span>
              <div style={{ background: "rgba(245, 158, 11, 0.15)", padding: "0.5rem", borderRadius: "10px" }}>
                <Eye size={20} color="#facc15" />
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#ffffff" }}>
              {data ? data.total.toLocaleString() : "..."}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#facc15", marginTop: "0.4rem" }}>
              Общее количество заходов
            </div>
          </div>

          {/* Card 4: Online Now */}
          <div style={{ background: "#18181b", padding: "1.5rem", borderRadius: "14px", border: "1px solid #27272a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#a1a1aa", fontWeight: 600 }}>Онлайн сейчас</span>
              <div style={{ background: "rgba(168, 85, 247, 0.15)", padding: "0.5rem", borderRadius: "10px" }}>
                <Activity size={20} color="#c084fc" />
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#4ade80", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 10px #22c55e" }} />
              {data ? data.onlineNow : "..."}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#a1a1aa", marginTop: "0.4rem" }}>
              Активные сессии (последние 5 мин)
            </div>
          </div>
        </div>

        {/* 7-Day Visitor Trend Chart */}
        <div style={{ background: "#18181b", padding: "1.75rem", borderRadius: "16px", border: "1px solid #27272a", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                📈 График посещаемости за последние 7 дней
              </h2>
              <p style={{ fontSize: "0.82rem", color: "#a1a1aa", margin: 0, marginTop: "0.2rem" }}>
                Динамика роста пользователей на сайте sufler.uz
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", height: 180, padding: "1rem 0", borderBottom: "1px solid #27272a" }}>
            {data?.history?.map((h, idx) => {
              const heightPct = Math.max(15, Math.round((h.count / maxHistoryCount) * 100));
              return (
                <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#60a5fa" }}>{h.count}</span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 42,
                      height: `${heightPct}%`,
                      background: "linear-gradient(180deg, #6366f1 0%, #312e81 100%)",
                      borderRadius: "6px 6px 0 0",
                      transition: "all 0.3s ease",
                    }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>{h.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick App Insights Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          {/* Box 1: Platform Health & Speed */}
          <div style={{ background: "#18181b", padding: "1.5rem", borderRadius: "14px", border: "1px solid #27272a" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#818cf8", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Zap size={18} /> Состояние сервера & Скорость
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.88rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #27272a", paddingBottom: "0.4rem" }}>
                <span style={{ color: "#a1a1aa" }}>Домен:</span>
                <span style={{ fontWeight: 700, color: "#4ade80" }}>https://sufler.uz</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #27272a", paddingBottom: "0.4rem" }}>
                <span style={{ color: "#a1a1aa" }}>Нагрузка на сервер:</span>
                <span style={{ fontWeight: 700, color: "#4ade80" }}>0% (Клиентская обработка)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #27272a", paddingBottom: "0.4rem" }}>
                <span style={{ color: "#a1a1aa" }}>Защита приватности:</span>
                <span style={{ fontWeight: 700, color: "#4ade80" }}>100% Изолированное хранилище</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#a1a1aa" }}>Скорость чтения PDF:</span>
                <span style={{ fontWeight: 700, color: "#facc15" }}>Мгновенно (&lt; 0.1 сек)</span>
              </div>
            </div>
          </div>

          {/* Box 2: Owner & Ads Information */}
          <div style={{ background: "#18181b", padding: "1.5rem", borderRadius: "14px", border: "1px solid #27272a" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#facc15", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldCheck size={18} /> Владелец и Рекламные контакты
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.88rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #27272a", paddingBottom: "0.4rem" }}>
                <span style={{ color: "#a1a1aa" }}>Владелец:</span>
                <span style={{ fontWeight: 700, color: "#ffffff" }}>Karimov Shoxjaxon Erkinjon Ogli</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #27272a", paddingBottom: "0.4rem" }}>
                <span style={{ color: "#a1a1aa" }}>Email для рекламы:</span>
                <a href="mailto:shokxk@gmail.com" style={{ fontWeight: 700, color: "#38bdf8", textDecoration: "none" }}>shokxk@gmail.com</a>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#a1a1aa" }}>Telegram:</span>
                <a href="https://t.me/headsales" target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: "#38bdf8", textDecoration: "none" }}>@headsales</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { BarChart3, Users, FileSpreadsheet, Plus, TrendingUp, HelpCircle } from "lucide-react";

interface Snapshot {
  id: string;
  scope: string;
  measuredAt: Date | string;
  windowDays?: number | null;
  views?: number | null;
  reach?: number | null;
  saves?: number | null;
  shares?: number | null;
  comments?: number | null;
  contentItem?: { id: string; title?: string | null; type: string } | null;
}

interface Inquiry {
  id: string;
  date: Date | string;
  contactType?: string | null;
  businessNiche?: string | null;
  teamSize?: number | null;
  task?: string | null;
  interestedService?: string | null;
  sourceAttribution: string;
  status: string;
  dealAmount?: unknown;
}

interface WeeklyReport {
  id: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  hypothesis?: string | null;
  metric?: string | null;
  experiment?: string | null;
}

interface ContentOption {
  id: string;
  title?: string | null;
  type: string;
}

interface AnalyticsPageClientProps {
  snapshots: Snapshot[];
  inquiries: Inquiry[];
  weeklyReports: WeeklyReport[];
  contentItems: ContentOption[];
}

export function AnalyticsPageClient({
  snapshots: initialSnapshots,
  inquiries: initialInquiries,
  weeklyReports,
  contentItems,
}: AnalyticsPageClientProps) {
  const [activeTab, setActiveTab] = useState<"metrics" | "inquiries" | "reports">("metrics");
  const [snapshots, setSnapshots] = useState(initialSnapshots);
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  // Metric Form State
  const [selectedContentId, setSelectedContentId] = useState("");
  const [views, setViews] = useState("");
  const [reach, setReach] = useState("");
  const [saves, setSaves] = useState("");
  const [shares, setShares] = useState("");
  const [comments, setComments] = useState("");
  const [windowDays, setWindowDays] = useState("7");
  const [loading, setLoading] = useState(false);

  // Inquiry Form State
  const [niche, setNiche] = useState("");
  const [task, setTask] = useState("");
  const [contactType, setContactType] = useState("owner");
  const [dealAmount, setDealAmount] = useState("");

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentItemId: selectedContentId || undefined,
          measuredAt: new Date().toISOString(),
          windowDays: Number(windowDays),
          views: views ? Number(views) : null,
          reach: reach ? Number(reach) : null,
          saves: saves ? Number(saves) : null,
          shares: shares ? Number(shares) : null,
          comments: comments ? Number(comments) : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSnapshots([data.snapshot, ...snapshots]);
        setShowMetricModal(false);
        setViews("");
        setReach("");
        setSaves("");
        setShares("");
        setComments("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "inquiry",
          businessNiche: niche,
          task,
          contactType,
          dealAmount: dealAmount ? Number(dealAmount) : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInquiries([data.inquiry, ...inquiries]);
        setShowInquiryModal(false);
        setNiche("");
        setTask("");
        setDealAmount("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Аналитика и обращения</h1>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
            Ручной ввод статистики, карточки обращений и еженедельный разбор AI-аналитиком
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {activeTab === "metrics" && (
            <button className="btn btn-primary" onClick={() => setShowMetricModal(true)}>
              <Plus size={14} /> Внести замер
            </button>
          )}
          {activeTab === "inquiries" && (
            <button className="btn btn-primary" onClick={() => setShowInquiryModal(true)}>
              <Plus size={14} /> Новое обращение
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "0 1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", gap: "0" }}>
        <button
          onClick={() => setActiveTab("metrics")}
          style={{
            padding: "0.75rem 1rem",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: activeTab === "metrics" ? 600 : 400,
            color: activeTab === "metrics" ? "var(--color-brand-600)" : "var(--color-text-secondary)",
            borderBottom: `2px solid ${activeTab === "metrics" ? "var(--color-brand-500)" : "transparent"}`,
            marginBottom: -1,
          }}
        >
          Метрики ({snapshots.length})
        </button>
        <button
          onClick={() => setActiveTab("inquiries")}
          style={{
            padding: "0.75rem 1rem",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: activeTab === "inquiries" ? 600 : 400,
            color: activeTab === "inquiries" ? "var(--color-brand-600)" : "var(--color-text-secondary)",
            borderBottom: `2px solid ${activeTab === "inquiries" ? "var(--color-brand-500)" : "transparent"}`,
            marginBottom: -1,
          }}
        >
          Обращения ({inquiries.length})
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          style={{
            padding: "0.75rem 1rem",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: activeTab === "reports" ? 600 : 400,
            color: activeTab === "reports" ? "var(--color-brand-600)" : "var(--color-text-secondary)",
            borderBottom: `2px solid ${activeTab === "reports" ? "var(--color-brand-500)" : "transparent"}`,
            marginBottom: -1,
          }}
        >
          Еженедельные разборы ({weeklyReports.length})
        </button>
      </div>

      <div className="page-container" style={{ maxWidth: 850 }}>
        {activeTab === "metrics" && (
          <div>
            {snapshots.length === 0 ? (
              <div className="empty-state">
                <BarChart3 size={32} style={{ color: "var(--color-text-tertiary)" }} />
                <h3>Нет зафиксированных метрик</h3>
                <p>Вносите статистику опубликованных постов (просмотры, охват, сохранения), чтобы аналитик строил гипотезы.</p>
                <button className="btn btn-primary" onClick={() => setShowMetricModal(true)}>
                  Внести первый замер
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {snapshots.map((s) => (
                  <div key={s.id} className="card" style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        {s.contentItem?.title || "Замер аккаунта"}
                      </div>
                      <span className="badge badge-idea" style={{ fontSize: "0.75rem" }}>
                        Окно: {s.windowDays ?? 7} дней · {new Date(s.measuredAt).toLocaleDateString("ru")}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", background: "var(--color-surface-secondary)", padding: "0.75rem", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>Просмотры</div>
                        <div style={{ fontWeight: 600, fontSize: "1rem" }}>{s.views !== null && s.views !== undefined ? s.views : "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>Охват</div>
                        <div style={{ fontWeight: 600, fontSize: "1rem" }}>{s.reach !== null && s.reach !== undefined ? s.reach : "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>Сохранения</div>
                        <div style={{ fontWeight: 600, fontSize: "1rem" }}>{s.saves !== null && s.saves !== undefined ? s.saves : "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>Репосты</div>
                        <div style={{ fontWeight: 600, fontSize: "1rem" }}>{s.shares !== null && s.shares !== undefined ? s.shares : "—"}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "inquiries" && (
          <div>
            {inquiries.length === 0 ? (
              <div className="empty-state">
                <Users size={32} style={{ color: "var(--color-text-tertiary)" }} />
                <h3>Нет лидов и обращений</h3>
                <p>Фиксируйте обращения клиентов из Direct/Комментариев для оценки качества контента.</p>
                <button className="btn btn-primary" onClick={() => setShowInquiryModal(true)}>
                  Добавить обращение
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {inquiries.map((inq) => (
                  <div key={inq.id} className="card" style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <div style={{ fontWeight: 600 }}>{inq.businessNiche || "Клиент"} ({inq.contactType})</div>
                      <span className="badge badge-approved">{inq.status}</span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0.2rem 0" }}>
                      Задача: {inq.task || "Не указана"}
                    </p>
                    {inq.dealAmount ? (
                      <div style={{ fontSize: "0.8rem", color: "var(--color-brand-600)", fontWeight: 600 }}>
                        Сумма сделки: ${String(inq.dealAmount)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "reports" && (
          <div>
            {weeklyReports.length === 0 ? (
              <div className="empty-state">
                <FileSpreadsheet size={32} style={{ color: "var(--color-text-tertiary)" }} />
                <h3>Нет еженедельных разборов</h3>
                <p>Разбор формируется AI-аналитиком в конце рабочей недели на основе занесённых метрик.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {weeklyReports.map((rep) => (
                  <div key={rep.id} className="card" style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                      Разбор недели ({new Date(rep.periodStart).toLocaleDateString()} — {new Date(rep.periodEnd).toLocaleDateString()})
                    </div>
                    {rep.hypothesis && (
                      <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
                        <strong>Гипотеза:</strong> {rep.hypothesis}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metric Modal */}
      {showMetricModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: "1.5rem", width: "90%", maxWidth: 500 }}>
            <h3 style={{ margin: "0 0 1rem" }}>Внести замер статистики</h3>
            <form onSubmit={handleAddMetric}>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Публикация</label>
                <select
                  className="input"
                  value={selectedContentId}
                  onChange={(e) => setSelectedContentId(e.target.value)}
                >
                  <option value="">Общая статистика аккаунта</option>
                  {contentItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.title || "Без названия"} ({item.type})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label className="label">Просмотры (Views)</label>
                  <input type="number" className="input" placeholder="Оставьте пустым если нет" value={views} onChange={(e) => setViews(e.target.value)} />
                </div>
                <div>
                  <label className="label">Охват (Reach)</label>
                  <input type="number" className="input" placeholder="Оставьте пустым если нет" value={reach} onChange={(e) => setReach(e.target.value)} />
                </div>
                <div>
                  <label className="label">Сохранения (Saves)</label>
                  <input type="number" className="input" value={saves} onChange={(e) => setSaves(e.target.value)} />
                </div>
                <div>
                  <label className="label">Репосты (Shares)</label>
                  <input type="number" className="input" value={shares} onChange={(e) => setShares(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMetricModal(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Сохранение..." : "Сохранить"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: "1.5rem", width: "90%", maxWidth: 500 }}>
            <h3 style={{ margin: "0 0 1rem" }}>Новое обращение</h3>
            <form onSubmit={handleAddInquiry}>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Ниша бизнеса / Клиент</label>
                <input type="text" className="input" placeholder="Например: Дистрибуция стройматериалов" value={niche} onChange={(e) => setNiche(e.target.value)} required />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Запрос / Задача</label>
                <textarea className="input" rows={3} placeholder="Нужна настройка отдела продаж с нуля..." value={task} onChange={(e) => setTask(e.target.value)} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInquiryModal(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Сохранение..." : "Создать"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

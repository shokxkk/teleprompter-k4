"use client";

import { useState } from "react";
import { Plus, ShieldCheck, FileText, CheckCircle2, AlertTriangle, Lock } from "lucide-react";

interface Fact {
  id: string;
  claim: string;
  unit?: string | null;
  numericValue?: unknown;
  evidenceStatus: string;
  publicationPermission: string;
  isCase: boolean;
}

interface Source {
  id: string;
  title?: string | null;
  type: string;
  content?: string | null;
  knowledgeType: string;
  publicationPermission: string;
  createdAt: Date | string;
  facts: Fact[];
}

interface SourcesPageClientProps {
  sources: Source[];
  facts: Fact[];
}

export function SourcesPageClient({ sources: initialSources, facts: initialFacts }: SourcesPageClientProps) {
  const [sources, setSources] = useState(initialSources);
  const [facts, setFacts] = useState(initialFacts);
  const [activeTab, setActiveTab] = useState<"sources" | "facts">("sources");
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [permission, setPermission] = useState("pending");
  const [claim, setClaim] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Заметка",
          content,
          publicationPermission: permission,
          claims: claim ? [{ claim }] : [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSources([data.source, ...sources]);
        if (data.source.facts) {
          setFacts([...data.source.facts, ...facts]);
        }
        setTitle("");
        setContent("");
        setClaim("");
        setShowAddModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPermissionBadge = (perm: string) => {
    switch (perm) {
      case "public_allowed":
        return <span className="badge badge-approved"><ShieldCheck size={11} /> Разрешено публиковать</span>;
      case "anonymous_allowed":
        return <span className="badge badge-warning"><Lock size={11} /> Без упоминания имени</span>;
      case "internal_only":
        return <span className="badge badge-warning"><Lock size={11} /> Только для AI-команды</span>;
      default:
        return <span className="badge badge-idea"><AlertTriangle size={11} /> Ожидает разрешения</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.25rem" }}>База знаний и фактов</h1>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
            Источники, факты, разрешения на публикацию и доказательства
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={14} /> Добавить источник
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: "0 1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", gap: "0" }}>
        <button
          onClick={() => setActiveTab("sources")}
          style={{
            padding: "0.75rem 1rem",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: activeTab === "sources" ? 600 : 400,
            color: activeTab === "sources" ? "var(--color-brand-600)" : "var(--color-text-secondary)",
            borderBottom: `2px solid ${activeTab === "sources" ? "var(--color-brand-500)" : "transparent"}`,
            marginBottom: -1,
          }}
        >
          Источники ({sources.length})
        </button>
        <button
          onClick={() => setActiveTab("facts")}
          style={{
            padding: "0.75rem 1rem",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: activeTab === "facts" ? 600 : 400,
            color: activeTab === "facts" ? "var(--color-brand-600)" : "var(--color-text-secondary)",
            borderBottom: `2px solid ${activeTab === "facts" ? "var(--color-brand-500)" : "transparent"}`,
            marginBottom: -1,
          }}
        >
          Подтверждённые факты ({facts.length})
        </button>
      </div>

      <div className="page-container" style={{ maxWidth: 800 }}>
        {activeTab === "sources" && (
          <div>
            {sources.length === 0 ? (
              <div className="empty-state">
                <FileText size={32} style={{ color: "var(--color-text-tertiary)" }} />
                <h3>Нет источников</h3>
                <p>Добавьте заметку, кейс или аудио, чтобы AI-продюсер использовал точные факты.</p>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                  Добавить первый источник
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {sources.map((src) => (
                  <div key={src.id} className="card" style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{src.title || "Заметка"}</div>
                      {getPermissionBadge(src.publicationPermission)}
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: "0.25rem 0 0.75rem", whiteSpace: "pre-wrap" }}>
                      {src.content}
                    </p>
                    {src.facts && src.facts.length > 0 && (
                      <div style={{ background: "var(--color-surface-secondary)", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", fontSize: "0.8rem" }}>
                        <strong>Извлечённые факты:</strong>
                        <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.2rem" }}>
                          {src.facts.map((f) => (
                            <li key={f.id}>{f.claim}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "facts" && (
          <div>
            {facts.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={32} style={{ color: "var(--color-text-tertiary)" }} />
                <h3>Нет подтверждённых фактов</h3>
                <p>Факты извлекаются автоматически из ваших источников или интервью.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {facts.map((f) => (
                  <div key={f.id} className="card" style={{ padding: "0.875rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{f.claim}</div>
                      {f.isCase && <span className="badge badge-approved" style={{ marginTop: "0.25rem", display: "inline-block" }}>Кейс</span>}
                    </div>
                    {getPermissionBadge(f.publicationPermission)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: "1.5rem", width: "90%", maxWidth: 500 }}>
            <h3 style={{ margin: "0 0 1rem" }}>Новый источник</h3>
            <form onSubmit={handleAddSource}>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Название / Заголовок</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Например: Кейс Агро-холдинга"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Текст заметки или фактов *</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Внедрили отдел продаж, выручка выросла с $20k до $45k за 3 месяца..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Главный факт (для ссылок в сценариях)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Выручка выросла на 125% за 3 месяца"
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label className="label">Разрешение на публикацию *</label>
                <select
                  className="input"
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                >
                  <option value="pending">Ожидает решения (Pending)</option>
                  <option value="public_allowed">Публичный доступ (Public allowed)</option>
                  <option value="anonymous_allowed">Анонимно (Без имён/компании)</option>
                  <option value="internal_only">Только внутри (Internal only)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Сохранение..." : "Добавить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

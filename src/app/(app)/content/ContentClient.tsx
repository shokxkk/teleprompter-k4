"use client";

import Link from "next/link";
import { useState } from "react";
import { Filter, Plus, Calendar, List, Columns3, ChevronRight } from "lucide-react";

type ContentItem = {
  id: string;
  type: string;
  title: string | null;
  editorialStatus: string;
  productionStatus: string;
  updatedAt: Date;
  versions: Array<{ versionNumber: number; payload: unknown; createdAt: Date }>;
  publications: Array<{ publishedAt: Date; url?: string | null }>;
  planItems: Array<{ scheduledDate: Date | null }>;
};

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  idea: { label: "Идея", class: "badge-idea" },
  needs_input: { label: "Нужен ответ", class: "badge-warning" },
  draft: { label: "Черновик", class: "badge-draft" },
  in_review: { label: "На проверке", class: "badge-review" },
  needs_changes: { label: "Правки", class: "badge-warning" },
  ready_for_approval: { label: "На согласовании", class: "badge-review" },
  approved: { label: "Согласован", class: "badge-approved" },
};

const PROD_STATUS_LABELS: Record<string, { label: string; class: string }> = {
  not_started: { label: "Не начат", class: "badge-idea" },
  ready_to_shoot: { label: "Готово к съёмке", class: "badge-approved" },
  shot: { label: "Снят", class: "badge-draft" },
  published: { label: "Опубликован", class: "badge-live" },
  archived: { label: "Архив", class: "badge-idea" },
};

const FORMAT_ICONS: Record<string, string> = {
  reel: "🎬",
  carousel: "🖼️",
  story: "📱",
  pinned: "📌",
};

export function ContentClient({ items }: { items: ContentItem[] }) {
  const [view, setView] = useState<"list" | "board">("list");
  const [filterFormat, setFilterFormat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = items.filter((item) => {
    if (filterFormat !== "all" && item.type !== filterFormat) return false;
    if (filterStatus !== "all" && item.editorialStatus !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Контент</h1>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
            {items.length} материал{items.length !== 1 ? "ов" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/producer?task=generate" className="btn btn-primary btn-sm">
            <Plus size={14} /> Новый
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: "0.75rem 1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <Filter size={14} color="var(--color-text-tertiary)" />

        <select
          className="input"
          style={{ width: "auto", padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
          value={filterFormat}
          onChange={(e) => setFilterFormat(e.target.value)}
        >
          <option value="all">Все форматы</option>
          <option value="reel">Reels</option>
          <option value="carousel">Карусели</option>
          <option value="story">Stories</option>
          <option value="pinned">Закреплённые</option>
        </select>

        <select
          className="input"
          style={{ width: "auto", padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Все статусы</option>
          <option value="idea">Идея</option>
          <option value="draft">Черновик</option>
          <option value="ready_for_approval">На согласовании</option>
          <option value="approved">Согласованы</option>
        </select>

        <div style={{ marginLeft: "auto", display: "flex", gap: "0.25rem" }}>
          <button className={`btn btn-icon ${view === "list" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("list")}>
            <List size={14} />
          </button>
          <button className={`btn btn-icon ${view === "board" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("board")}>
            <Columns3 size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="page-container">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ marginTop: "4rem" }}>
            <div style={{ fontSize: "3rem" }}>📭</div>
            <h2 style={{ color: "var(--color-text-primary)" }}>Материалов нет</h2>
            <p>Начните с AI-продюсером — расскажите о рабочем наблюдении.</p>
            <Link href="/producer" className="btn btn-primary">Открыть продюсера</Link>
          </div>
        ) : view === "list" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filtered.map((item) => {
              const editStatus = STATUS_LABELS[item.editorialStatus];
              const prodStatus = PROD_STATUS_LABELS[item.productionStatus];
              const payload = item.versions[0]?.payload as Record<string, unknown> | undefined;
              const goal = payload?.goal as string | undefined;

              return (
                <Link
                  key={item.id}
                  href={`/content/${item.id}`}
                  className="card card-hover"
                  style={{ padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.875rem", textDecoration: "none" }}
                >
                  <div style={{ fontSize: "1.25rem", flexShrink: 0 }}>{FORMAT_ICONS[item.type] ?? "📄"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: "0.9rem", marginBottom: "0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title ?? `${item.type} без названия`}
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                      {editStatus && <span className={`badge ${editStatus.class}`}>{editStatus.label}</span>}
                      {prodStatus && prodStatus.label !== "Не начат" && (
                        <span className={`badge ${prodStatus.class}`}>{prodStatus.label}</span>
                      )}
                      {goal && <span className="badge badge-idea" style={{ fontSize: "0.7rem" }}>{goal}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", flexShrink: 0, textAlign: "right" }}>
                    v{item.versions[0]?.versionNumber ?? 1}
                    <br />
                    {new Date(item.updatedAt).toLocaleDateString("ru", { day: "numeric", month: "short" })}
                  </div>
                  <ChevronRight size={14} color="var(--color-text-tertiary)" />
                </Link>
              );
            })}
          </div>
        ) : (
          // Board view by editorial status
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", overflowX: "auto" }}>
            {["draft", "ready_for_approval", "approved", "published"].map((status) => {
              const col = filtered.filter((i) => i.editorialStatus === status || (status === "published" && i.productionStatus === "published"));
              return (
                <div key={status} style={{ background: "var(--color-surface-secondary)", borderRadius: "var(--radius-lg)", padding: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {STATUS_LABELS[status]?.label ?? status} ({col.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {col.map((item) => (
                      <Link key={item.id} href={`/content/${item.id}`}
                        className="card card-hover"
                        style={{ padding: "0.75rem", textDecoration: "none", display: "block" }}
                      >
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
                          <span>{FORMAT_ICONS[item.type]}</span>
                          <span style={{ fontSize: "0.82rem", fontWeight: 500, lineHeight: 1.4 }}>
                            {item.title ?? "Без названия"}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

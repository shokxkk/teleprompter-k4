"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Download,
  CheckCircle,
  AlertTriangle,
  Edit3,
  Lock,
  Unlock,
  Camera,
  RotateCcw,
} from "lucide-react";
import type { ReelDraft } from "@/ai/schemas";

type ContentVersion = {
  id: string;
  versionNumber: number;
  payload: unknown;
  lockedSections: unknown;
  createdAt: Date;
  changeNote?: string | null;
  reviews: Array<{
    id: string;
    status: string;
    issues: Array<{
      id: string;
      severity: string;
      field?: string | null;
      reason: string;
      suggestion?: string | null;
      resolution?: string | null;
    }>;
  }>;
  approvals: Array<{ id: string; approvedAt: Date }>;
};

type ContentItem = {
  id: string;
  type: string;
  title: string | null;
  editorialStatus: string;
  productionStatus: string;
  versions: ContentVersion[];
  publications: Array<{ publishedAt: Date; url?: string | null }>;
};

interface ContentEditorClientProps {
  item: ContentItem;
  facts: Array<{ id: string; claim: string; publicationPermission: string }>;
  brandProfile: { publicName?: string | null; startYear?: number | null } | null;
}

const SECTION_LABELS: Record<string, string> = {
  hooks: "HOOK × 3",
  selectedHookKey: "Выбранный HOOK",
  segments: "Основной текст",
  ctas: "CTA × 2",
  selectedCtaKey: "Выбранный CTA",
  covers: "Обложки",
  caption: "Подпись",
  shootingNotes: "Съёмка",
};

export function ContentEditorClient({ item, facts, brandProfile }: ContentEditorClientProps) {
  const router = useRouter();
  const currentVersion = item.versions[0];
  const draft = currentVersion?.payload as ReelDraft | undefined;
  const latestReview = currentVersion?.reviews[0];
  const isApproved = currentVersion?.approvals.length > 0;

  const lockedSections = (currentVersion?.lockedSections as string[]) ?? [];
  const [localLocked, setLocalLocked] = useState<string[]>(lockedSections);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [activeSection, setActiveSection] = useState("hooks");

  const blockers = latestReview?.issues.filter((i) => i.severity === "blocker" && !i.resolution) ?? [];
  const warnings = latestReview?.issues.filter((i) => i.severity === "warning" && !i.resolution) ?? [];

  async function handleApprove() {
    if (!currentVersion || blockers.length > 0) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/content/${item.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentVersionId: currentVersion.id }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setApproving(false);
    }
  }

  function handleExport(format: "md" | "txt" | "json") {
    const url = `/api/content/${item.id}/export?format=${format}${currentVersion ? `&versionId=${currentVersion.id}` : ""}`;
    window.open(url, "_blank");
  }

  if (!draft) {
    return (
      <div className="empty-state" style={{ height: "100vh" }}>
        <div style={{ fontSize: "2rem" }}>📄</div>
        <h2>Сценарий ещё генерируется</h2>
        <p>Подождите завершения задачи или вернитесь позже.</p>
        <Link href="/content" className="btn btn-secondary">← Назад</Link>
      </div>
    );
  }

  const selectedHook = draft.hooks?.find((h) => h.key === draft.selectedHookKey);
  const selectedCta = draft.ctas?.find((c) => c.key === draft.selectedCtaKey);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link href="/content" className="btn btn-ghost btn-icon">
          <ChevronLeft size={16} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "0.95rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.title ?? draft.title ?? "Сценарий"}
          </h1>
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginTop: "0.2rem" }}>
            <span className={`badge ${isApproved ? "badge-approved" : "badge-draft"}`}>
              {isApproved ? "Согласован" : item.editorialStatus}
            </span>
            <span style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)" }}>
              v{currentVersion?.versionNumber ?? 1}
            </span>
            {draft.language && (
              <span className="badge badge-idea" style={{ fontSize: "0.7rem" }}>{draft.language}</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {/* Export dropdown */}
          <div style={{ position: "relative" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handleExport("md")}>
              <Download size={13} /> MD
            </button>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport("json")}>
            JSON
          </button>
          <Link href={`/shooting?itemId=${item.id}`} className="btn btn-secondary btn-sm">
            <Camera size={13} /> Телесуфлёр
          </Link>
          {!isApproved && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleApprove}
              disabled={approving || blockers.length > 0}
              title={blockers.length > 0 ? "Есть блокирующие проблемы" : "Утвердить сценарий"}
            >
              <CheckCircle size={13} />
              {approving ? "..." : "Утвердить"}
            </button>
          )}
        </div>
      </div>

      {/* Review issues banner */}
      {blockers.length > 0 && (
        <div style={{ padding: "0.625rem 1rem", background: "#fee2e2", borderBottom: "1px solid #fecaca", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
          <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: "0.82rem", color: "#dc2626" }}>
            <strong>{blockers.length} блокирующ{blockers.length > 1 ? "их" : "ая"} проблем{blockers.length > 1 ? "ы" : "а"}:</strong>{" "}
            {blockers.map((b) => b.reason).join("; ")}
          </div>
        </div>
      )}
      {warnings.length > 0 && blockers.length === 0 && (
        <div style={{ padding: "0.5rem 1rem", background: "#fef9c3", borderBottom: "1px solid #fde047", fontSize: "0.8rem", color: "#92400e" }}>
          ⚠️ {warnings.length} предупреждений: {warnings.map((w) => w.reason).join("; ")}
        </div>
      )}

      {/* Editor body */}
      <div className="editor-layout" style={{ flex: 1 }}>
        {/* Left: sections nav */}
        <div className="editor-sidebar">
          <div className="section-title">Разделы</div>
          {Object.entries(SECTION_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`nav-item ${activeSection === key ? "nav-item-active" : ""}`}
              style={{ width: "100%", textAlign: "left" }}
            >
              {localLocked.includes(key) ? <Lock size={12} color="var(--color-text-tertiary)" /> : null}
              {label}
            </button>
          ))}
        </div>

        {/* Center: editor */}
        <div className="editor-main">
          {activeSection === "hooks" && (
            <HooksSection
              hooks={draft.hooks}
              selectedKey={draft.selectedHookKey}
              locked={localLocked.includes("hooks")}
            />
          )}
          {activeSection === "segments" && (
            <SegmentsSection segments={draft.segments} locked={localLocked.includes("segments")} />
          )}
          {activeSection === "ctas" && (
            <CTAsSection ctas={draft.ctas} selectedKey={draft.selectedCtaKey} locked={localLocked.includes("ctas")} />
          )}
          {activeSection === "covers" && (
            <CoversSection covers={draft.covers} selectedIndex={draft.selectedCoverIndex} locked={localLocked.includes("covers")} />
          )}
          {activeSection === "caption" && (
            <TextSection title="Подпись (caption)" text={draft.caption} locked={localLocked.includes("caption")} />
          )}
          {activeSection === "shootingNotes" && (
            <ShootingSection notes={draft.shootingNotes} locked={localLocked.includes("shootingNotes")} />
          )}
          {(activeSection === "selectedHookKey" || activeSection === "selectedCtaKey") && (
            <div style={{ padding: "1rem", background: "var(--color-surface-secondary)", borderRadius: "var(--radius-lg)" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                {activeSection === "selectedHookKey"
                  ? `Выбранный HOOK: ${selectedHook?.text ?? "—"}`
                  : `Выбранный CTA: ${selectedCta?.text ?? "—"}`}
              </p>
            </div>
          )}
        </div>

        {/* Right: review panel */}
        <div className="editor-panel">
          <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--color-text-secondary)" }}>
            Замечания редактора
          </div>
          {latestReview ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {latestReview.issues.map((issue) => (
                <div key={issue.id} style={{
                  padding: "0.625rem",
                  borderRadius: "var(--radius-md)",
                  background: issue.severity === "blocker" ? "#fee2e2" : issue.severity === "warning" ? "#fef9c3" : "#eff6ff",
                  fontSize: "0.78rem",
                  lineHeight: 1.5,
                }}>
                  <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                    {issue.severity === "blocker" ? "🚫" : issue.severity === "warning" ? "⚠️" : "💡"}
                    {" "}{issue.field ?? "Общее"}
                  </div>
                  <div style={{ color: "var(--color-text-secondary)" }}>{issue.reason}</div>
                  {issue.suggestion && (
                    <div style={{ marginTop: "0.25rem", fontStyle: "italic", color: "var(--color-text-tertiary)" }}>
                      → {issue.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "1.5rem" }}>
              <div style={{ fontSize: "1.5rem" }}>✅</div>
              <p style={{ fontSize: "0.8rem", margin: 0 }}>Проверок пока нет</p>
            </div>
          )}

          {/* Missing info */}
          {draft.missingInformation && draft.missingInformation.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: "0.5rem" }}>
                Не хватает данных
              </div>
              {draft.missingInformation.map((m, i) => (
                <div key={i} style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", padding: "0.25rem 0", borderBottom: "1px solid var(--color-border-subtle)" }}>
                  · {m}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function HooksSection({
  hooks,
  selectedKey,
  locked,
}: {
  hooks: ReelDraft["hooks"];
  selectedKey: string;
  locked: boolean;
}) {
  return (
    <div>
      <SectionHeader title="HOOK × 3" locked={locked} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {hooks?.map((h) => (
          <div
            key={h.key}
            style={{
              padding: "1rem",
              border: `2px solid ${h.key === selectedKey ? "var(--color-brand-400)" : "var(--color-border)"}`,
              borderRadius: "var(--radius-lg)",
              background: h.key === selectedKey ? "var(--color-brand-50)" : "var(--color-surface)",
            }}
          >
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-text-tertiary)" }}>{h.key.toUpperCase()}</span>
              {h.key === selectedKey && <span className="badge badge-approved" style={{ fontSize: "0.7rem" }}>✓ Выбран</span>}
              <span className="badge badge-idea" style={{ fontSize: "0.65rem" }}>{h.mechanism}</span>
            </div>
            <p style={{ fontSize: "0.95rem", fontWeight: 500, marginBottom: "0.5rem", lineHeight: 1.5 }}>{h.text}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", margin: 0 }}>
              <em>Обоснование: {h.rationale}</em>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SegmentsSection({ segments, locked }: { segments: ReelDraft["segments"]; locked: boolean }) {
  return (
    <div>
      <SectionHeader title="Основной текст" locked={locked} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {segments?.map((seg) => (
          <div key={seg.key} style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-surface)" }}>
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.5rem" }}>
              <span className="badge badge-draft" style={{ fontSize: "0.7rem" }}>{seg.role}</span>
              {seg.exampleType && <span className="badge badge-warning" style={{ fontSize: "0.7rem" }}>
                {seg.exampleType === "teaching" ? "Shartli misol" : "Real misol"}
              </span>}
            </div>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{seg.spokenText}</p>
            {seg.onScreenText && (
              <div style={{ marginTop: "0.5rem", padding: "0.4rem 0.75rem", background: "#0a0a0a", color: "#f0f0f0", borderRadius: "var(--radius-sm)", fontSize: "0.8rem" }}>
                📺 {seg.onScreenText}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CTAsSection({ ctas, selectedKey, locked }: { ctas: ReelDraft["ctas"]; selectedKey: string; locked: boolean }) {
  return (
    <div>
      <SectionHeader title="CTA × 2" locked={locked} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {ctas?.map((c) => (
          <div key={c.key} style={{
            padding: "1rem",
            border: `2px solid ${c.key === selectedKey ? "var(--color-brand-400)" : "var(--color-border)"}`,
            borderRadius: "var(--radius-lg)",
            background: c.key === selectedKey ? "var(--color-brand-50)" : "var(--color-surface)",
          }}>
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-text-tertiary)" }}>{c.key.toUpperCase()}</span>
              {c.key === selectedKey && <span className="badge badge-approved" style={{ fontSize: "0.7rem" }}>✓ Выбран</span>}
              <span className="badge badge-idea" style={{ fontSize: "0.7rem" }}>{c.type}</span>
            </div>
            <p style={{ fontSize: "0.9rem", margin: 0 }}>{c.text || <em style={{ color: "var(--color-text-tertiary)" }}>Без CTA</em>}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", marginTop: "0.5rem", marginBottom: 0 }}>
              <em>{c.rationale}</em>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoversSection({ covers, selectedIndex, locked }: { covers: [string, string]; selectedIndex: 0 | 1; locked: boolean }) {
  return (
    <div>
      <SectionHeader title="Обложки" locked={locked} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {covers?.map((cover, i) => (
          <div key={i} style={{
            padding: "1.5rem",
            border: `2px solid ${i === selectedIndex ? "var(--color-brand-400)" : "var(--color-border)"}`,
            borderRadius: "var(--radius-lg)",
            background: i === selectedIndex ? "var(--color-brand-50)" : "var(--color-surface)",
            textAlign: "center",
            minHeight: 80,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
          }}>
            {i === selectedIndex && <span className="badge badge-approved" style={{ fontSize: "0.7rem" }}>✓ Выбрана</span>}
            <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{cover}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TextSection({ title, text, locked }: { title: string; text: string; locked: boolean }) {
  return (
    <div>
      <SectionHeader title={title} locked={locked} />
      <div style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-surface)", fontSize: "0.9rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
        {text}
      </div>
    </div>
  );
}

function ShootingSection({ notes, locked }: { notes: string[]; locked: boolean }) {
  return (
    <div>
      <SectionHeader title="План съёмки" locked={locked} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {notes?.map((note, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem", padding: "0.625rem 0.75rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}>
            <span style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }}>{i + 1}.</span>
            {note}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, locked }: { title: string; locked: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
      <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{title}</h2>
      {locked && <Lock size={14} color="var(--color-text-tertiary)" />}
    </div>
  );
}

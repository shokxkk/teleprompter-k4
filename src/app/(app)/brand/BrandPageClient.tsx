"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit3, Plus, ChevronDown, ChevronUp } from "lucide-react";

type BrandVersion = {
  id: string;
  versionNumber: number;
  publicName?: string | null;
  publicNameUz?: string | null;
  role?: string | null;
  geography?: string | null;
  bio?: string | null;
  bioUz?: string | null;
  startYear?: number | null;
  primaryAudience?: string | null;
  secondaryAudience?: string | null;
  audienceProblems?: unknown;
  brandVoice?: string | null;
  goals3to6months?: string | null;
  followerTarget?: number | null;
  contentLang?: string | null;
  limitations?: unknown;
  positionings: Array<{
    id: string;
    textUz?: string | null;
    explanationRu?: string | null;
    isSelected: boolean;
  }>;
};

type Service = {
  id: string;
  name: string;
  isActive: boolean;
  nameUz?: string | null;
  targetAudience?: string | null;
  clientProblem?: string | null;
};

type InterviewQuestion = {
  id: string;
  questionText: string;
  knowledgeField: string;
  status: string;
  answer?: string | null;
};

interface BrandPageClientProps {
  brandVersion: BrandVersion | null;
  services: Service[];
  interview: InterviewQuestion[];
  isDemoMode: boolean;
}

export function BrandPageClient({
  brandVersion,
  services,
  interview,
  isDemoMode,
}: BrandPageClientProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "positioning" | "services" | "interview">("profile");

  return (
    <div>
      {isDemoMode && (
        <div className="demo-banner">
          🎭 DEMO-режим
        </div>
      )}
      {/* Header */}
      <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Мой бренд</h1>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
          {brandVersion?.publicName ?? "Профиль не заполнен"}{brandVersion?.versionNumber ? ` · v${brandVersion.versionNumber}` : ""}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ padding: "0 1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", gap: "0" }}>
        {(["profile", "positioning", "services", "interview"] as const).map((tab) => {
          const labels = { profile: "Профиль", positioning: "Позиционирование", services: "Услуги", interview: "Анкета" };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.75rem 1rem",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? "var(--color-brand-600)" : "var(--color-text-secondary)",
                borderBottom: `2px solid ${activeTab === tab ? "var(--color-brand-500)" : "transparent"}`,
                marginBottom: -1,
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      <div className="page-container">
        {activeTab === "profile" && brandVersion && (
          <div style={{ maxWidth: 640 }}>
            <BrandField label="Публичное имя (Рус)" value={brandVersion.publicName} />
            <BrandField label="Публичное имя (Уз)" value={brandVersion.publicNameUz} />
            <BrandField label="Роль" value={brandVersion.role} />
            <BrandField label="В продажах с" value={brandVersion.startYear ? String(brandVersion.startYear) : undefined} />
            <BrandField label="География" value={brandVersion.geography} />
            <BrandField label="Первичная аудитория" value={brandVersion.primaryAudience} />
            <BrandField label="Вторичная аудитория" value={brandVersion.secondaryAudience} />
            <BrandField label="Голос бренда" value={brandVersion.brandVoice} multiline />
            <BrandField label="Bio (Рус)" value={brandVersion.bio} multiline />
            <BrandField label="Bio (Уз)" value={brandVersion.bioUz} multiline />
            <BrandField label="Цели (3–6 месяцев)" value={brandVersion.goals3to6months} multiline />
            <BrandField label="Язык контента" value={brandVersion.contentLang} />
            {Array.isArray(brandVersion.limitations) && brandVersion.limitations.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Ограничения</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {(brandVersion.limitations as string[]).map((l, i) => (
                    <span key={i} className="badge badge-warning">{l}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: "1.5rem" }}>
              <button className="btn btn-primary btn-sm" onClick={() => {
                const note = prompt("Что меняем? (коротко)");
                if (note) console.log("Edit brand:", note); // TODO: open edit modal
              }}>
                <Edit3 size={13} /> Редактировать
              </button>
            </div>
          </div>
        )}

        {activeTab === "profile" && !brandVersion && (
          <div className="empty-state" style={{ marginTop: "3rem" }}>
            <div style={{ fontSize: "2rem" }}>🏷️</div>
            <h2>Профиль не заполнен</h2>
            <p>Начните с AI-продюсером — он задаст нужные вопросы и заполнит профиль за вас.</p>
            <Link href="/producer" className="btn btn-primary">Открыть продюсера</Link>
          </div>
        )}

        {activeTab === "positioning" && (
          <div style={{ maxWidth: 700 }}>
            <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Варианты позиционирования</h2>
            {(brandVersion?.positionings ?? []).length === 0 ? (
              <div className="empty-state">
                <p>Позиционирование ещё не сгенерировано. Попросите продюсера: «Предложи 3 варианта позиционирования»</p>
                <Link href="/producer" className="btn btn-primary">Открыть продюсера</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {brandVersion!.positionings.map((pos) => (
                  <div key={pos.id} style={{
                    padding: "1rem",
                    border: `2px solid ${pos.isSelected ? "var(--color-brand-400)" : "var(--color-border)"}`,
                    borderRadius: "var(--radius-lg)",
                    background: pos.isSelected ? "var(--color-brand-50)" : "var(--color-surface)",
                  }}>
                    {pos.isSelected && <span className="badge badge-approved" style={{ marginBottom: "0.5rem", display: "inline-block" }}>✓ Активное</span>}
                    <div style={{ fontSize: "1rem", fontWeight: 600 }}>{pos.textUz}</div>
                    {pos.explanationRu && <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginTop: "0.5rem", marginBottom: 0 }}>{pos.explanationRu}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "services" && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1rem", margin: 0 }}>Услуги и продукты</h2>
              <button className="btn btn-primary btn-sm"><Plus size={13} /> Добавить</button>
            </div>
            {services.length === 0 ? (
              <div className="empty-state">
                <p>Услуги не добавлены</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {services.map((svc) => (
                  <div key={svc.id} className="card" style={{ padding: "0.875rem 1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{svc.name}</div>
                        {svc.nameUz && <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{svc.nameUz}</div>}
                        {svc.clientProblem && <div style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)", marginTop: "0.25rem" }}>{svc.clientProblem}</div>}
                      </div>
                      <span className={`badge ${svc.isActive ? "badge-approved" : "badge-idea"}`}>
                        {svc.isActive ? "Активна" : "Неактивна"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "interview" && (
          <div style={{ maxWidth: 640 }}>
            <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Анкета бренда</h2>
            {interview.length === 0 ? (
              <div className="empty-state">
                <p>Вопросы ещё не заданы</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {interview.map((q) => (
                  <div key={q.id} className="card" style={{ padding: "0.875rem 1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.25rem" }}>{q.questionText}</div>
                        {q.answer ? (
                          <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", background: "var(--color-surface-secondary)", padding: "0.4rem 0.6rem", borderRadius: "var(--radius-sm)" }}>
                            {q.answer}
                          </div>
                        ) : (
                          <Link href="/producer" style={{ fontSize: "0.78rem", color: "var(--color-brand-600)" }}>
                            Ответить в чате →
                          </Link>
                        )}
                      </div>
                      <span className={`badge ${q.status === "answered" ? "badge-approved" : "badge-warning"}`} style={{ flexShrink: 0 }}>
                        {q.status === "answered" ? "✓" : "?"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BrandField({
  label,
  value,
  multiline,
}: {
  label: string;
  value?: string | null;
  multiline?: boolean;
}) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div className="label">{label}</div>
      <div style={{
        padding: "0.6rem 0.875rem",
        background: "var(--color-surface-secondary)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        fontSize: "0.875rem",
        lineHeight: multiline ? 1.6 : 1.3,
        whiteSpace: multiline ? "pre-wrap" : "normal",
      }}>
        {value}
      </div>
    </div>
  );
}

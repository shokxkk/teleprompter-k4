"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  FileText,
  Calendar,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Zap,
  Mic,
} from "lucide-react";

interface DashboardClientProps {
  isDemoMode: boolean;
  workspace: { id: string; name: string; uiLang: string };
  priorityActions: {
    unansweredQuestions: number;
    pendingApproval: number;
    readyToShoot: number;
  };
  recentContent: Array<{
    id: string;
    type: string;
    title: string | null;
    editorialStatus: string;
    productionStatus: string;
    updatedAt: Date;
    versions: Array<{ versionNumber: number; createdAt: Date }>;
  }>;
  activeJobs: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: Date;
  }>;
  brandProfile: {
    publicName?: string | null;
    publicNameUz?: string | null;
    role?: string | null;
    startYear?: number | null;
  } | null;
}

const STATUS_LABELS: Record<string, string> = {
  idea: "Идея",
  needs_input: "Нужен ответ",
  draft: "Черновик",
  in_review: "На проверке",
  needs_changes: "Требует правок",
  ready_for_approval: "На согласовании",
  approved: "Согласован",
  not_started: "Не начат",
  ready_to_shoot: "Готово к съёмке",
  shot: "Снят",
  scheduled: "Запланирован",
  published: "Опубликован",
  archived: "Архив",
};

const JOB_TYPE_LABELS: Record<string, string> = {
  generate_reel: "Генерация Reels",
  generate_week: "План недели",
  generate_carousel: "Генерация карусели",
  review_content: "Проверка материала",
  transcribe_audio: "Расшифровка аудио",
  weekly_analysis: "Анализ недели",
};

export function DashboardClient({
  isDemoMode,
  workspace,
  priorityActions,
  recentContent,
  activeJobs,
  brandProfile,
}: DashboardClientProps) {
  const router = useRouter();
  const hasPriorities =
    priorityActions.unansweredQuestions > 0 ||
    priorityActions.pendingApproval > 0 ||
    priorityActions.readyToShoot > 0;

  return (
    <div>
      {/* Demo banner */}
      {isDemoMode && (
        <div className="demo-banner">
          🎭 DEMO-режим — AI работает с тестовыми данными. Добавьте OpenAI API-ключ в{" "}
          <Link href="/settings" style={{ textDecoration: "underline" }}>Настройках</Link> для реального режима
        </div>
      )}

      <div className="page-container">
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ marginBottom: "0.25rem" }}>Сегодня</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
            {brandProfile?.publicName
              ? `Привет, ${brandProfile.publicName.split(" ")[0]}`
              : "Добро пожаловать в Brand Office"}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
          {/* Priority Actions */}
          <div className="card" style={{ padding: "1.25rem", gridColumn: "1 / -1" }}>
            <h2 style={{ fontSize: "1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Zap size={16} color="var(--color-brand-500)" />
              Приоритетные действия
            </h2>

            {!hasPriorities ? (
              <div className="empty-state" style={{ padding: "1.5rem" }}>
                <CheckCircle2 size={32} color="var(--color-success)" />
                <p style={{ margin: 0, fontSize: "0.875rem" }}>Всё сделано! Готовы к новой неделе.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {priorityActions.unansweredQuestions > 0 && (
                  <PriorityCard
                    icon={<MessageSquare size={16} />}
                    label={`Ответить на ${priorityActions.unansweredQuestions} вопрос${priorityActions.unansweredQuestions > 1 ? "а" : ""} продюсера`}
                    color="var(--color-brand-500)"
                    href="/producer"
                    bg="var(--color-brand-50)"
                  />
                )}
                {priorityActions.pendingApproval > 0 && (
                  <PriorityCard
                    icon={<AlertTriangle size={16} />}
                    label={`${priorityActions.pendingApproval} материал${priorityActions.pendingApproval > 1 ? "а" : ""} на согласовании`}
                    color="var(--color-warning)"
                    href="/content?status=ready_for_approval"
                    bg="#fef9c3"
                  />
                )}
                {priorityActions.readyToShoot > 0 && (
                  <PriorityCard
                    icon={<Camera size={16} />}
                    label={`${priorityActions.readyToShoot} ролик${priorityActions.readyToShoot > 1 ? "а" : ""} готово к съёмке`}
                    color="var(--color-success)"
                    href="/shooting"
                    bg="#dcfce7"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
          <QuickAction
            icon={<Mic size={18} />}
            label="Рассказать голосом"
            desc="Новое наблюдение или идея"
            href="/producer?mode=voice"
            color="var(--color-brand-600)"
          />
          <QuickAction
            icon={<FileText size={18} />}
            label="Новый сценарий"
            desc="Reels, карусель или Stories"
            href="/producer?task=generate"
            color="#0891b2"
          />
          <QuickAction
            icon={<Calendar size={18} />}
            label="Подготовить неделю"
            desc="7 публикаций + Stories"
            href="/content?action=plan_week"
            color="#059669"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1.5rem" }}>
          {/* Recent Content */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1rem", margin: 0 }}>Последние материалы</h2>
              <Link href="/content" className="btn btn-ghost btn-sm" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                Все <ChevronRight size={14} />
              </Link>
            </div>

            {recentContent.length === 0 ? (
              <div className="empty-state">
                <FileText size={28} />
                <p style={{ margin: 0, fontSize: "0.875rem" }}>Материалов пока нет</p>
                <Link href="/producer" className="btn btn-primary btn-sm">Начать с продюсером</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {recentContent.map((item) => (
                  <Link
                    key={item.id}
                    href={`/content/${item.id}`}
                    style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", transition: "background 0.12s", textDecoration: "none" }}
                    className="card-hover"
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: "var(--radius-sm)",
                      background: item.type === "reel" ? "#eff6ff" : item.type === "carousel" ? "#f0fdf4" : "#faf5ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "0.75rem",
                    }}>
                      {item.type === "reel" ? "🎬" : item.type === "carousel" ? "📊" : "📖"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--color-text-primary)" }}>
                        {item.title ?? `${item.type} без названия`}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
                        {STATUS_LABELS[item.editorialStatus] ?? item.editorialStatus}
                      </div>
                    </div>
                    <ChevronRight size={14} color="var(--color-text-tertiary)" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Active Jobs */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Статус AI</h2>

            {activeJobs.length === 0 ? (
              <div className="empty-state" style={{ padding: "1.5rem" }}>
                <CheckCircle2 size={24} color="var(--color-success)" />
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>Нет активных задач</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {activeJobs.map((job) => (
                  <div key={job.id} style={{ padding: "0.625rem 0.75rem", background: "var(--color-surface-secondary)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="spinner" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {JOB_TYPE_LABELS[job.type] ?? job.type}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)" }}>
                        {job.status === "queued" ? "В очереди" : "Выполняется"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Demo mode info */}
            {isDemoMode && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--color-demo-bg)", borderRadius: "var(--radius-md)", fontSize: "0.78rem", color: "var(--color-demo-text)" }}>
                🎭 AI работает в DEMO-режиме
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PriorityCard({
  icon, label, color, href, bg,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  href: string;
  bg: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        borderRadius: "var(--radius-md)",
        background: bg,
        textDecoration: "none",
        transition: "opacity 0.12s",
        color: "var(--color-text-primary)",
      }}
    >
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: "0.875rem", fontWeight: 500, flex: 1 }}>{label}</span>
      <ChevronRight size={14} color="var(--color-text-tertiary)" />
    </Link>
  );
}

function QuickAction({
  icon, label, desc, href, color,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="card card-hover"
      style={{ padding: "1rem", textDecoration: "none", display: "block" }}
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: "var(--radius-md)",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "0.625rem",
        color: "white",
      }}>
        {icon}
      </div>
      <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.25rem" }}>{label}</div>
      <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{desc}</div>
    </Link>
  );
}

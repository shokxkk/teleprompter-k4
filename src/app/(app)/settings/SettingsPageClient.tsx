"use client";

import { useState } from "react";
import { Settings, Cpu, Shield, Save } from "lucide-react";

interface WorkspaceSettings {
  publicationsPerWeek: number;
  reelsPerWeek: number;
  carouselsPerWeek: number;
  llmProvider: string;
  llmModel: string;
  demoMode: boolean;
  dailyTokenLimit: number;
}

interface Workspace {
  id: string;
  name: string;
  timezone: string;
  uiLang: string;
}

interface SettingsPageClientProps {
  workspace: Workspace;
  settings: WorkspaceSettings | null;
}

export function SettingsPageClient({ workspace, settings }: SettingsPageClientProps) {
  const [demoMode, setDemoMode] = useState(settings?.demoMode ?? false);
  const [llmProvider, setLlmProvider] = useState(settings?.llmProvider ?? "openai");
  const [llmModel, setLlmModel] = useState(settings?.llmModel ?? "gpt-4o-mini");
  const [reelsPerWeek, setReelsPerWeek] = useState(settings?.reelsPerWeek ?? 4);
  const [carouselsPerWeek, setCarouselsPerWeek] = useState(settings?.carouselsPerWeek ?? 3);
  const [tokenLimit, setTokenLimit] = useState(settings?.dailyTokenLimit ?? 100000);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demoMode,
          llmProvider,
          llmModel,
          reelsPerWeek: Number(reelsPerWeek),
          carouselsPerWeek: Number(carouselsPerWeek),
          dailyTokenLimit: Number(tokenLimit),
        }),
      });

      if (res.ok) {
        setMessage("✅ Настройки успешно сохранены");
      } else {
        setMessage("❌ Ошибка сохранения");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Настройки Workspace</h1>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
          Параметры AI-моделей, лимиты токенов, DEMO-режим и цели публикаций
        </p>
      </div>

      <div className="page-container" style={{ maxWidth: 640 }}>
        {message && (
          <div style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", background: "var(--color-surface-secondary)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* AI Settings Section */}
          <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Cpu size={18} /> ИИ-Провайдер и Режим
            </h2>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                />
                Включить DEMO-режим (детерминированные ответы без расхода токенов)
              </label>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)", margin: "0.25rem 0 0 1.5rem" }}>
                Все генерации будут возвращать готовые проверенные ответы с префиксом [DEMO]
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label className="label">LLM Провайдер</label>
                <select className="input" value={llmProvider} onChange={(e) => setLlmProvider(e.target.value)}>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="mock">MockProvider (DEMO)</option>
                </select>
              </div>

              <div>
                <label className="label">Модель</label>
                <select className="input" value={llmModel} onChange={(e) => setLlmModel(e.target.value)}>
                  <option value="gpt-4o-mini">gpt-4o-mini (быстро)</option>
                  <option value="gpt-4o">gpt-4o (высокая точность)</option>
                  <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Дневной лимит токенов</label>
              <input
                type="number"
                className="input"
                value={tokenLimit}
                onChange={(e) => setTokenLimit(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Plan Settings */}
          <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Settings size={18} /> Цели контент-плана
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="label">Reels в неделю</label>
                <input
                  type="number"
                  className="input"
                  value={reelsPerWeek}
                  onChange={(e) => setReelsPerWeek(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="label">Карусели в неделю</label>
                <input
                  type="number"
                  className="input"
                  value={carouselsPerWeek}
                  onChange={(e) => setCarouselsPerWeek(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={14} /> {saving ? "Сохранение..." : "Сохранить настройки"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

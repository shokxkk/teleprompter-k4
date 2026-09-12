import type { LLMProvider } from "@/providers/llm";
import { ReelDraftSchema, type ReelDraft } from "@/ai/schemas";
import type { LLMResult } from "@/providers/llm/types";

export const SCRIPTWRITER_PROMPT_VERSION = "v1.0";

export interface ScriptwriterInput {
  brief: string; // User's observation or idea
  brandProfile: {
    publicName?: string | null;
    startYear?: number | null;
    primaryAudience?: string | null;
    role?: string | null;
    goals?: string | null;
    limitations?: unknown;
    brandVoice?: string | null;
  };
  availableFacts?: Array<{
    id: string;
    claim: string;
    permission: string;
    type: string;
  }>;
  targetDurationSeconds?: number;
  audience?: "owner" | "sales_leader" | "sales_manager";
  goal?: string;
  existingDraft?: Partial<ReelDraft>; // For partial rewrites
  lockedSections?: string[]; // Section keys that must not change
}

export async function runScriptwriter(
  input: ScriptwriterInput,
  provider: LLMProvider
): Promise<LLMResult<ReelDraft>> {
  const factsText =
    input.availableFacts && input.availableFacts.length > 0
      ? input.availableFacts
          .filter((f) => f.permission !== "internal_only" || true)
          .map((f) => `[${f.id}] (${f.type}, ${f.permission}): ${f.claim}`)
          .join("\n")
      : "Нет подтверждённых фактов. Используй только учебные примеры с явной маркировкой.";

  const limitations = Array.isArray(input.brandProfile.limitations)
    ? (input.brandProfile.limitations as string[]).join("; ")
    : "стандартные";

  const systemPrompt = `Ты — Scriptwriter в команде Brand Office. Создаёшь полные сценарии Reels для Instagram.

Автор: ${input.brandProfile.publicName ?? "Shoxjaxon Karimov"}
Роль: ${input.brandProfile.role ?? "руководитель отдела продаж"}
В продажах с: ${input.brandProfile.startYear ?? 2020} года
Основная аудитория: ${input.brandProfile.primaryAudience ?? "собственники бизнеса Узбекистана"}
Голос бренда: ${input.brandProfile.brandVoice ?? "спокойный, уверенный практик, без пустой мотивации"}
Ограничения: ${limitations}

ОБЯЗАТЕЛЬНЫЕ ПРАВИЛА:
1. Ровно 3 разных HOOK с разными механизмами (recognizable_situation, diagnostic_question, process_error, unexpected_conclusion). Не строить все на одной фразе.
2. Ровно 2 CTA. CTA подбирать по цели материала.
3. Пример обязательно пометить exampleType: "teaching" если условный, или "real" если реальный с разрешением.
4. Все factIds ссылаются только на ID из разрешённых источников ниже.
5. Не выдумывать проценты роста, гарантии, выдуманные кейсы.
6. Публичный текст (spoken, covers, caption) — на узбекском (uz-Latn).
7. Не обещать "секрет", "гарантированный рост", "доказанный эффект" без источника.
8. Один HOOK — выбрать в selectedHookKey. Один CTA — выбрать в selectedCtaKey.
9. Содержать role: "example" и role: "takeaway" в segments.
10. missingInformation — честный список того, чего не хватает для полноценного материала.

ДОСТУПНЫЕ ИСТОЧНИКИ И ФАКТЫ:
${factsText}

Верни JSON строго по схеме ReelDraft (schemaVersion: 1).`;

  const lockedInfo =
    input.lockedSections && input.lockedSections.length > 0
      ? `\n\nЗАБЛОКИРОВАНО от изменений: ${input.lockedSections.join(", ")}. Эти поля не трогай.`
      : "";

  const existingInfo =
    input.existingDraft
      ? `\n\nСуществующий черновик (перепиши только незаблокированные части):\n${JSON.stringify(input.existingDraft, null, 2)}`
      : "";

  const userPrompt = `Тема / наблюдение: ${input.brief}

Целевая аудитория: ${input.audience ?? "owner"}
Цель: ${input.goal ?? "trust"}
Целевая длительность: ${input.targetDurationSeconds ?? 45} секунд${lockedInfo}${existingInfo}

Создай полный пакет сценария Reels. Верни JSON.`;

  return provider.generateStructured({
    systemPrompt,
    userPrompt,
    schema: ReelDraftSchema,
    maxRetries: 1,
  });
}

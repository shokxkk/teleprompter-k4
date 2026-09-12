import type { LLMProvider } from "@/providers/llm";
import { ReviewOutputSchema, type ReviewOutput } from "@/ai/schemas";
import type { ReelDraft } from "@/ai/schemas";
import type { LLMResult } from "@/providers/llm/types";

export const REVIEWER_PROMPT_VERSION = "v1.0";

export interface ReviewerInput {
  draft: ReelDraft;
  availableFacts: Array<{
    id: string;
    claim: string;
    permission: string;
    evidenceStatus: string;
  }>;
  brandLimitations?: string[];
  services?: Array<{ name: string; confirmedContent?: string | null }>;
}

export async function runEvidenceReviewer(
  input: ReviewerInput,
  provider: LLMProvider
): Promise<LLMResult<ReviewOutput>> {
  const factMap = Object.fromEntries(
    input.availableFacts.map((f) => [f.id, f])
  );

  // Server-side checks (not LLM-dependent)
  const serverIssues: Array<{
    severity: "blocker" | "warning" | "suggestion";
    field?: string;
    fragment?: string;
    reason: string;
    suggestion?: string;
  }> = [];

  // Check: all factIds in segments must reference valid sources
  for (const seg of input.draft.segments) {
    for (const fid of seg.factIds) {
      if (!factMap[fid]) {
        serverIssues.push({
          severity: "blocker",
          field: `segments.${seg.key}.factIds`,
          fragment: fid,
          reason: `Источник с ID "${fid}" не найден в разрешённых источниках`,
          suggestion: "Удалить ссылку или добавить источник",
        });
      } else if (factMap[fid].permission === "internal_only") {
        serverIssues.push({
          severity: "blocker",
          field: `segments.${seg.key}.factIds`,
          fragment: fid,
          reason: `Источник "${fid}" помечен internal_only — нельзя использовать в публичном материале`,
          suggestion: "Получить разрешение пользователя или удалить ссылку",
        });
      }
    }
    // Check example is marked
    if (seg.role === "example" && !seg.exampleType) {
      serverIssues.push({
        severity: "blocker",
        field: `segments.${seg.key}`,
        reason: "Пример не помечен как real или teaching",
        suggestion: 'Добавить exampleType: "teaching" или "real"',
      });
    }
  }

  // Check: promised asset in CTA must not reference non-existent material
  for (const cta of input.draft.ctas) {
    if (cta.promisedAssetId && cta.promisedAssetId !== "none") {
      // This would need to be checked against DB — mark as warning
      serverIssues.push({
        severity: "blocker",
        field: `ctas.${cta.key}`,
        fragment: cta.promisedAssetId,
        reason: "CTA обещает материал по коду — убедитесь что он создан и утверждён",
        suggestion: "Уберите обещание или создайте материал",
      });
    }
  }

  // Check: selected hook and cta must exist
  const hookExists = input.draft.hooks.some(
    (h) => h.key === input.draft.selectedHookKey
  );
  const ctaExists = input.draft.ctas.some(
    (c) => c.key === input.draft.selectedCtaKey
  );

  if (!hookExists) {
    serverIssues.push({
      severity: "blocker",
      field: "selectedHookKey",
      reason: "Выбранный HOOK не найден в списке hooks",
    });
  }
  if (!ctaExists) {
    serverIssues.push({
      severity: "blocker",
      field: "selectedCtaKey",
      reason: "Выбранный CTA не найден в списке ctas",
    });
  }

  const systemPrompt = `Ты — Evidence & Brand Reviewer. Проверяешь черновик Reels на соответствие фактам, языку и правилам бренда.

Твои обязанности:
1. Проверить: одна главная мысль, HOOK раскрыт в основной части, пример помечен, CTA уместен.
2. Проверить: нет выдуманных процентов, гарантий, обвинений в адрес менеджеров.
3. Проверить: язык публичного текста естественный узбекский, нет канцелярита.
4. Проверить: нет одновременно нескольких CTA в тексте.
5. Проверить: нет объявлений набора или курса без подтверждения.

Уровни severity:
- blocker: нельзя утвердить до исправления
- warning: предложить правку, пользователь может принять с замечанием
- suggestion: не блокировать

Уже найденные сервером проблемы (добавь к ним языковые и смысловые):
${JSON.stringify(serverIssues, null, 2)}

Вернуть JSON: { issues: [...], hasBlockers: boolean, summary: string }`;

  const userPrompt = `Черновик для проверки:
${JSON.stringify(input.draft, null, 2)}

Ограничения бренда: ${(input.brandLimitations ?? []).join("; ") || "стандартные"}
Услуги (не выдумывать условия): ${JSON.stringify(input.services ?? [])}

Верни ReviewOutput JSON.`;

  const result = await provider.generateStructured({
    systemPrompt,
    userPrompt,
    schema: ReviewOutputSchema,
    maxRetries: 1,
  });

  // Merge server issues into LLM issues
  result.data.issues = [...serverIssues, ...result.data.issues];
  result.data.hasBlockers =
    result.data.issues.some((i) => i.severity === "blocker");

  return result;
}

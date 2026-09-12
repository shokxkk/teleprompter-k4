import type { LLMProvider } from "@/providers/llm";
import {
  BrandStrategistOutputSchema,
  type BrandStrategistOutput,
  WeekPlanOutputSchema,
  type WeekPlanOutput,
  InterviewerOutputSchema,
  type InterviewerOutput,
  AnalystOutputSchema,
  type AnalystOutput,
  CarouselDraftSchema,
  type CarouselDraft,
} from "@/ai/schemas";
import type { LLMResult } from "@/providers/llm/types";

// ================================================================
// BRAND STRATEGIST
// ================================================================

export const STRATEGIST_PROMPT_VERSION = "v1.0";

export async function runBrandStrategist(
  input: {
    brandProfile: {
      publicName?: string | null;
      role?: string | null;
      startYear?: number | null;
      primaryAudience?: string | null;
      secondaryAudience?: string | null;
      audienceProblems?: unknown;
      goals?: string | null;
      services?: Array<{ name: string; clientProblem?: string | null }>;
    };
  },
  provider: LLMProvider
): Promise<LLMResult<BrandStrategistOutput>> {
  const systemPrompt = `Ты — Brand Strategist в Brand Office. Предлагаешь 3 варианта позиционирования для Instagram.

Правила:
1. Три разных угла позиционирования — не одинаковые с заменой слов.
2. textUz — на естественном узбекском (uz-Latn), краткая формулировка для шапки профиля.
3. explanationRu — на русском: объяснение выбора для автора.
4. Не обещать подписчиков, выручку, вирусность.
5. Не выдумывать кейсы или результаты.
6. assumptions — честный список допущений при нехватке данных.
7. recommendation — одно предложение: какой вариант и почему.

Верни JSON: { positionings: [...x3], recommendation, gaps }`;

  const userPrompt = `Профиль автора:
- Имя: ${input.brandProfile.publicName}
- Роль: ${input.brandProfile.role}
- В продажах с: ${input.brandProfile.startYear}
- Аудитория: ${input.brandProfile.primaryAudience}
- Вторичная аудитория: ${input.brandProfile.secondaryAudience}
- Проблемы аудитории: ${JSON.stringify(input.brandProfile.audienceProblems)}
- Цели: ${input.brandProfile.goals}
- Услуги: ${JSON.stringify(input.brandProfile.services ?? [])}

Предложи 3 позиционирования.`;

  return provider.generateStructured({
    systemPrompt,
    userPrompt,
    schema: BrandStrategistOutputSchema,
    maxRetries: 1,
  });
}

// ================================================================
// MARKETING PLANNER
// ================================================================

export const PLANNER_PROMPT_VERSION = "v1.0";

export async function runMarketingPlanner(
  input: {
    weekStart: string; // ISO date
    weekEnd: string;
    brandProfile: {
      publicName?: string | null;
      primaryAudience?: string | null;
      contentLang?: string;
    };
    services?: Array<{ name: string; isActive: boolean }>;
    maxSalesPostsPerWeek?: number;
    reelsPerWeek?: number;
    carouselsPerWeek?: number;
    availableSources?: Array<{ id: string; title?: string | null; type: string }>;
  },
  provider: LLMProvider
): Promise<LLMResult<WeekPlanOutput>> {
  const systemPrompt = `Ты — Marketing Planner в Brand Office. Создаёшь план контента на неделю.

Правила:
1. Ровно 7 основных публикаций (reel или carousel).
2. Максимум ${input.maxSalesPostsPerWeek ?? 2} публикации с прямым призывом к услуге (goal: inquiry).
3. Большинство публикаций адресованы собственникам (audience: owner).
4. Разные цели: awareness, trust, save, discussion, inquiry, learning_research.
5. Не дублировать темы.
6. Stories — отдельный массив storiesItems.
7. Не выдумывать кейсы — если нет источников, пиши о проблемах аудитории.
8. salesPostCount — число постов с goal: inquiry.

Верни JSON WeekPlanOutput.`;

  const userPrompt = `Неделя: ${input.weekStart} — ${input.weekEnd}
Аудитория: ${input.brandProfile.primaryAudience}
Reels в неделю: ${input.reelsPerWeek ?? 4}
Карусели в неделю: ${input.carouselsPerWeek ?? 3}
Услуги: ${JSON.stringify(input.services ?? [])}
Доступные источники: ${JSON.stringify(input.availableSources ?? [])}

Создай план. В notes укажи общую логику недели.`;

  return provider.generateStructured({
    systemPrompt,
    userPrompt,
    schema: WeekPlanOutputSchema,
    maxRetries: 1,
  });
}

// ================================================================
// INTERVIEWER
// ================================================================

export const INTERVIEWER_PROMPT_VERSION = "v1.0";

export async function runInterviewer(
  input: {
    answeredQuestions: Array<{
      questionText: string;
      knowledgeField: string;
      answer?: string | null;
      status: string;
    }>;
    unknownFields: string[];
    lastAnswer?: string | null;
    brandProfile: {
      startYear?: number | null;
      publicName?: string | null;
    };
  },
  provider: LLMProvider
): Promise<LLMResult<InterviewerOutput>> {
  const systemPrompt = `Ты — Interviewer в Brand Office. Адаптивно собираешь информацию о бренде.

Правила:
1. Задавай ОДИН вопрос за раз.
2. Не повторяй уже отвеченные вопросы.
3. Не спрашивай о дате начала (${input.brandProfile.startYear ?? 2020}) — уже известно.
4. Объясни зачем нужен ответ (purpose).
5. Если proposedFacts — предлагай сохранить конкретные сведения из последнего ответа.
6. isDone: true если все ключевые поля заполнены.
7. Не выдумывай ответы за пользователя.

Верни JSON InterviewerOutput.`;

  const userPrompt = `Отвеченные вопросы: ${JSON.stringify(input.answeredQuestions)}
Незаполненные поля: ${input.unknownFields.join(", ")}
Последний ответ пользователя: ${input.lastAnswer ?? "—"}

Какой следующий вопрос задать?`;

  return provider.generateStructured({
    systemPrompt,
    userPrompt,
    schema: InterviewerOutputSchema,
    maxRetries: 1,
  });
}

// ================================================================
// ANALYST
// ================================================================

export const ANALYST_PROMPT_VERSION = "v1.0";

export async function runAnalyst(
  input: {
    periodStart: string;
    periodEnd: string;
    metrics: Array<{
      contentTitle?: string | null;
      publishedAt?: string | null;
      views?: number | null;
      reach?: number | null;
      saves?: number | null;
      shares?: number | null;
      comments?: number | null;
      profileVisits?: number | null;
      follows?: number | null;
      windowDays?: number | null;
      measuredAt?: string | null;
    }>;
    inquiries?: Array<{
      status: string;
      source?: string | null;
      trainingInterest?: boolean;
    }>;
    previousHypothesis?: string | null;
  },
  provider: LLMProvider
): Promise<LLMResult<AnalystOutput>> {
  const systemPrompt = `Ты — Analyst в Brand Office. Анализируешь реальную статистику публикаций.

Правила:
1. Отделяй наблюдения от гипотез (isHypothesis).
2. Показывай недостаток данных честно.
3. Предлагай ОДИН конкретный эксперимент на следующую неделю.
4. 0 — реальный ноль. null — данных нет. Не путать.
5. Не суммировать накопительные замеры одной публикации.
6. Не вычислять досмотры из среднего времени.
7. Не выдавать разницу показателей за причинный эффект HOOK.
8. Не показывать "вероятность вирусности".
9. При разных окнах замера — предупреждать о несопоставимости.
10. Если данных нет — insufficientData: true и предложить что собрать.
11. DEMO-цифры не участвуют в реальном отчёте.

Верни JSON AnalystOutput.`;

  const userPrompt = `Период: ${input.periodStart} — ${input.periodEnd}
Метрики: ${JSON.stringify(input.metrics)}
Обращения: ${JSON.stringify(input.inquiries ?? [])}
Гипотеза прошлой недели: ${input.previousHypothesis ?? "нет"}

Создай разбор недели.`;

  return provider.generateStructured({
    systemPrompt,
    userPrompt,
    schema: AnalystOutputSchema,
    maxRetries: 1,
  });
}

// ================================================================
// UZBEK EDITOR
// ================================================================

const UzbekEditorOutputSchema = CarouselDraftSchema.partial().extend({
  editedText: CarouselDraftSchema.shape.caption.optional(),
});

export async function runUzbekEditor(
  input: {
    originalText: string;
    context: string;
    voiceExamples?: string[];
  },
  provider: LLMProvider
): Promise<{ editedText: string; notes: string }> {
  const systemPrompt = `Ты — Uzbek Editor. Редактируешь тексты на узбекском языке (uz-Latn).

Правила:
1. Сохраняй смысл и факты — не добавляй новые.
2. Пиши на живом, разговорном, но грамотном узбекском.
3. Не переводи буквально — адаптируй.
4. Не добавляй клише, мотивационные фразы, самовосхваление.
5. Примеры голоса автора для ориентира: ${(input.voiceExamples ?? []).join(" | ") || "нет"}
6. Верни: { editedText: "...", notes: "комментарий на русском" }`;

  const userPrompt = `Контекст: ${input.context}

Исходный текст:
${input.originalText}

Отредактируй. Верни JSON { editedText, notes }.`;

  const result = await provider.generateStructured({
    systemPrompt,
    userPrompt,
    schema: UzbekEditorOutputSchema,
    maxRetries: 1,
  });

  return {
    editedText: (result.data as { editedText?: string }).editedText ?? input.originalText,
    notes: (result.data as { notes?: string }).notes ?? "",
  };
}

// ================================================================
// CAROUSEL REPURPOSER
// ================================================================

export const REPURPOSER_PROMPT_VERSION = "v1.0";

export async function runContentRepurposer(
  input: {
    sourceContent: {
      title: string;
      mainIdea: string;
      segments: Array<{ spokenText: string; role: string; factIds: string[] }>;
      sourceIds: string[];
    };
    targetFormat: "carousel" | "story";
    audience: "owner" | "sales_leader" | "sales_manager";
    goal: string;
  },
  provider: LLMProvider
): Promise<LLMResult<CarouselDraft>> {
  const systemPrompt = `Ты — Content Repurposer. Перерабатываешь утверждённые материалы в новые форматы.

Правила:
1. Сохраняй связь с исходником (sourceIds).
2. Меняй угол, пример и практическое действие — не только слова.
3. Не добавляй факты которых не было в исходнике.
4. Пометить в notes: чем новая публикация отличается от предыдущей.
5. Количество слайдов: 5–8 для карусели.

Верни JSON CarouselDraft.`;

  const userPrompt = `Исходный материал: ${JSON.stringify(input.sourceContent)}
Целевой формат: ${input.targetFormat}
Аудитория: ${input.audience}
Цель: ${input.goal}

Создай новый материал.`;

  return provider.generateStructured({
    systemPrompt,
    userPrompt,
    schema: CarouselDraftSchema,
    maxRetries: 1,
  });
}

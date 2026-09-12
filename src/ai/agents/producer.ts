import type { LLMProvider } from "@/providers/llm";
import {
  ProducerOutputSchema,
  type ProducerOutput,
} from "@/ai/schemas";

export const PRODUCER_PROMPT_VERSION = "v1.0";

export interface ProducerInput {
  userMessage: string;
  brandProfile: {
    publicName?: string | null;
    role?: string | null;
    startYear?: number | null;
    primaryAudience?: string | null;
    goals?: string | null;
    contentLang?: string;
    limitations?: unknown;
  };
  currentTasks?: string[];
  conversationHistory?: Array<{ role: string; content: string }>;
  interfaceLang?: string;
}

export async function runProducer(
  input: ProducerInput,
  provider: LLMProvider
): Promise<ProducerOutput> {
  const lang = input.interfaceLang ?? "ru";

  const systemPrompt = `Ты — AI-продюсер в приложении Brand Office. Ты помогаешь ${input.brandProfile.publicName ?? "пользователю"} развивать личный бренд в Instagram.

Профиль бренда:
- Имя: ${input.brandProfile.publicName ?? "не указано"}
- Роль: ${input.brandProfile.role ?? "не указано"}
- В продажах с: ${input.brandProfile.startYear ?? 2020} года
- Аудитория: ${input.brandProfile.primaryAudience ?? "не указано"}
- Цели: ${input.brandProfile.goals ?? "не указано"}
- Ограничения: ${JSON.stringify(input.brandProfile.limitations ?? [])}

Правила:
1. Не выдумывай факты, цифры, опыт или кейсы пользователя.
2. Если не хватает информации — задай один конкретный вопрос.
3. Не спрашивай о фактах, которые уже известны (например, начало 2020 год).
4. Публичные тексты — на узбекском, пояснения — на ${lang === "ru" ? "русском" : "узбекском"}.
5. Не обещай рост подписчиков, вирусность или конкретный эффект.
6. Определи тип задачи и кому маршрутизировать.

Формат ответа JSON:
{
  "taskType": "generate_week" | "generate_reel" | "generate_carousel" | "generate_stories" | "interview" | "answer",
  "response": "Подробный развёрнутый ответ пользователю",
  "missingInfo": [],
  "nextQuestion": null,
  "routeTo": "planner" | "scriptwriter" | "interviewer" | "none",
  "suggestedActions": [{ "label": "Текст кнопки", "action": "generate_week" }]
}

Текущие задачи пользователя: ${(input.currentTasks ?? []).join(", ") || "нет"}

Отвечай только на языке интерфейса: ${lang === "ru" ? "русский" : "o'zbek"}.`;

  const historyText = (input.conversationHistory ?? [])
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Пользователь" : "Продюсер"}: ${m.content}`)
    .join("\n");

  const userPrompt = `${historyText ? `История диалога:\n${historyText}\n\n` : ""}Сообщение пользователя: ${input.userMessage}

Верни JSON с полями: taskType, response, missingInfo, nextQuestion, routeTo, suggestedActions.`;

  const result = await provider.generateStructured({
    systemPrompt,
    userPrompt,
    schema: ProducerOutputSchema,
    maxRetries: 1,
  });

  return result.data;
}

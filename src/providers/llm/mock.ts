import { z } from "zod";
import type { LLMProvider, LLMResult, StreamChunk } from "./types";

/**
 * MockProvider — deterministic DEMO mode.
 * Always marks results as source: "demo".
 * Never pretends to be a real AI response.
 */
export class MockProvider implements LLMProvider {
  name = "mock";
  isDemo = true;
  model = "demo";

  async generateStructured<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: z.ZodType<T>;
  }): Promise<LLMResult<T>> {
    // Return a minimal valid object matching the schema
    const demoData = buildDemoResponse(params.schema, params.userPrompt);

    return {
      data: demoData as T,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      source: "demo",
    };
  }

  async streamText(params: {
    systemPrompt: string;
    userPrompt: string;
    onChunk: (chunk: StreamChunk) => void;
  }): Promise<{ text: string; usage: { promptTokens: 0; completionTokens: 0; totalTokens: 0 } }> {
    const text =
      "[DEMO] Это демонстрационный ответ. Подключите OpenAI API-ключ в Настройках для работы в реальном режиме.";

    for (const char of text) {
      params.onChunk({ delta: char, done: false });
      await delay(10);
    }
    params.onChunk({ delta: "", done: true });

    return { text, usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } };
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDemoResponse(schema: z.ZodType<any>, prompt: string): unknown {
  // Try to parse the schema shape and return sensible defaults
  try {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: Record<string, any> = {};

      for (const [key, fieldSchema] of Object.entries(shape)) {
        result[key] = getDemoValue(key, fieldSchema as z.ZodType, prompt);
      }
      return result;
    }
  } catch {
    // fallback
  }

  return {
    demo: true,
    message:
      "[DEMO] Подключите API-ключ в Настройках для реального результата.",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDemoValue(key: string, schema: z.ZodType, _prompt: string): any {
  if (schema instanceof z.ZodString) return `[DEMO] ${key}`;
  if (schema instanceof z.ZodNumber) return 0;
  if (schema instanceof z.ZodBoolean) return false;
  if (schema instanceof z.ZodArray) return [];
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable)
    return null;
  if (schema instanceof z.ZodObject) return buildDemoResponse(schema, _prompt);
  if (schema instanceof z.ZodEnum) return schema.options[0];
  if (schema instanceof z.ZodLiteral) return schema.value;
  return null;
}

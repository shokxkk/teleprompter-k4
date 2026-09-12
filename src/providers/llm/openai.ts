import OpenAI from "openai";
import { z } from "zod";
import type { LLMProvider, LLMResult, LLMUsage, StreamChunk } from "./types";

export class OpenAIAdapter implements LLMProvider {
  name = "openai";
  isDemo = false;
  private client: OpenAI;
  model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateStructured<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: z.ZodType<T>;
    maxRetries?: number;
  }): Promise<LLMResult<T>> {
    const maxRetries = params.maxRetries ?? 1;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("Empty response from OpenAI");

        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          throw new Error(`Invalid JSON from OpenAI: ${content.slice(0, 200)}`);
        }

        const validated = params.schema.safeParse(parsed);
        if (!validated.success) {
          if (attempt < maxRetries) {
            lastError = new Error(
              `Schema validation failed: ${validated.error.message}`
            );
            continue;
          }
          throw new Error(
            `Schema validation failed after ${maxRetries + 1} attempts: ${validated.error.message}`
          );
        }

        const usage: LLMUsage = {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        };

        return {
          data: validated.data,
          usage,
          providerRequestId: response.id,
          source: "live",
        };
      } catch (err) {
        lastError = err as Error;
        if (attempt < maxRetries) continue;
      }
    }

    throw lastError ?? new Error("Unknown error in generateStructured");
  }

  async streamText(params: {
    systemPrompt: string;
    userPrompt: string;
    onChunk: (chunk: StreamChunk) => void;
  }): Promise<{ text: string; usage: LLMUsage }> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      stream: true,
      stream_options: { include_usage: true },
    });

    let text = "";
    let usage: LLMUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        text += delta;
        params.onChunk({ delta, done: false });
      }
      if (chunk.usage) {
        usage = {
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
          totalTokens: chunk.usage.total_tokens,
        };
      }
    }

    params.onChunk({ delta: "", done: true });
    return { text, usage };
  }
}

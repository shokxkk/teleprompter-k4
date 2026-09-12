// src/providers/llm/types.ts
export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMResult<T> {
  data: T;
  usage: LLMUsage;
  providerRequestId?: string;
  source: "live" | "demo";
}

export interface StreamChunk {
  delta: string;
  done: boolean;
}

export interface LLMProvider {
  name: string;
  model: string;
  isDemo: boolean;

  generateStructured<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: import("zod").ZodType<T>;
    maxRetries?: number;
  }): Promise<LLMResult<T>>;

  streamText(params: {
    systemPrompt: string;
    userPrompt: string;
    onChunk: (chunk: StreamChunk) => void;
  }): Promise<{ text: string; usage: LLMUsage }>;
}

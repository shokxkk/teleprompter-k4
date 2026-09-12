import { OpenAIAdapter } from "./openai";
import { MockProvider } from "./mock";
import type { LLMProvider } from "./types";

export function getLLMProvider(options?: {
  forceDemo?: boolean;
  model?: string;
}): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  const forceDemo =
    options?.forceDemo ?? process.env.FORCE_DEMO_MODE === "true";

  if (!apiKey || forceDemo) {
    return new MockProvider();
  }

  const model =
    options?.model ??
    process.env.OPENAI_DEFAULT_MODEL ??
    "gpt-4o-mini";

  return new OpenAIAdapter(apiKey, model);
}

export function getScriptwriterProvider(): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || process.env.FORCE_DEMO_MODE === "true") {
    return new MockProvider();
  }
  const model = process.env.OPENAI_SCRIPTWRITER_MODEL ?? "gpt-4o";
  return new OpenAIAdapter(apiKey, model);
}

export { type LLMProvider } from "./types";

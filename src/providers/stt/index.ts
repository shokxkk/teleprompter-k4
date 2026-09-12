import OpenAI, { toFile } from "openai";
import { AishaSTTProvider } from "./aisha";
import type { STTProvider, STTResult } from "./types";

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIMES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/flac",
  "audio/m4a",
  "video/mp4",
  "video/webm",
];

export class WhisperAdapter implements STTProvider {
  name = "openai-whisper";
  isDemo = false;
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "whisper-1") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async transcribe(params: {
    audioBuffer: Buffer;
    mimeType: string;
    languageHint?: string;
    filename?: string;
  }): Promise<STTResult> {
    if (!ALLOWED_MIMES.includes(params.mimeType)) {
      throw new Error(
        `Unsupported audio format: ${params.mimeType}. Supported: ${ALLOWED_MIMES.join(", ")}`
      );
    }

    if (params.audioBuffer.byteLength > MAX_SIZE_BYTES) {
      throw new Error(
        `Audio file too large: ${Math.round(params.audioBuffer.byteLength / 1024 / 1024)} MB. Max: 25 MB`
      );
    }

    const ext = params.mimeType.split("/")[1] ?? "webm";
    const filename = params.filename ?? `audio.${ext}`;

    const file = await toFile(params.audioBuffer, filename, {
      type: params.mimeType,
    });

    const transcription = await this.client.audio.transcriptions.create({
      file,
      model: this.model,
      language: params.languageHint ?? "uz",
      response_format: "verbose_json",
    });

    return {
      text: transcription.text,
      language: transcription.language,
      duration: (transcription as { duration?: number }).duration,
      source: "live",
    };
  }
}

export class MockSTTProvider implements STTProvider {
  name = "mock-stt";
  isDemo = true;

  async transcribe(): Promise<STTResult> {
    await new Promise((r) => setTimeout(r, 800));
    return {
      text: "[DEMO] Голосовая расшифровка недоступна. Настройте API-ключ в Настройках.",
      source: "demo",
    };
  }
}

export function getSTTProvider(): STTProvider {
  if (process.env.FORCE_DEMO_MODE === "true") {
    return new MockSTTProvider();
  }
  const aishaKey = process.env.AISHA_API_KEY;
  if (aishaKey) {
    return new AishaSTTProvider(aishaKey, process.env.AISHA_BASE_URL);
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const model = process.env.OPENAI_STT_MODEL ?? "whisper-1";
    return new WhisperAdapter(apiKey, model);
  }
  return new MockSTTProvider();
}

export { AishaSTTProvider };
export type { STTProvider, STTResult };

import type { STTProvider, STTResult } from "./types";

export class AishaSTTProvider implements STTProvider {
  name = "aisha-stt";
  isDemo = false;
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = "https://back.aisha.group") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async transcribe(params: {
    audioBuffer: Buffer;
    mimeType: string;
    languageHint?: string;
    filename?: string;
  }): Promise<STTResult> {
    const ext = params.mimeType.split("/")[1] ?? "wav";
    const filename = params.filename ?? `audio.${ext}`;

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(params.audioBuffer)], { type: params.mimeType });
    formData.append("audio", blob, filename);
    formData.append("language", params.languageHint ?? "uz");
    formData.append("has_diarization", "false");

    const res = await fetch(`${this.baseUrl}/api/v1/stt/post/`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apiKey,
        "Accept-Language": params.languageHint ?? "uz",
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Aisha STT Error (${res.status}): ${errText}`);
    }

    const data = await res.json();

    return {
      text: data.transcript ?? "",
      language: params.languageHint ?? "uz",
      duration: data.duration ?? undefined,
      source: "live",
    };
  }
}

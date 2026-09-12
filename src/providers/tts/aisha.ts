export interface AishaTTSParams {
  transcript: string;
  language?: "uz" | "en" | "ru";
  model?: "Gulnoza";
  mood?: "Neutral" | "Cheerful" | "Happy" | "Sad";
  speed?: number;
}

export interface AishaTTSResult {
  audioUrl: string;
}

export class AishaTTSProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl = "https://back.aisha.group") {
    this.apiKey = apiKey ?? process.env.AISHA_API_KEY ?? "";
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async generateSpeech(params: AishaTTSParams): Promise<AishaTTSResult> {
    if (!this.apiKey) {
      throw new Error("Aisha API Key is missing");
    }

    const formData = new FormData();
    formData.append("transcript", params.transcript);
    formData.append("language", params.language ?? "uz");

    if ((params.language ?? "uz") === "uz") {
      formData.append("model", params.model ?? "Gulnoza");
      if (params.mood) {
        formData.append("mood", params.mood);
      }
      if (params.speed !== undefined) {
        formData.append("speed", String(params.speed));
      }
    }

    const res = await fetch(`${this.baseUrl}/api/v1/tts/post/`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apiKey,
        "Accept-Language": params.language ?? "uz",
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Aisha TTS Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const audioPath: string = data.audio_path ?? "";

    const fullAudioUrl = audioPath.startsWith("http")
      ? audioPath
      : `${this.baseUrl}${audioPath.startsWith("/") ? "" : "/"}${audioPath}`;

    return { audioUrl: fullAudioUrl };
  }
}

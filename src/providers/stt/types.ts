// STT Provider interface and implementations
export interface STTResult {
  text: string;
  language?: string;
  duration?: number;
  source: "live" | "demo";
}

export interface STTProvider {
  name: string;
  isDemo: boolean;
  transcribe(params: {
    audioBuffer: Buffer;
    mimeType: string;
    languageHint?: string;
    filename?: string;
  }): Promise<STTResult>;
}

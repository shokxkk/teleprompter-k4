import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { AishaTTSProvider } from "@/providers/tts/aisha";
import { z } from "zod";

const ttsSchema = z.object({
  transcript: z.string().min(1).max(1000),
  language: z.enum(["uz", "en", "ru"]).optional().default("uz"),
  model: z.enum(["Gulnoza"]).optional().default("Gulnoza"),
  mood: z.enum(["Neutral", "Cheerful", "Happy", "Sad"]).optional(),
  speed: z.number().min(0.5).max(2.0).optional().default(1.0),
});

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();

    const parsed = ttsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const tts = new AishaTTSProvider();
    const result = await tts.generateSpeech(parsed.data);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/tts error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "TTS Generation Failed" }, { status: 500 });
  }
}

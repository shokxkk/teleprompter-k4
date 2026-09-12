import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { z } from "zod";

export async function GET() {
  try {
    const { workspace } = await requireAuth();
    return NextResponse.json({ settings: workspace.settings, workspace });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const updateSettingsSchema = z.object({
  publicationsPerWeek: z.number().int().optional(),
  reelsPerWeek: z.number().int().optional(),
  carouselsPerWeek: z.number().int().optional(),
  llmProvider: z.string().optional(),
  llmModel: z.string().optional(),
  demoMode: z.boolean().optional(),
  dailyTokenLimit: z.number().int().optional(),
});

export async function PATCH(req: Request) {
  try {
    const { workspace } = await requireAuth();
    const body = await req.json();

    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const settings = await prisma.workspaceSettings.upsert({
      where: { workspaceId: workspace.id },
      create: {
        workspaceId: workspace.id,
        ...parsed.data,
      },
      update: parsed.data,
    });

    return NextResponse.json({ settings });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

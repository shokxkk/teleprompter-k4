import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { z } from "zod";

export async function GET() {
  try {
    const { workspace } = await requireAuth();

    const sources = await prisma.source.findMany({
      where: { workspaceId: workspace.id },
      include: { facts: true },
      orderBy: { createdAt: "desc" },
    });

    const facts = await prisma.fact.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ sources, facts });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const createSourceSchema = z.object({
  title: z.string().optional(),
  type: z.enum(["note", "audio", "transcript", "file", "url"]).default("note"),
  content: z.string().optional(),
  knowledgeType: z.string().default("user_reported_fact"),
  publicationPermission: z.enum(["pending", "internal_only", "anonymous_allowed", "public_allowed"]).default("pending"),
  tags: z.array(z.string()).optional(),
  claims: z.array(z.object({
    claim: z.string(),
    unit: z.string().optional(),
    numericValue: z.number().optional(),
    isCase: z.boolean().optional(),
  })).optional(),
});

export async function POST(req: Request) {
  try {
    const { workspace, userId } = await requireAuth();
    const body = await req.json();

    const parsed = createSourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { claims, tags, ...sourceData } = parsed.data;

    const source = await prisma.source.create({
      data: {
        workspaceId: workspace.id,
        ...sourceData,
        tags: tags ?? [],
        confirmedBy: userId,
        confirmedAt: new Date(),
      },
    });

    if (claims && claims.length > 0) {
      for (const claimObj of claims) {
        await prisma.fact.create({
          data: {
            workspaceId: workspace.id,
            sourceId: source.id,
            claim: claimObj.claim,
            unit: claimObj.unit,
            numericValue: claimObj.numericValue,
            isCase: claimObj.isCase ?? false,
            publicationPermission: source.publicationPermission,
          },
        });
      }
    }

    const updatedSource = await prisma.source.findUnique({
      where: { id: source.id },
      include: { facts: true },
    });

    return NextResponse.json({ source: updatedSource }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

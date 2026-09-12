import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { z } from "zod";

export async function GET() {
  try {
    const { workspace } = await requireAuth();

    const snapshots = await prisma.metricSnapshot.findMany({
      where: { workspaceId: workspace.id },
      include: { contentItem: true },
      orderBy: { measuredAt: "desc" },
    });

    const inquiries = await prisma.inquiry.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    });

    const weeklyReports = await prisma.weeklyReport.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ snapshots, inquiries, weeklyReports });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const metricSchema = z.object({
  contentItemId: z.string().optional(),
  scope: z.enum(["post", "account"]).default("post"),
  measuredAt: z.string().transform((str) => new Date(str)),
  windowDays: z.number().int().optional(),
  views: z.number().int().nullable().optional(),
  reach: z.number().int().nullable().optional(),
  avgWatchSeconds: z.number().nullable().optional(),
  saves: z.number().int().nullable().optional(),
  shares: z.number().int().nullable().optional(),
  comments: z.number().int().nullable().optional(),
  profileVisits: z.number().int().nullable().optional(),
  follows: z.number().int().nullable().optional(),
  likes: z.number().int().nullable().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { workspace } = await requireAuth();
    const body = await req.json();

    if (body.type === "inquiry") {
      const inquiry = await prisma.inquiry.create({
        data: {
          workspaceId: workspace.id,
          contactType: body.contactType,
          businessNiche: body.businessNiche,
          teamSize: body.teamSize ? Number(body.teamSize) : null,
          task: body.task,
          interestedService: body.interestedService,
          source: body.source,
          sourceAttribution: body.sourceAttribution ?? "unknown",
          status: body.status ?? "new",
          dealAmount: body.dealAmount ? Number(body.dealAmount) : null,
          notes: body.notes,
        },
      });
      return NextResponse.json({ inquiry }, { status: 201 });
    }

    const parsed = metricSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const snapshot = await prisma.metricSnapshot.create({
      data: {
        workspaceId: workspace.id,
        ...parsed.data,
      },
    });

    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

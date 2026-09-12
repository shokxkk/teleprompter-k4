import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { z } from "zod";

const contentQuerySchema = z.object({
  format: z.enum(["reel", "carousel", "story", "pinned"]).optional(),
  editorialStatus: z.string().optional(),
  productionStatus: z.string().optional(),
  audience: z.string().optional(),
  goal: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: Request) {
  try {
    const { workspace } = await requireAuth();
    const url = new URL(req.url);

    const query = contentQuerySchema.safeParse(
      Object.fromEntries(url.searchParams)
    );

    if (!query.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    const { format, editorialStatus, productionStatus, limit, offset } =
      query.data;

    const items = await prisma.contentItem.findMany({
      where: {
        workspaceId: workspace.id,
        ...(format ? { type: format } : {}),
        ...(editorialStatus ? { editorialStatus } : {}),
        ...(productionStatus ? { productionStatus } : {}),
      },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          select: {
            id: true,
            versionNumber: true,
            createdAt: true,
            changeNote: true,
            payload: true,
          },
        },
        publications: {
          orderBy: { publishedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.contentItem.count({
      where: {
        workspaceId: workspace.id,
        ...(format ? { type: format } : {}),
        ...(editorialStatus ? { editorialStatus } : {}),
        ...(productionStatus ? { productionStatus } : {}),
      },
    });

    return NextResponse.json({ items, total, limit, offset });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { workspace } = await requireAuth();
    const body = await req.json();

    const { type, title } = body as { type: string; title?: string };

    if (!type || !["reel", "carousel", "story", "pinned"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const item = await prisma.contentItem.create({
      data: {
        workspaceId: workspace.id,
        type,
        editorialStatus: "idea",
        productionStatus: "not_started",
        title: title ?? `Новый ${type}`,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

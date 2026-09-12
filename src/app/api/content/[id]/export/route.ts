import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { ReelDraftSchema } from "@/ai/schemas";
import type { ReelDraft } from "@/ai/schemas";

// GET /api/content/[id]/export?versionId=...&format=md|txt|json
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace } = await requireAuth();
    const { id } = await params;
    const url = new URL(req.url);
    const versionId = url.searchParams.get("versionId");
    const format = url.searchParams.get("format") ?? "md";

    const item = await prisma.contentItem.findFirst({
      where: { id, workspaceId: workspace.id },
      include: {
        versions: {
          ...(versionId
            ? { where: { id: versionId } }
            : { orderBy: { versionNumber: "desc" }, take: 1 }),
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const version = item.versions[0];
    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    if (format === "json") {
      const headers = new Headers();
      headers.set(
        "Content-Disposition",
        `attachment; filename="${item.title ?? "content"}-v${version.versionNumber}.json"`
      );
      headers.set("Content-Type", "application/json; charset=utf-8");

      return new Response(JSON.stringify(version.payload, null, 2), { headers });
    }

    // Build markdown/text export
    const payload = version.payload as unknown;

    if (item.type === "reel") {
      const parsed = ReelDraftSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid reel draft data" },
          { status: 500 }
        );
      }
      const draft = parsed.data;
      const selectedHook = draft.hooks.find((h) => h.key === draft.selectedHookKey);
      const selectedCta = draft.ctas.find((c) => c.key === draft.selectedCtaKey);

      const md = buildReelMarkdown(draft, selectedHook, selectedCta);

      const headers = new Headers();
      const ext = format === "txt" ? "txt" : "md";
      headers.set(
        "Content-Disposition",
        `attachment; filename="${item.title ?? "reel"}-v${version.versionNumber}.${ext}"`
      );
      headers.set("Content-Type", "text/plain; charset=utf-8");

      return new Response(md, { headers });
    }

    // Generic fallback
    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=utf-8");
    return new Response(JSON.stringify(version.payload, null, 2), { headers });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function buildReelMarkdown(
  draft: ReelDraft,
  selectedHook: ReelDraft["hooks"][0] | undefined,
  selectedCta: ReelDraft["ctas"][0] | undefined
): string {
  const lines: string[] = [];

  lines.push(`# ${draft.title}`);
  lines.push("");
  lines.push(`**Auditoriya:** ${draft.audience} | **Maqsad:** ${draft.goal}`);
  lines.push(`**Muammo:** ${draft.problem}`);
  lines.push(`**Asosiy fikr:** ${draft.mainIdea}`);
  lines.push(`**Maqsadli davomiylik:** ${draft.targetDurationSeconds} sek`);
  lines.push("");

  lines.push("## HOOK variantlari");
  for (const h of draft.hooks) {
    const marker = h.key === draft.selectedHookKey ? "✅" : "  ";
    lines.push(`${marker} **${h.key.toUpperCase()}**: ${h.text}`);
    lines.push(`   _Mexanizm: ${h.mechanism}. ${h.rationale}_`);
  }
  lines.push("");

  lines.push("## Matn (telesuflyor uchun)");
  lines.push("");
  lines.push(`> **HOOK:** ${selectedHook?.text ?? ""}`);
  lines.push("");
  for (const seg of draft.segments) {
    if (seg.role === "example" && seg.exampleType === "teaching") {
      lines.push(`> _(Shartli misol)_ ${seg.spokenText}`);
    } else {
      lines.push(`> ${seg.spokenText}`);
    }
    if (seg.onScreenText) {
      lines.push(`> 📺 **Ekranda:** ${seg.onScreenText}`);
    }
  }
  if (selectedCta && selectedCta.type !== "none") {
    lines.push(`> **CTA:** ${selectedCta.text}`);
  }
  lines.push("");

  lines.push("## CTA variantlari");
  for (const c of draft.ctas) {
    const marker = c.key === draft.selectedCtaKey ? "✅" : "  ";
    lines.push(`${marker} **${c.key.toUpperCase()}**: ${c.text}`);
  }
  lines.push("");

  lines.push("## Muqovalar");
  draft.covers.forEach((cover, i) => {
    const marker = i === draft.selectedCoverIndex ? "✅" : "  ";
    lines.push(`${marker} ${cover}`);
  });
  lines.push("");

  lines.push("## Tavsif (caption)");
  lines.push("");
  lines.push(draft.caption);
  lines.push("");

  lines.push("## Suratga olish eslatmalari");
  for (const note of draft.shootingNotes) {
    lines.push(`- ${note}`);
  }
  lines.push("");

  if (draft.missingInformation.length > 0) {
    lines.push("## ⚠️ Yetishmayotgan ma'lumotlar");
    for (const m of draft.missingInformation) {
      lines.push(`- ${m}`);
    }
  }

  return lines.join("\n");
}

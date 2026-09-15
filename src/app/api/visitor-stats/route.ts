import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

// Strict REAL visitor logging without fake seeds or demo offsets
interface RealVisit {
  visitorId: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  timestamp: number;
}

const realVisits: RealVisit[] = [];

export async function GET() {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const monthStr = now.toISOString().slice(0, 7); // YYYY-MM
    const fiveMinsAgo = Date.now() - 5 * 60 * 1000;

    let todayCount = 0;
    let monthCount = 0;
    let totalCount = 0;

    try {
      const todayDb = await prisma.auditEvent.count({
        where: {
          action: "VISIT",
          createdAt: { gte: new Date(`${todayStr}T00:00:00Z`) },
        },
      });

      const monthDb = await prisma.auditEvent.count({
        where: {
          action: "VISIT",
          createdAt: { gte: new Date(`${monthStr}-01T00:00:00Z`) },
        },
      });

      const totalDb = await prisma.auditEvent.count({
        where: { action: "VISIT" },
      });

      todayCount = Math.max(todayDb, realVisits.filter((v) => v.date === todayStr).length);
      monthCount = Math.max(monthDb, realVisits.filter((v) => v.month === monthStr).length);
      totalCount = Math.max(totalDb, realVisits.length);
    } catch {
      todayCount = realVisits.filter((v) => v.date === todayStr).length;
      monthCount = realVisits.filter((v) => v.month === monthStr).length;
      totalCount = realVisits.length;
    }

    const onlineNow = realVisits.filter((v) => v.timestamp >= fiveMinsAgo).length;

    // 7-Day real traffic history
    const history: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split("T")[0];
      const displayDate = `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const count = realVisits.filter((v) => v.date === dateStr).length;
      history.push({ date: displayDate, count });
    }

    return NextResponse.json({
      today: todayCount,
      thisMonth: monthCount,
      total: totalCount,
      onlineNow,
      history,
    });
  } catch (e) {
    return NextResponse.json({
      today: 0,
      thisMonth: 0,
      total: 0,
      onlineNow: 0,
      history: [],
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const visitorId = body.visitorId || `anon-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const monthStr = now.toISOString().slice(0, 7);
    const userAgent = req.headers.get("user-agent") || undefined;

    // Record real visit if not logged in last 10 minutes from same session
    const existingRecent = realVisits.find(
      (v) => v.visitorId === visitorId && Date.now() - v.timestamp < 10 * 60 * 1000
    );

    if (!existingRecent) {
      realVisits.push({
        visitorId,
        date: todayStr,
        month: monthStr,
        timestamp: Date.now(),
      });
    }

    // Record in DB asynchronously if available
    try {
      await prisma.auditEvent.create({
        data: {
          action: "VISIT",
          entityType: "page_view",
          entityId: body.page || "/shooting",
          after: { visitorId, userAgent },
        },
      });
    } catch {
      // Ignore DB errors safely
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: true });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        passwordHash,
      },
    });

    // Create workspace for new user
    await prisma.workspace.create({
      data: {
        ownerId: user.id,
        name: `${name}'s Brand Office`,
        timezone: "Asia/Tashkent",
        uiLang: "ru",
        settings: {
          create: {
            publicationsPerWeek: 7,
            reelsPerWeek: 4,
            carouselsPerWeek: 3,
            storiesPerWeek: 3,
            storiesFramesPerDay: 2,
            maxSalesPostsPerWeek: 2,
            llmProvider: "openai",
            llmModel: "gpt-4o-mini",
            sttProvider: "openai",
            demoMode: !process.env.OPENAI_API_KEY,
            dailyTokenLimit: 100000,
            maxParallelGenerations: 2,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, userId: user.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Ошибка сервера. Попробуйте позже." },
      { status: 500 }
    );
  }
}

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ─── Шохжахон Каримов (idempotent) ──────────────────────────
  const email = "shoxjaxon@brandoffice.app";

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: "Shoxjaxon Karimov",
        passwordHash: await bcrypt.hash("changeMe2026!", 12),
      },
    });
    console.log("✅ Created user:", email);
  } else {
    console.log("ℹ️  User already exists:", email);
  }

  // ─── Workspace ───────────────────────────────────────────────
  let workspace = await prisma.workspace.findUnique({
    where: { ownerId: user.id },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        ownerId: user.id,
        name: "Brand Office — Shoxjaxon Karimov",
        timezone: "Asia/Tashkent",
        uiLang: "ru",
      },
    });
    console.log("✅ Created workspace:", workspace.id);
  } else {
    console.log("ℹ️  Workspace already exists:", workspace.id);
  }

  // ─── Workspace Settings ──────────────────────────────────────
  const existingSettings = await prisma.workspaceSettings.findUnique({
    where: { workspaceId: workspace.id },
  });

  if (!existingSettings) {
    await prisma.workspaceSettings.create({
      data: {
        workspaceId: workspace.id,
        publicationsPerWeek: 7,
        reelsPerWeek: 4,
        carouselsPerWeek: 3,
        storiesPerWeek: 3,
        storiesFramesPerDay: 2,
        maxSalesPostsPerWeek: 2,
        llmProvider: "openai",
        llmModel: "gpt-4o-mini",
        sttProvider: "openai",
        demoMode: false,
        dailyTokenLimit: 100000,
        maxParallelGenerations: 2,
      },
    });
    console.log("✅ Created workspace settings");
  }

  // ─── Brand Profile + Initial Version ────────────────────────
  let brandProfile = await prisma.brandProfile.findFirst({
    where: { workspaceId: workspace.id },
  });

  if (!brandProfile) {
    brandProfile = await prisma.brandProfile.create({
      data: {
        workspaceId: workspace.id,
        isCurrent: true,
      },
    });

    await prisma.brandVersion.create({
      data: {
        brandProfileId: brandProfile.id,
        versionNumber: 1,
        status: "active",
        publicName: "Шохжахон Каримов",
        publicNameUz: "Shoxjaxon Karimov",
        role: "Руководитель отдела продаж",
        geography: "Узбекистан",
        startYear: 2020,
        primaryAudience:
          "Собственники развивающихся компаний Узбекистана с многочисленной командой продаж",
        secondaryAudience: "Менеджеры и руководители, которым нужно обучение",
        audienceProblems: [
          "Хаос в отделе продаж",
          "Слабое общение с клиентами",
          "Отсутствие правил и ответственности",
          "Текучесть кадров из-за неорганизованности",
          "Недостаток обучения",
        ],
        goals3to6months:
          "Стать узнаваемым среди собственников Узбекистана, получать обращения на услуги, изучать спрос на будущее обучение",
        followerTarget: 25000,
        contentLang: "uz-Latn",
        interfaceLang: "ru",
        limitations: [
          "Не использовать пустую мотивацию",
          "Не демонстрировать роскошь",
          "Не гарантировать рост подписчиков или выручки",
          "Не критиковать других специалистов",
          "Не выдумывать кейсы и цифры",
        ],
        notes:
          "История: в 2020 году во время пандемии увидел вакансию менеджера по продажам. Работа оказалась прямыми продажами. С этого начался путь до руководителя.",
      },
    });
    console.log("✅ Created brand profile & version");
  } else {
    console.log("ℹ️  Brand profile already exists");
  }

  // ─── Services ────────────────────────────────────────────────
  const servicesExist = await prisma.service.count({
    where: { workspaceId: workspace.id },
  });

  if (servicesExist === 0) {
    await prisma.service.createMany({
      data: [
        {
          workspaceId: workspace.id,
          name: "Построение отдела продаж под ключ",
          clientProblem:
            "Нет системного отдела продаж — хаос, нет процессов и ответственности",
          confirmedContent:
            "Аудит, разработка структуры, найм, адаптация, скрипты, KPI, отчётность, CRM",
          pendingQuestions: [
            "Типичный срок реализации",
            "Минимальный размер команды клиента",
          ],
          isActive: true,
        },
        {
          workspaceId: workspace.id,
          name: "Аудит и систематизация отдела продаж",
          clientProblem:
            "Отдел существует, но работает неэффективно — непонятно где потери",
          confirmedContent:
            "Анализ процессов, звонков, скриптов, KPI и мотивации. Рекомендации и план изменений",
          pendingQuestions: ["Формат отчёта", "Онлайн или очный"],
          isActive: true,
        },
        {
          workspaceId: workspace.id,
          name: "Подбор и обучение менеджеров",
          clientProblem:
            "Сложно найти и удержать хороших менеджеров, обучение не системное",
          confirmedContent:
            "Разработка профиля должности, воронка найма, адаптация, обучающие материалы",
          pendingQuestions: ["Количество менеджеров", "Ниша компании"],
          isActive: true,
        },
      ],
    });
    console.log("✅ Created services");
  }

  // ─── Initial Interview Questions ─────────────────────────────
  const questionsExist = await prisma.interviewQuestion.count({
    where: { workspaceId: workspace.id },
  });

  if (questionsExist === 0) {
    await prisma.interviewQuestion.createMany({
      data: [
        {
          workspaceId: workspace.id,
          questionText:
            "Расскажите о последнем клиентском случае, который хотелось бы использовать в контенте — что произошло и какова была ваша роль?",
          purpose:
            "Собрать реальный пример для контента с разрешением пользователя",
          knowledgeField: "case",
          status: "pending",
          orderIndex: 1,
        },
        {
          workspaceId: workspace.id,
          questionText:
            "Какую главную проблему клиентов вы решаете чаще всего — одним предложением?",
          purpose: "Позиционирование и основная мысль для контента",
          knowledgeField: "positioning",
          status: "pending",
          orderIndex: 2,
        },
        {
          workspaceId: workspace.id,
          questionText:
            "Есть ли у вас фраза или принцип, который вы повторяете в работе — что-то вроде вашего профессионального правила?",
          purpose: "Голос бренда, цитаты для обложек и Stories",
          knowledgeField: "voice",
          status: "pending",
          orderIndex: 3,
        },
      ],
    });
    console.log("✅ Created initial interview questions");
  }

  // ─── Demo Reels Content (for DEMO mode) ─────────────────────
  const demoExists = await prisma.contentItem.findFirst({
    where: { workspaceId: workspace.id },
  });

  if (!demoExists) {
    const demoReel = await prisma.contentItem.create({
      data: {
        workspaceId: workspace.id,
        type: "reel",
        editorialStatus: "approved",
        productionStatus: "ready_to_shoot",
        title: "[DEMO] Keyingi aloqa narx yuborgandan keyin",
      },
    });

    await prisma.contentVersion.create({
      data: {
        contentItemId: demoReel.id,
        versionNumber: 1,
        createdBy: "seed",
        changeNote: "Demo content from TZ §7",
        payload: {
          schemaVersion: 1,
          title: "Keyingi aloqa narx yuborgandan keyin",
          language: "uz-Latn",
          audience: "owner",
          goal: "trust",
          problem:
            "Menejer narxni yuboradi, lekin keyingi qadam belgilanmaydi — mijoz yo'qoladi",
          mainIdea:
            "Taklif yuborgandan keyin navbatdagi suhbat vaqtini kelishib qo'ying",
          targetDurationSeconds: 52,
          hooks: [
            {
              key: "h1",
              text: "Menejeringiz narxni yubordi. Keyingi suhbat qachon bo'lishini ham kelishdimi?",
              mechanism: "diagnostic_question",
              rationale:
                "Собственнику предлагается проверить конкретное действие, не обвиняя команду",
            },
            {
              key: "h2",
              text: "Mijoz \"o'ylab ko'raman\" desa, menejeringiz nima qiladi?",
              mechanism: "recognizable_situation",
              rationale:
                "Узнаваемая ситуация — собственник видит это регулярно",
            },
            {
              key: "h3",
              text: "Taklif yuborilgan. Lekin keyingi qadam belgilanmagan. Sizda ham shunday holat bormi?",
              mechanism: "process_error",
              rationale: "Описание типичной ошибки процесса",
            },
          ],
          selectedHookKey: "h1",
          segments: [
            {
              key: "s1",
              role: "context",
              spokenText:
                "Keling, shartli bir vaziyatni olaylik. Menejer mijozga taklif yubordi. Mijoz: \"Ko'rib chiqaman\", dedi. Suhbat shu yerda tugadi.",
              onScreenText: null,
              visualDirection: "Разговор в камеру",
              factIds: [],
              exampleType: "teaching",
            },
            {
              key: "s2",
              role: "explanation",
              spokenText:
                "Endi menejer mijozdan javob kutyapti. Mijoz esa qachon yana gaplashishni bilmaydi.",
              onScreenText: null,
              visualDirection: null,
              factIds: [],
            },
            {
              key: "s3",
              role: "example",
              spokenText:
                "Shu vaziyatda keyingi aloqani kelishib olish mumkin: \"Taklifni ko'rib chiqishingiz uchun qancha vaqt kerak? Ertaga soat uchda bog'lansam, sizga qulaymi?\"",
              onScreenText: "Shartli misol",
              visualDirection: "Экранная пометка «Shartli misol»",
              factIds: [],
              exampleType: "teaching",
            },
            {
              key: "s4",
              role: "takeaway",
              spokenText:
                "Vaqtni mijoz bilan kelishing. Keyin CRM'da vazifa qo'ying: kim bog'lanadi, qachon va nima masalada. Bugun beshta faol kelishuvni ochib ko'ring. Har birida keyingi qadam belgilanganmi?",
              onScreenText: "Kim? Qachon? Nima masalada?",
              visualDirection:
                "Вывести на экран «Kim? Qachon? Nima masalada?». Демо CRM только с вымышленными данными.",
              factIds: [],
            },
          ],
          ctas: [
            {
              key: "c1",
              type: "save",
              text: "Shu tekshiruvni jamoangiz bilan o'tkazish uchun videoni saqlab qo'ying.",
              rationale: "Практический инструмент — сохранить и применить",
            },
            {
              key: "c2",
              type: "comment",
              text: "Sizda keyingi qo'ng'iroq vaqti mijoz bilan kelishiladimi? Izohda yozing.",
              rationale: "Вопрос собственнику — ответить по существу в комментариях",
            },
          ],
          selectedCtaKey: "c1",
          covers: ["Narx yuborildi. Keyin-chi?", "Keyingi qadam aniqmi?"],
          selectedCoverIndex: 0,
          caption:
            "Taklif yuborilgandan keyin navbatdagi qadamni ham kelishib oling: qachon bog'lanasiz va nimani muhokama qilasiz?\n\nBugun beshta faol kelishuvni tekshiring. Mas'ul menejer, aloqa vaqti va maqsadi ko'rsatilganmi?\n\nVideodagi vaziyat — shartli misol.",
          shootingNotes: [
            "Разговор прямо в камеру",
            "При начале примера показать экранную пометку «Shartli misol»",
            "При перечислении вывести «Kim? Qachon? Nima masalada?»",
            "Демонстрационная карточка CRM только с вымышленными данными",
            "Никаких выдуманных процентов роста",
          ],
          sourceIds: [],
          missingInformation: [],
        },
      },
    });
    console.log("✅ Created demo Reels content");
  }

  console.log("🌿 Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { z } from "zod";

// ================================================================
// REEL DRAFT — main content output schema (§17)
// ================================================================

export const HookSchema = z.object({
  key: z.enum(["h1", "h2", "h3"]),
  text: z.string().min(1),
  mechanism: z.enum([
    "recognizable_situation",
    "diagnostic_question",
    "process_error",
    "unexpected_conclusion",
  ]),
  rationale: z.string().min(1),
});

export const SegmentSchema = z.object({
  key: z.string().min(1),
  role: z.enum(["context", "explanation", "example", "takeaway"]),
  spokenText: z.string().min(1),
  onScreenText: z.string().nullable().optional(),
  visualDirection: z.string().nullable().optional(),
  factIds: z.array(z.string()).default([]),
  exampleType: z.enum(["real", "teaching"]).optional(),
});

export const CTASchema = z.object({
  key: z.enum(["c1", "c2"]),
  type: z.enum(["save", "comment", "profile", "direct", "none"]),
  text: z.string(),
  rationale: z.string().min(1),
  promisedAssetId: z.string().optional(),
});

export const ReelDraftSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string().min(1),
  language: z.enum(["uz-Latn", "ru"]),
  audience: z.enum(["owner", "sales_leader", "sales_manager"]),
  goal: z.enum([
    "awareness",
    "trust",
    "save",
    "discussion",
    "inquiry",
    "learning_research",
  ]),
  problem: z.string().min(1),
  mainIdea: z.string().min(1),
  targetDurationSeconds: z.number().int().positive(),
  hooks: z
    .array(HookSchema)
    .length(3)
    .refine(
      (hooks) => new Set(hooks.map((h) => h.key)).size === 3,
      "All hook keys must be unique"
    ),
  selectedHookKey: z.enum(["h1", "h2", "h3"]),
  segments: z.array(SegmentSchema).min(1),
  ctas: z
    .array(CTASchema)
    .length(2)
    .refine(
      (ctas) => new Set(ctas.map((c) => c.key)).size === 2,
      "CTA keys must be unique"
    ),
  selectedCtaKey: z.enum(["c1", "c2"]),
  covers: z.tuple([z.string(), z.string()]),
  selectedCoverIndex: z.union([z.literal(0), z.literal(1)]),
  caption: z.string().min(1),
  shootingNotes: z.array(z.string()),
  sourceIds: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
});

export type ReelDraft = z.infer<typeof ReelDraftSchema>;

// ================================================================
// CAROUSEL DRAFT
// ================================================================

export const CarouselSlideSchema = z.object({
  index: z.number().int().min(1),
  role: z.enum(["cover", "problem", "explanation", "example", "steps", "cta"]),
  title: z.string().min(1),
  bodyText: z.string().min(1),
  visualHint: z.string().optional(),
  onScreenElements: z.array(z.string()).default([]),
});

export const CarouselDraftSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string().min(1),
  language: z.enum(["uz-Latn", "ru"]),
  audience: z.enum(["owner", "sales_leader", "sales_manager"]),
  goal: z.enum([
    "awareness",
    "trust",
    "save",
    "discussion",
    "inquiry",
    "learning_research",
  ]),
  slides: z.array(CarouselSlideSchema).min(5).max(12),
  caption: z.string().min(1),
  sourceIds: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
});

export type CarouselDraft = z.infer<typeof CarouselDraftSchema>;

// ================================================================
// STORY DRAFT
// ================================================================

export const StoryFrameSchema = z.object({
  index: z.number().int().min(1),
  type: z.enum(["text", "question", "poll", "cta", "behind_scenes"]),
  onScreenText: z.string().min(1),
  voiceover: z.string().optional(),
  interactionIdea: z.string().optional(),
  visualHint: z.string().optional(),
});

export const StoryDraftSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string().min(1),
  language: z.enum(["uz-Latn", "ru"]),
  frames: z.array(StoryFrameSchema).min(2).max(10),
  notes: z.string().optional(),
});

export type StoryDraft = z.infer<typeof StoryDraftSchema>;

// ================================================================
// PRODUCER OUTPUT
// ================================================================

export const ProducerOutputSchema = z.object({
  taskType: z
    .enum([
      "interview",
      "generate_reel",
      "generate_carousel",
      "generate_stories",
      "generate_week",
      "review_content",
      "brand_strategy",
      "analyze",
      "answer",
    ])
    .catch("answer"),
  response: z.string().min(1),
  missingInfo: z
    .union([
      z.array(z.string()),
      z.boolean().transform((val) => (val ? ["Недостаточно информации"] : [])),
      z.string().transform((str) => [str]),
    ])
    .default([]),
  nextQuestion: z.string().optional().nullable(),
  routeTo: z
    .enum([
      "interviewer",
      "scriptwriter",
      "planner",
      "strategist",
      "repurposer",
      "analyst",
      "none",
    ])
    .optional()
    .nullable(),
  suggestedActions: z
    .array(
      z.union([
        z.object({
          label: z.string(),
          action: z.string(),
        }),
        z.string().transform((str) => ({ label: str, action: str })),
      ])
    )
    .default([]),
});

export type ProducerOutput = z.infer<typeof ProducerOutputSchema>;

// ================================================================
// INTERVIEWER OUTPUT
// ================================================================

export const InterviewerOutputSchema = z.object({
  nextQuestion: z.string().min(1),
  purpose: z.string().min(1),
  knowledgeField: z.string().min(1),
  proposedFacts: z
    .array(
      z.object({
        field: z.string(),
        value: z.string(),
        confidence: z.enum(["high", "medium", "low"]),
      })
    )
    .default([]),
  ambiguities: z.array(z.string()).default([]),
  isDone: z.boolean().default(false),
});

export type InterviewerOutput = z.infer<typeof InterviewerOutputSchema>;

// ================================================================
// BRAND STRATEGIST OUTPUT
// ================================================================

export const BrandStrategistOutputSchema = z.object({
  positionings: z
    .array(
      z.object({
        textUz: z.string().min(1),
        explanationRu: z.string().min(1),
        rationale: z.string().min(1),
        assumptions: z.array(z.string()).default([]),
      })
    )
    .length(3),
  recommendation: z.string().min(1),
  gaps: z.array(z.string()).default([]),
});

export type BrandStrategistOutput = z.infer<typeof BrandStrategistOutputSchema>;

// ================================================================
// REVIEW OUTPUT
// ================================================================

export const ReviewIssueSchema = z.object({
  severity: z.enum(["blocker", "warning", "suggestion"]),
  field: z.string().optional(),
  fragment: z.string().optional(),
  reason: z.string().min(1),
  suggestion: z.string().optional(),
});

export const ReviewOutputSchema = z.object({
  issues: z.array(ReviewIssueSchema),
  hasBlockers: z.boolean(),
  summary: z.string().min(1),
});

export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;

// ================================================================
// ANALYST OUTPUT
// ================================================================

export const AnalystOutputSchema = z.object({
  publishedCount: z.number().int().min(0),
  missingData: z.array(z.string()).default([]),
  observations: z
    .array(
      z.object({
        text: z.string(),
        numbers: z.string().optional(),
        isHypothesis: z.boolean().default(false),
      })
    )
    .default([]),
  hypothesis: z.string().optional(),
  metric: z.string().optional(),
  experiment: z.string().optional(),
  suggestions: z
    .array(
      z.object({
        topic: z.string(),
        action: z.enum(["continue", "revise", "pause"]),
        reason: z.string(),
      })
    )
    .default([]),
  dataWarnings: z.array(z.string()).default([]),
  insufficientData: z.boolean().default(false),
});

export type AnalystOutput = z.infer<typeof AnalystOutputSchema>;

// ================================================================
// WEEK PLAN OUTPUT
// ================================================================

export const PlanItemOutputSchema = z.object({
  dayIndex: z.number().int().min(0).max(6),
  scheduledDate: z.string(), // ISO date string
  format: z.enum(["reel", "carousel", "story", "pinned"]),
  audience: z.enum(["owner", "sales_leader", "sales_manager"]),
  goal: z.enum([
    "awareness",
    "trust",
    "save",
    "discussion",
    "inquiry",
    "learning_research",
  ]),
  topic: z.string().min(1),
  section: z.string().optional(),
  productionComplexity: z.enum(["simple", "medium", "complex"]),
  requiredSources: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const WeekPlanOutputSchema = z.object({
  items: z.array(PlanItemOutputSchema).min(7).max(7),
  storiesItems: z.array(PlanItemOutputSchema),
  notes: z.string().optional(),
  salesPostCount: z.number().int().min(0).max(2),
});

export type WeekPlanOutput = z.infer<typeof WeekPlanOutputSchema>;

// ─── Design-agent pipeline ──────────────────────────────────────────────────
//
// A sequential, streaming, 6-stage replacement for the old CrewAI Cloud
// pipeline. Each stage:
//
//   1. Is driven by a persona (system prompt) from `./personas`.
//   2. Gets the founder's original `topic` plus any previous stages' outputs
//      injected into its user prompt as context.
//   3. Streams its text back to the caller so the UI can show live progress.
//   4. Hands its completed text to the next stage via the `context` map.
//
// Everything runs inside the Next.js process — no external services, no
// kickoff/polling dance. The only thing the runtime needs is
// process.env.ANTHROPIC_API_KEY.

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, type LanguageModel } from "ai";

import {
  COPYWRITER,
  CREATIVE_DIRECTOR,
  FULLSTACK_CODER,
  GROWTH_STRATEGIST,
  INTERFACE_SPECIALIST,
  SYSTEM_ARCHITECT,
  type Persona,
} from "./personas";

// ─── Model selection ────────────────────────────────────────────────────────
//
// Single provider by design — one key, one surface area, one thing to debug.
// If later we want cost-sensitive routing, swap `CLAUDE` for a per-stage
// `LanguageModel` on the stage definition.
const CLAUDE: LanguageModel = anthropic("claude-3-5-sonnet-20241022");

// ─── Stage definitions ──────────────────────────────────────────────────────

export interface StageDefinition {
  /** Stable key — used in the UI, in the streamed event envelope, and as
   *  the lookup key for downstream stages reading this stage's output. */
  readonly key: StageKey;
  /** Short title shown in the admin console. */
  readonly title: string;
  /** Persona (system prompt) driving this stage. */
  readonly persona: Persona;
  /** LLM backing the stage. */
  readonly model: LanguageModel;
  /** Builds the user prompt from the original topic + prior stage outputs. */
  readonly buildPrompt: (ctx: StageContext) => string;
}

export type StageKey =
  | "brand_direction"
  | "ui_specification"
  | "system_architecture"
  | "implementation"
  | "growth_plan"
  | "launch_copy";

export interface StageContext {
  /** The original founder brief, verbatim. */
  readonly topic: string;
  /** Completed text outputs from prior stages, keyed by StageKey. */
  readonly outputs: Partial<Record<StageKey, string>>;
}

/** Inject a prior stage's output into a prompt only if it exists — keeps
 *  the prompt readable when debugging a single-stage run. */
function priorBlock(label: string, text: string | undefined): string {
  if (!text) return "";
  return `\n\n----- ${label.toUpperCase()} (from the previous stage) -----\n${text}\n----- END ${label.toUpperCase()} -----`;
}

export const PIPELINE: readonly StageDefinition[] = [
  {
    key: "brand_direction",
    title: "Brand Direction",
    persona: CREATIVE_DIRECTOR,
    model: CLAUDE,
    buildPrompt: ({ topic }) => `
The founder has submitted the following brief:

----- BRIEF -----
${topic}
----- END BRIEF -----

Define the brand and visual direction for this initiative in under 300 words.
Your memo must contain exactly four sections:

  1. Core feeling — two sentences on what the user should feel in the first
     five seconds.
  2. Visual vocabulary — concrete tokens, not adjectives:
       • Palette: minimum 3 hex codes (e.g. #0E0E10, #00E6E6, #9C42F4) with
         a one-line role for each.
       • Typography: specific font families by name + heading/body scale
         ratio.
       • Motion language: easing + duration defaults (e.g. "160ms ease-out
         on hover").
       • Imagery register in one sentence.
  3. Three "we do / we don't" pairs that define the taste guardrails.
  4. One reference product or cultural moment that anchors the vision.

Output must be markdown. No buzzwords. No "best practices" filler.`.trim(),
  },

  {
    key: "ui_specification",
    title: "UI Specification",
    persona: INTERFACE_SPECIALIST,
    model: CLAUDE,
    buildPrompt: ({ topic, outputs }) => `
Using the brand direction below as your north star, produce the UI
specification for the initiative described in the brief.

----- ORIGINAL BRIEF -----
${topic}
----- END ORIGINAL BRIEF -----
${priorBlock("brand direction", outputs.brand_direction)}

Your spec must contain:

  1. Component hierarchy — ASCII tree of components with the Radix primitive
     each one wraps (if any) in parens.
  2. Interaction & state model — for every interactive component, enumerate
     its states in a markdown table with columns:
       state | trigger | visual change | Tailwind class delta
     States covered: default, hover, focus, focus-visible, active, disabled,
     loading, empty, error.
  3. Layout & spacing — for each component, provide the literal Tailwind
     class string an engineer can paste into JSX, with responsive prefixes
     where relevant. No prose substitutes.
  4. Accessibility contract — tab order, ARIA roles, reduced-motion
     behaviour, keyboard shortcuts.
  5. Open questions — numbered.

Hard constraints:
  - Targets Next.js 14 App Router + Tailwind + Radix UI.
  - No inline JSX style objects unless Tailwind literally cannot express the
    value.
  - Reuse palette/typography tokens from the brand direction.`.trim(),
  },

  {
    key: "system_architecture",
    title: "System Architecture",
    persona: SYSTEM_ARCHITECT,
    model: CLAUDE,
    buildPrompt: ({ topic, outputs }) => `
The UI specification has been approved. Design the technical approach to
implement it.

----- ORIGINAL BRIEF -----
${topic}
----- END ORIGINAL BRIEF -----
${priorBlock("brand direction", outputs.brand_direction)}
${priorBlock("ui specification", outputs.ui_specification)}

Your memo must cover:

  1. Files to create, modify, or delete — with paths relative to the repo
     root.
  2. Data flow — where state lives, how it mutates, what crosses the
     network boundary. Include an ASCII diagram.
  3. Database / Supabase changes (if any) — tables, columns, RLS policies,
     migration file names.
  4. Server Actions and API routes involved.
  5. Risks & tradeoffs — what could go wrong, what is being deferred.

Hard constraint — the frozen files MUST NOT appear in your change list:
  app/api/github/callback/route.ts
  app/api/discover/route.ts
  app/api/webhooks/stripe/route.ts
  app/api/listings/[id]/check/route.ts
  app/api/profiles/me/route.ts
  app/api/payments/checkout/route.ts
  lib/listing-check/worker.ts

If any of these would need to change, stop and escalate in the "Risks &
tradeoffs" section.`.trim(),
  },

  {
    key: "implementation",
    title: "Implementation",
    persona: FULLSTACK_CODER,
    model: CLAUDE,
    buildPrompt: ({ topic, outputs }) => `
Implement the architecture below as production-grade TypeScript.

----- ORIGINAL BRIEF -----
${topic}
----- END ORIGINAL BRIEF -----
${priorBlock("ui specification", outputs.ui_specification)}
${priorBlock("system architecture", outputs.system_architecture)}

For each file in the architecture's change list, produce:

  (a) A markdown heading with the file path.
  (b) A fenced code block containing the COMPLETE file contents — no
      ellipses, no "... rest unchanged".
  (c) One line noting the most important thing a reviewer should check.

Hard rules:
  - Match the existing stack: Next.js 14 App Router, Tailwind, Radix UI,
    Supabase SSR, Zod, date-fns.
  - Never modify the frozen security files.
  - Smallest implementation that satisfies the spec — no speculative
    helpers, no "might be useful later" abstractions.
  - Every external link gets rel="noopener noreferrer".
  - Never put a secret on the client.`.trim(),
  },

  {
    key: "growth_plan",
    title: "Growth Plan",
    persona: GROWTH_STRATEGIST,
    model: CLAUDE,
    buildPrompt: ({ topic, outputs }) => `
The implementation is ready. Build the launch-growth plan for the feature.

----- ORIGINAL BRIEF -----
${topic}
----- END ORIGINAL BRIEF -----
${priorBlock("ui specification", outputs.ui_specification)}
${priorBlock("implementation", outputs.implementation)}

Your plan must contain:

  1. The one-sentence pitch — ≤15 words, written for a creator who has
     never heard of this feature.
  2. Activation hypothesis — the specific user behaviour we expect to
     change, with a baseline and target delta.
  3. Distribution channels ranked by fit, split into three horizons:
     launch day, week one, month one. One-line justification per channel.
  4. Three metrics we will instrument — every metric must be countable.
     Break "engagement" and "retention" into observable events.
  5. Kill criterion — the measured outcome that would cause us to roll
     this back.`.trim(),
  },

  {
    key: "launch_copy",
    title: "Launch Copy",
    persona: COPYWRITER,
    model: CLAUDE,
    buildPrompt: ({ topic, outputs }) => `
Using the growth plan's one-sentence pitch as your anchor, write the launch
copy package.

----- ORIGINAL BRIEF -----
${topic}
----- END ORIGINAL BRIEF -----
${priorBlock("brand direction", outputs.brand_direction)}
${priorBlock("growth plan", outputs.growth_plan)}

Deliverables:

  1. Landing hero — headline (≤9 words), subhead (≤20 words), CTA (≤3 words).
  2. Twitter / X launch post — ≤240 characters, one sentence, written so the
     product earns the post rather than announces itself.
  3. Email announcement to existing creators — ≤120 words, ends with one
     clear action.
  4. One empty-state microcopy — two lines max, voice-matched.

Voice rules (non-negotiable):
  - Confident, specific, slightly ahead of itself.
  - Banned: "unlock", "revolutionary", "seamless", "the future is here",
    "take your X to the next level".
  - No exclamation marks. No em-dash theatrics. No three-word drama
    sentences.`.trim(),
  },
];

// ─── Streaming pipeline event envelope ──────────────────────────────────────
//
// The API route forwards these events as NDJSON lines. The UI decodes each
// line and updates the corresponding stage panel.

export type PipelineEvent =
  | { type: "pipeline_start"; topic: string; stages: { key: StageKey; title: string }[] }
  | { type: "stage_start"; key: StageKey; title: string }
  | { type: "stage_delta"; key: StageKey; delta: string }
  | { type: "stage_complete"; key: StageKey; text: string }
  | { type: "pipeline_complete"; outputs: Partial<Record<StageKey, string>> }
  | { type: "error"; key?: StageKey; message: string };

// ─── Orchestrator ───────────────────────────────────────────────────────────

export interface RunPipelineOptions {
  /** Abort signal wired from the HTTP request — lets a disconnected client
   *  cancel in-flight LLM calls instead of burning credits. */
  readonly signal?: AbortSignal;
}

/** Runs the full 6-stage pipeline, yielding `PipelineEvent`s for each step.
 *
 *  The async-generator shape lets the API route forward events as they
 *  happen without materialising the full run in memory first.
 */
export async function* runPipeline(
  topic: string,
  { signal }: RunPipelineOptions = {},
): AsyncGenerator<PipelineEvent, void, unknown> {
  const outputs: Partial<Record<StageKey, string>> = {};

  yield {
    type: "pipeline_start",
    topic,
    stages: PIPELINE.map((s) => ({ key: s.key, title: s.title })),
  };

  for (const stage of PIPELINE) {
    if (signal?.aborted) return;

    yield { type: "stage_start", key: stage.key, title: stage.title };

    try {
      const result = streamText({
        model: stage.model,
        system: stage.persona.systemPrompt,
        prompt: stage.buildPrompt({ topic, outputs }),
        abortSignal: signal,
      });

      let collected = "";
      for await (const delta of result.textStream) {
        if (signal?.aborted) return;
        collected += delta;
        yield { type: "stage_delta", key: stage.key, delta };
      }

      outputs[stage.key] = collected;
      yield { type: "stage_complete", key: stage.key, text: collected };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      yield { type: "error", key: stage.key, message };
      return;
    }
  }

  yield { type: "pipeline_complete", outputs };
}

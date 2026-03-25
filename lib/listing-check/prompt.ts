/**
 * lib/listing-check/prompt.ts
 * System prompt, user message builder, and Claude tool schema
 * for the automated listing quality check.
 *
 * One tool, one call. The tool forces structured JSON output
 * via tool_choice: { type: 'tool', name: 'submit_check_result' }.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { IngestedFile, ListingForCheck } from "./types";

// ── System prompt ─────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are a basic automated quality checker for Vibe Code Market, an AI product marketplace where creators sell apps, automations, agents, and tools built with AI coding assistants.

Your job is a quick first-pass readiness scan — not a full security audit. Be honest and well-calibrated:
- 9–10: polished, production-ready, clear documentation
- 7–8: genuinely good, minor gaps
- 5–6: publishable but has real fixable problems
- 3–4: significant gaps that will hurt buyer experience
- 0–2: not ready

Do not cluster scores at 7–8 to be polite. Use the full range. A score of 6 is not a compliment.

You must call the submit_check_result tool. Do not respond with plain text.`.trim();

// ── User message ──────────────────────────────────────────────

export function buildUserMessage(
  listing: ListingForCheck,
  files: IngestedFile[]
): string {
  const priceStr =
    listing.price_type === "paid"
      ? `$${(listing.price_cents / 100).toFixed(2)} USD (one-time)`
      : listing.price_type === "free"
      ? "Free"
      : "Contact seller";

  const filesSection =
    files.length > 0
      ? files
          .map((f) => `\`\`\`\n// ${f.name}\n${f.content}\n\`\`\``)
          .join("\n\n")
      : "(No files attached — evaluate based on description only)";

  return `Product: ${listing.title}
Category: ${listing.category_name ?? "Uncategorized"}
Price: ${priceStr}

Description:
${listing.description.trim()}

Files:
${filesSection}`;
}

// ── Tool schema ───────────────────────────────────────────────

/**
 * Passed to Claude as tools[0].
 * tool_choice: { type: 'tool', name: 'submit_check_result' }
 * forces Claude to call this tool instead of generating text.
 */
// Typed explicitly so the Anthropic SDK accepts it — `as const` would make
// `required` readonly, which is incompatible with the SDK's mutable string[].
export const CHECK_TOOL: Anthropic.Tool = {
  name: "submit_check_result",
  description:
    "Submit the automated quality check result for this listing. Call this tool with your complete assessment.",
  input_schema: {
    type: "object" as const,
    required: [
      "completeness_score",
      "security_score",
      "clarity_score",
      "overall_score",
      "outcome",
      "summary",
      "flags",
      "improvements",
      "pricing_note",
    ],
    properties: {
      completeness_score: {
        type: "integer",
        minimum: 0,
        maximum: 10,
        description:
          "Does this product have what a buyer needs to use it? " +
          "Score based on: README with setup instructions (required), " +
          "dependencies declared (package.json / requirements.txt), " +
          "entry point identifiable, usage examples present. " +
          "0 = none present. 10 = thorough and complete.",
      },

      security_score: {
        type: "integer",
        minimum: 0,
        maximum: 10,
        description:
          "10 = no security issues found. Deduct points for: " +
          "hardcoded API keys or passwords in source files, " +
          "eval() or exec() called on user-controlled input, " +
          "shell injection patterns, " +
          "missing .env.example when environment variables are required. " +
          "A critical finding (hardcoded secret) should score 3 or below.",
      },

      clarity_score: {
        type: "integer",
        minimum: 0,
        maximum: 10,
        description:
          "Does the description accurately match what the code does? " +
          "Is the target buyer obvious? Will someone understand exactly " +
          "what they are purchasing before buying it? " +
          "0 = misleading or completely unclear. 10 = crystal clear.",
      },

      overall_score: {
        type: "integer",
        minimum: 0,
        maximum: 10,
        description:
          "Your holistic judgment of publish-readiness. " +
          "Hard rule: if security_score < 4, overall_score must be 5 or lower.",
      },

      outcome: {
        type: "string",
        enum: ["ready", "needs_revision", "flagged"],
        description:
          "'ready' = overall_score >= 7 and no critical flags. " +
          "'needs_revision' = overall_score 5–6 or warnings present. " +
          "'flagged' = any critical security finding, regardless of other scores.",
      },

      summary: {
        type: "string",
        description:
          "One sentence describing what this product is and its single most " +
          "important strength or gap. Be specific. Not generic praise.",
      },

      flags: {
        type: "array",
        maxItems: 5,
        description: "Specific issues found. Empty array if none.",
        items: {
          type: "object",
          required: ["severity", "message"],
          properties: {
            severity: {
              type: "string",
              enum: ["warning", "critical"],
              description:
                "'critical' = security issue or something that will break for buyers. " +
                "'warning' = notable gap that hurts quality.",
            },
            message: {
              type: "string",
              description: "Specific, actionable description of the issue.",
            },
            location: {
              type: "string",
              description:
                "File name and line if determinable, e.g. 'config.js:14'. Omit if not applicable.",
            },
          },
        },
      },

      improvements: {
        type: "array",
        maxItems: 5,
        description:
          "Prioritized list of improvements. Include only real, specific suggestions.",
        items: {
          type: "object",
          required: ["priority", "text"],
          properties: {
            priority: {
              type: "string",
              enum: ["high", "medium", "low"],
            },
            text: {
              type: "string",
              description:
                "One actionable sentence. Start with a verb. " +
                "Example: 'Add a README.md with installation steps and a usage example.'",
            },
          },
        },
      },

      pricing_note: {
        type: ["string", "null"],
        description:
          "One sentence pricing suggestion based on category and complexity. " +
          "Example: 'Similar automations in this category typically sell for $20–$45.' " +
          "Use null if there is not enough information to make a useful suggestion.",
      },
    },
  },
};

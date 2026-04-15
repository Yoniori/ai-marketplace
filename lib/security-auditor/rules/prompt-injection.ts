/**
 * Rule: Prompt Injection Risk
 *
 * Detects patterns where user-controlled input flows into LLM prompts
 * without sanitisation or isolation. Covers system-prompt contamination,
 * direct string-template injection, and missing input guards.
 *
 * Severity: MEDIUM_AI_HALLUCINATION (structural risk) → HIGH if clear taint
 * CWE: CWE-1336 — Improper Neutralization of Special Elements in Prompt
 */

import {
  isExcludedPath,
  isScannableExtension,
  isBinaryContent,
  getLineNumber,
  getSnippet,
  makeFinding,
} from "../utils";
import type { FileEntry, SecurityFinding, RuleFn } from "../types";

// ── Taint sources — things that represent raw user input ──────────────────────

const TAINT_SOURCE_PATTERNS = [
  // Request body / query / params
  /req\.body\s*\.\s*\w+/,
  /request\.body\s*\.\s*\w+/,
  /body\s*\.\s*(?:message|prompt|input|query|text|content|question|userInput|user_input)/i,
  /params\s*\.\s*(?:message|prompt|input|query|text|content|question)/i,
  /searchParams\.get\s*\(\s*['"`](?:prompt|query|message|input|q)['"`]\s*\)/i,
  // Form data
  /formData\.get\s*\(\s*['"`](?:prompt|query|message|input|text|question)['"`]\s*\)/i,
  // Route handler typed param extraction
  /const\s+\{[^}]*(?:prompt|userMessage|message|input|query)[^}]*\}\s*=\s*(?:await\s+)?(?:req|request)\.(?:body|json)\(\)/i,
];

// ── Sink patterns — LLM API calls ─────────────────────────────────────────────

const LLM_SINK_PATTERNS = [
  // OpenAI / Anthropic SDK
  /openai\.chat\.completions\.create/i,
  /client\.messages\.create/i,   // Anthropic
  /anthropic\.messages\.create/i,
  /openai\.completions\.create/i,
  // Generic fetch to known AI endpoints
  /fetch\s*\(\s*['"`]https:\/\/api\.openai\.com/i,
  /fetch\s*\(\s*['"`]https:\/\/api\.anthropic\.com/i,
];

// ── Dangerous direct-injection patterns ───────────────────────────────────────
//
// These patterns fire when user-supplied variables appear to be directly
// interpolated into a prompt string with no obvious sanitisation wrapper.

interface InjectionPattern {
  name: string;
  description: string;
  regex: RegExp;
  severity: "HIGH" | "MEDIUM_AI_HALLUCINATION";
}

const INJECTION_PATTERNS: InjectionPattern[] = [
  {
    name: "Direct User Input in Template Literal Prompt",
    description:
      "A template literal prompt string appears to interpolate a variable named " +
      "after common user-input field names (message, prompt, input, userMessage, query). " +
      "This allows an attacker to inject adversarial instructions directly into the LLM system prompt.",
    regex: /`[^`]*\$\{(?:params\.|body\.|req\.body\.|request\.body\.)?(?:message|prompt|input|userInput|user_input|userMessage|query|question|text)[^}]*\}[^`]*`/gi,
    severity: "HIGH",
  },
  {
    name: "String Concatenation into LLM Prompt",
    description:
      "User-input variable is concatenated directly into a prompt string using the '+' operator. " +
      "This is a classic prompt injection vector — an attacker can end the intended instruction and " +
      "append their own.",
    regex: /(?:systemPrompt|userPrompt|prompt|messages)\s*\+[=]?\s*(?:userMessage|message|input|query|userInput|req\.body)/gi,
    severity: "HIGH",
  },
  {
    name: "Unsanitised Input in `messages` Array",
    description:
      "A `messages` array passed to an LLM API appears to include a raw user-controlled variable " +
      "as the `content` field without any sanitisation step visible nearby.",
    regex: /\{\s*role\s*:\s*['"`]user['"`]\s*,\s*content\s*:\s*(?!['"`])(?!\[)[A-Za-z_$][A-Za-z0-9_$]*/g,
    severity: "MEDIUM_AI_HALLUCINATION",
  },
  {
    name: "System Prompt Built from User Input",
    description:
      "The system prompt (role: 'system') is constructed using a variable that may derive from " +
      "user input, allowing an attacker to rewrite the AI's instructions entirely.",
    regex: /\{\s*role\s*:\s*['"`]system['"`]\s*,\s*content\s*:\s*`[^`]*\$\{/g,
    severity: "HIGH",
  },
  {
    name: "Missing Input Sanitisation Before LLM Call",
    description:
      "A pattern consistent with an unsanitised request field being passed directly to an LLM " +
      "completion call with no trim, filter, or escape wrapper in the surrounding lines.",
    regex: /(?:completion|response|result)\s*=\s*await\s+(?:openai|anthropic|client)[\w.]+\.(?:create|complete|generate)\s*\(\s*\{[^}]*content\s*:\s*(?:body|req|request)[\w.[\]'"]+/gis,
    severity: "MEDIUM_AI_HALLUCINATION",
  },
];

// ── Extensions worth scanning ─────────────────────────────────────────────────

const AI_CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py",
]);

// ── Rule implementation ───────────────────────────────────────────────────────

export const run: RuleFn = async (files: FileEntry[]): Promise<SecurityFinding[]> => {
  const findings: SecurityFinding[] = [];

  for (const file of files) {
    if (isExcludedPath(file.path)) continue;
    if (isBinaryContent(file.content)) continue;
    if (!isScannableExtension(file.path)) continue;

    const { extname } = require("path") as typeof import("path");
    const ext = extname(file.path).toLowerCase();
    if (!AI_CODE_EXTENSIONS.has(ext)) continue;

    const content = file.content;

    // Check if this file has any LLM API call at all — avoid false positives
    // in files that never touch an LLM
    const hasLLMSink = LLM_SINK_PATTERNS.some((p) => p.test(content));
    const hasTaintSource = TAINT_SOURCE_PATTERNS.some((p) => p.test(content));

    // Run targeted injection patterns (always — patterns are specific enough)
    for (const pattern of INJECTION_PATTERNS) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        const lineNum = getLineNumber(content, match.index);
        const snippet = getSnippet(content, lineNum);

        findings.push(
          makeFinding({
            severity: pattern.severity,
            category: "PROMPT_INJECTION",
            title: pattern.name,
            description: pattern.description,
            file: file.path,
            line: lineNum,
            snippet,
            recommendation:
              "Never interpolate raw user input directly into LLM prompts. " +
              "1) Validate and whitelist user input before use. " +
              "2) Use a dedicated system prompt that cannot be overwritten. " +
              "3) Consider a prompt wrapper/sandbox layer that strips control characters " +
              "and prevents instruction-override phrases (e.g., 'Ignore previous instructions'). " +
              "4) Apply output-length and topic constraints in the API call.",
            cweId: "CWE-1336",
            confidence: "MEDIUM",
          })
        );
      }
    }

    // Heuristic: file has both taint source AND LLM sink but no apparent sanitisation
    if (hasLLMSink && hasTaintSource) {
      const sanitisationPresent =
        /(?:sanitize|sanitise|escape|stripHtml|DOMPurify|validator\.|z\.string|zod|joi\.|yup\.|trim\(\)|replace\(|isAllowed|allowlist)/i.test(content);

      if (!sanitisationPresent) {
        // Only report at file level once — don't flood with duplicates
        const sinkMatch = LLM_SINK_PATTERNS.map((p) => {
          const m = new RegExp(p.source, p.flags + "i").exec(content);
          return m ? { index: m.index } : null;
        }).find(Boolean);

        const lineNum = sinkMatch
          ? getLineNumber(content, sinkMatch.index)
          : 1;

        findings.push(
          makeFinding({
            severity: "MEDIUM_AI_HALLUCINATION",
            category: "PROMPT_INJECTION",
            title: "Unguarded User Input Reaching LLM API (No Sanitisation Detected)",
            description:
              "This file contains both a user-input taint source (request body/params/formData) " +
              "and an LLM API sink (OpenAI/Anthropic), but no sanitisation, validation, or " +
              "input-filtering library calls were detected. An attacker may be able to craft " +
              "a payload that hijacks the AI's instructions.",
            file: file.path,
            line: lineNum,
            snippet: getSnippet(content, lineNum),
            recommendation:
              "Add input validation (Zod, Joi, or manual allowlisting) before passing any " +
              "user-controlled value to an LLM. Enforce max token budgets on user content " +
              "and consider an LLM-specific firewall (e.g., Rebuff, GuardRails AI).",
            cweId: "CWE-1336",
            confidence: "MEDIUM",
          })
        );
      }
    }
  }

  return findings;
};

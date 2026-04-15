/**
 * Rule: Insecure AI Output Handling
 *
 * Detects cases where content returned by an LLM is injected into the DOM
 * or evaluated as code without sanitisation — a primary XSS and code-injection vector
 * in AI-powered apps.
 *
 * Severity: HIGH (direct XSS/code-exec risk)
 * CWE: CWE-79 — Improper Neutralization of Input During Web Page Generation (XSS)
 *      CWE-95 — Improper Neutralization of Directives in Dynamically Evaluated Code
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

// ── Patterns ───────────────────────────────────────────────────────────────────

interface OutputPattern {
  name: string;
  description: string;
  regex: RegExp;
  severity: "HIGH" | "MEDIUM_AI_HALLUCINATION";
  cweId: string;
  recommendation: string;
}

const OUTPUT_PATTERNS: OutputPattern[] = [
  // ── dangerouslySetInnerHTML with AI output ───────────────────────────────────
  {
    name: "dangerouslySetInnerHTML with Unescaped AI Output",
    description:
      "React's `dangerouslySetInnerHTML` is used with a variable that likely contains " +
      "AI-generated content. If the LLM produces malicious HTML or is manipulated via prompt " +
      "injection, this becomes a direct XSS vector.",
    regex: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:\s*(?!['"`])(?!\[)[A-Za-z_$][A-Za-z0-9_$.[\]'"()]*\s*\}\s*\}/g,
    severity: "HIGH",
    cweId: "CWE-79",
    recommendation:
      "Never render raw AI output as HTML. Use DOMPurify.sanitize() before passing to " +
      "`__html`, or better yet render AI responses as plain text (children) instead of HTML. " +
      "If Markdown rendering is needed, use a safe renderer (react-markdown with rehype-sanitize).",
  },

  // ── eval() on AI response ────────────────────────────────────────────────────
  {
    name: "eval() on AI-Generated Content",
    description:
      "An `eval()` call is used with a variable that appears to hold AI-generated or " +
      "user-influenced content. An attacker can inject JavaScript through a manipulated LLM " +
      "response and achieve arbitrary code execution in the browser or server context.",
    regex: /\beval\s*\(\s*(?!['"`])(?!\[)[A-Za-z_$][A-Za-z0-9_$.[\]'"()]*\s*\)/g,
    severity: "HIGH",
    cweId: "CWE-95",
    recommendation:
      "Never use eval() on content that originates from an AI model, user input, or network " +
      "responses. Use a safe JSON parser, a sandboxed interpreter (e.g., vm2, isolated-vm), " +
      "or avoid dynamic code execution entirely.",
  },

  // ── Function constructor ─────────────────────────────────────────────────────
  {
    name: "Function Constructor with Dynamic String (Code Injection)",
    description:
      "The `Function()` constructor is called with a dynamically-built string argument, " +
      "which is equivalent to `eval()`. If AI output reaches this call, an attacker can " +
      "achieve remote code execution.",
    regex: /new\s+Function\s*\(\s*(?!['"`\[])(?!\[\])[A-Za-z_$`'"][^)]{0,200}\)/g,
    severity: "HIGH",
    cweId: "CWE-95",
    recommendation:
      "Avoid `new Function(string)` with any untrusted or AI-generated input. " +
      "If dynamic behaviour is needed, use a safe DSL or a well-audited sandbox library.",
  },

  // ── innerHTML assignment ─────────────────────────────────────────────────────
  {
    name: "innerHTML Assignment with Dynamic Content",
    description:
      "A `.innerHTML` assignment uses a variable (not a string literal). If this variable " +
      "can be influenced by AI output or user input, this is a direct DOM XSS vulnerability.",
    regex: /\.innerHTML\s*=\s*(?!['"`])(?!\s*'')(?!\s*"")[A-Za-z_$][A-Za-z0-9_$.[\]'"()` ]+(?!['"`])\s*;?/g,
    severity: "HIGH",
    cweId: "CWE-79",
    recommendation:
      "Use textContent instead of innerHTML for plain text, or sanitize with DOMPurify " +
      "before any innerHTML assignment: `element.innerHTML = DOMPurify.sanitize(aiOutput)`.",
  },

  // ── document.write with variable ────────────────────────────────────────────
  {
    name: "document.write with Dynamic Content",
    description:
      "`document.write()` with a non-literal argument is a legacy XSS vector. " +
      "AI-generated strings injected here can execute arbitrary scripts.",
    regex: /document\.write\s*\(\s*(?!['"`])[A-Za-z_$][A-Za-z0-9_$.[\]'"()]*\s*\)/g,
    severity: "HIGH",
    cweId: "CWE-79",
    recommendation:
      "Remove all uses of `document.write()`. Construct DOM nodes programmatically " +
      "and use textContent for any dynamic text content.",
  },

  // ── Rendering AI output without sanitisation in Next.js server component ────
  {
    name: "AI Response Rendered Without Sanitisation (Next.js / React)",
    description:
      "A variable named after a common LLM response field (`completion`, `aiResponse`, " +
      "`llmOutput`, `generatedText`, `content`) is passed directly to `dangerouslySetInnerHTML` " +
      "or an HTML-injection sink. The AI provider could return adversarial HTML.",
    regex: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:\s*(?:completion|aiResponse|llmOutput|generatedText|assistantMessage|responseText|output|result)\s*\}\s*\}/gi,
    severity: "HIGH",
    cweId: "CWE-79",
    recommendation:
      "Sanitize all AI-generated HTML with DOMPurify (browser) or a server-side HTML " +
      "sanitiser before rendering. Treat LLM output as untrusted user content.",
  },

  // ── setInterval / setTimeout with string arg ─────────────────────────────────
  {
    name: "setTimeout/setInterval with String Argument (eval-equivalent)",
    description:
      "Passing a non-function (string) to `setTimeout` or `setInterval` is equivalent to " +
      "`eval()`. If the string is derived from an AI response or user input, code execution " +
      "is possible.",
    regex: /(?:setTimeout|setInterval)\s*\(\s*(?!function)(?!\(\s*\))(?!['"`]\s*\))[A-Za-z_$][A-Za-z0-9_$.[\]'"()]*\s*,/g,
    severity: "HIGH",
    cweId: "CWE-95",
    recommendation:
      "Always pass a function reference or arrow function to setTimeout/setInterval, " +
      "never a string. E.g., `setTimeout(() => doThing(), 1000)` not `setTimeout(code, 1000)`.",
  },

  // ── Markdown rendered without sanitisation ────────────────────────────────────
  {
    name: "Markdown Rendered Without HTML Sanitisation",
    description:
      "A Markdown parser (marked, markdown-it, showdown) is used to render AI output " +
      "without a subsequent HTML sanitisation step. Malicious Markdown can embed raw HTML " +
      "including `<script>` tags.",
    regex: /(?:marked\.parse|marked\(|markdownIt\(\)|showdown\.makeHtml|md\.render)\s*\(\s*(?!['"`])[A-Za-z_$][A-Za-z0-9_$.[\]'"()]*\s*\)/g,
    severity: "MEDIUM_AI_HALLUCINATION",
    cweId: "CWE-79",
    recommendation:
      "Enable the sanitisation option in your Markdown parser, or pipe its output through " +
      "DOMPurify before rendering: `DOMPurify.sanitize(marked.parse(aiText))`. " +
      "For react-markdown, add `rehype-sanitize` as a rehype plugin.",
  },

  // ── JSON.parse on AI response without try/catch ───────────────────────────────
  {
    name: "JSON.parse on AI Response Without Error Handling",
    description:
      "An AI response is passed directly to `JSON.parse()` without a try/catch wrapper. " +
      "LLMs frequently return malformed JSON, and some adversarial outputs can also cause " +
      "prototype pollution if the parsed object is later spread into a target object.",
    regex: /JSON\.parse\s*\(\s*(?:completion|aiResponse|llmOutput|generatedText|assistantMessage|responseText|output|result|data|content)[\w.[\]'"()]*\s*\)(?!\s*\})(?!.*catch)/gi,
    severity: "MEDIUM_AI_HALLUCINATION",
    cweId: "CWE-79",
    recommendation:
      "Wrap JSON.parse() in try/catch, validate the schema with Zod or similar, and " +
      "avoid spreading AI-parsed objects directly into trusted data structures without " +
      "property whitelisting.",
  },
];

// ── Rule implementation ────────────────────────────────────────────────────────

export const run: RuleFn = async (files: FileEntry[]): Promise<SecurityFinding[]> => {
  const findings: SecurityFinding[] = [];

  for (const file of files) {
    if (isExcludedPath(file.path)) continue;
    if (isBinaryContent(file.content)) continue;
    if (!isScannableExtension(file.path)) continue;

    const content = file.content;

    for (const pattern of OUTPUT_PATTERNS) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        const lineNum = getLineNumber(content, match.index);
        const snippet = getSnippet(content, lineNum);

        findings.push(
          makeFinding({
            severity: pattern.severity,
            category: "INSECURE_OUTPUT",
            title: pattern.name,
            description: pattern.description,
            file: file.path,
            line: lineNum,
            snippet,
            recommendation: pattern.recommendation,
            cweId: pattern.cweId,
            confidence: "MEDIUM",
          })
        );
      }
    }
  }

  return findings;
};

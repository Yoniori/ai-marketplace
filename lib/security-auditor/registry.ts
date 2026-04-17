/**
 * ─── Security Auditor — Check Registry ──────────────────────────────────────
 *
 * Central, hand-maintained registry listing every individual check pattern
 * across the rule engine. This is the single source of truth for:
 *
 *   - The live "checks available" counter shown in the UI
 *   - The admin `/api/admin/audit-status` endpoint
 *   - The self-test baseline count
 *   - Per-check timing / progress events emitted by SecurityGuardian
 *
 * Why maintain this by hand rather than derive from the rule files?
 *   - Regex arrays inside rule files are implementation details. Pulling names
 *     out would require parsing source code and keeping two representations in
 *     sync. The registry is the authoritative *public contract*.
 *   - A rule file may implement one or many checks; the registry is the right
 *     place to decide granularity.
 *
 * When you add a new regex/heuristic to any rule file, add a matching entry
 * here. The self-test will fail loudly if the counts drift.
 */

import type { SecurityCategory, Severity } from "./types";

export interface CheckDescriptor {
  /** Stable machine-readable ID, e.g. "HARDCODED_SECRET/openai" */
  id: string;
  /** Rule file that implements this check */
  ruleFile:
    | "hardcoded-secrets"
    | "prompt-injection"
    | "insecure-output"
    | "malware-detection"
    | "classic-flaws"
    | "phantom-deps"
    | "dependency-confusion";
  /** Finding category produced when this check fires */
  category: SecurityCategory;
  /** Maximum severity this check can raise */
  maxSeverity: Severity;
  /** Short human-readable label for dashboards and progress output */
  label: string;
  /** CWE identifier where applicable */
  cweId?: string;
}

// ── Registry — one entry per distinct detection pattern ───────────────────────

export const CHECK_REGISTRY: readonly CheckDescriptor[] = [
  // ── hardcoded-secrets.ts ────────────────────────────────────────────────────
  { id: "HARDCODED_SECRET/openai-assignment",    ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "OpenAI API Key (assignment)",  cweId: "CWE-312" },
  { id: "HARDCODED_SECRET/openai-bare",          ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "OpenAI API Key (bare)",        cweId: "CWE-312" },
  { id: "HARDCODED_SECRET/anthropic",            ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "Anthropic API Key",            cweId: "CWE-312" },
  { id: "HARDCODED_SECRET/stripe-live",          ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "Stripe Live Secret Key",       cweId: "CWE-312" },
  { id: "HARDCODED_SECRET/stripe-test",          ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "Stripe Test Secret Key",       cweId: "CWE-312" },
  { id: "HARDCODED_SECRET/stripe-publishable",   ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "Stripe Publishable Key",       cweId: "CWE-312" },
  { id: "HARDCODED_SECRET/stripe-webhook",       ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "Stripe Webhook Secret",        cweId: "CWE-312" },
  { id: "HARDCODED_SECRET/aws-access-key-id",    ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "AWS Access Key ID",            cweId: "CWE-312" },
  { id: "HARDCODED_SECRET/aws-secret-key",       ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "AWS Secret Access Key",        cweId: "CWE-312" },
  { id: "HARDCODED_SECRET/github-pat",           ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "GitHub Personal Access Token", cweId: "CWE-312" },
  { id: "HARDCODED_SECRET/github-fine-grained",  ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "GitHub Fine-Grained Token",    cweId: "CWE-312" },
  { id: "HARDCODED_SECRET/github-oauth",         ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "GitHub OAuth Token",           cweId: "CWE-312" },
  { id: "HARDCODED_SECRET/generic-assignment",   ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "Generic API Key Assignment",   cweId: "CWE-312" },
  { id: "HARDCODED_SECRET/env-file",             ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "Committed .env File",          cweId: "CWE-312" },
  { id: "HARDCODED_SECRET/private-key-block",    ruleFile: "hardcoded-secrets", category: "HARDCODED_SECRET", maxSeverity: "HIGH", label: "PEM/SSH Private Key Block",    cweId: "CWE-321" },

  // ── prompt-injection.ts ─────────────────────────────────────────────────────
  { id: "PROMPT_INJECTION/template-literal",     ruleFile: "prompt-injection", category: "PROMPT_INJECTION", maxSeverity: "HIGH",                    label: "User Input in Template Literal Prompt", cweId: "CWE-1336" },
  { id: "PROMPT_INJECTION/string-concat",        ruleFile: "prompt-injection", category: "PROMPT_INJECTION", maxSeverity: "HIGH",                    label: "String Concat into LLM Prompt",         cweId: "CWE-1336" },
  { id: "PROMPT_INJECTION/messages-array",       ruleFile: "prompt-injection", category: "PROMPT_INJECTION", maxSeverity: "MEDIUM_AI_HALLUCINATION", label: "Unsanitised messages[] Content",        cweId: "CWE-1336" },
  { id: "PROMPT_INJECTION/system-from-input",    ruleFile: "prompt-injection", category: "PROMPT_INJECTION", maxSeverity: "HIGH",                    label: "System Prompt Built from Input",        cweId: "CWE-1336" },
  { id: "PROMPT_INJECTION/no-sanitization",      ruleFile: "prompt-injection", category: "PROMPT_INJECTION", maxSeverity: "MEDIUM_AI_HALLUCINATION", label: "Missing Sanitisation Before LLM Call", cweId: "CWE-1336" },
  { id: "PROMPT_INJECTION/taint-heuristic",      ruleFile: "prompt-injection", category: "PROMPT_INJECTION", maxSeverity: "MEDIUM_AI_HALLUCINATION", label: "Taint Source Reaches LLM Sink",        cweId: "CWE-1336" },

  // ── insecure-output.ts ──────────────────────────────────────────────────────
  { id: "INSECURE_OUTPUT/dangerously-set-html",  ruleFile: "insecure-output", category: "INSECURE_OUTPUT", maxSeverity: "HIGH",                    label: "dangerouslySetInnerHTML Dynamic",      cweId: "CWE-79" },
  { id: "INSECURE_OUTPUT/eval",                  ruleFile: "insecure-output", category: "INSECURE_OUTPUT", maxSeverity: "HIGH",                    label: "eval() on Dynamic Content",            cweId: "CWE-95" },
  { id: "INSECURE_OUTPUT/function-constructor",  ruleFile: "insecure-output", category: "INSECURE_OUTPUT", maxSeverity: "HIGH",                    label: "Function() Constructor w/ String",     cweId: "CWE-95" },
  { id: "INSECURE_OUTPUT/innerhtml",             ruleFile: "insecure-output", category: "INSECURE_OUTPUT", maxSeverity: "HIGH",                    label: "innerHTML = dynamic",                  cweId: "CWE-79" },
  { id: "INSECURE_OUTPUT/document-write",        ruleFile: "insecure-output", category: "INSECURE_OUTPUT", maxSeverity: "HIGH",                    label: "document.write(variable)",             cweId: "CWE-79" },
  { id: "INSECURE_OUTPUT/ai-html-render",        ruleFile: "insecure-output", category: "INSECURE_OUTPUT", maxSeverity: "HIGH",                    label: "AI Response → innerHTML (named var)",  cweId: "CWE-79" },
  { id: "INSECURE_OUTPUT/settimeout-string",     ruleFile: "insecure-output", category: "INSECURE_OUTPUT", maxSeverity: "HIGH",                    label: "setTimeout(string, …) eval-equiv",     cweId: "CWE-95" },
  { id: "INSECURE_OUTPUT/markdown-unsanitized",  ruleFile: "insecure-output", category: "INSECURE_OUTPUT", maxSeverity: "MEDIUM_AI_HALLUCINATION", label: "Markdown Render w/o Sanitise",         cweId: "CWE-79" },
  { id: "INSECURE_OUTPUT/json-parse-ai",         ruleFile: "insecure-output", category: "INSECURE_OUTPUT", maxSeverity: "MEDIUM_AI_HALLUCINATION", label: "JSON.parse on AI Response (no try)",   cweId: "CWE-79" },

  // ── malware-detection.ts ────────────────────────────────────────────────────
  { id: "MALWARE/eval-atob",                     ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "eval(atob(…)) Obfuscation",            cweId: "CWE-506" },
  { id: "MALWARE/eval-hex",                      ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "eval(hex-decoded payload)",            cweId: "CWE-506" },
  { id: "MALWARE/require-obfuscated",            ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "require(obfuscated-module-name)",      cweId: "CWE-506" },
  { id: "MALWARE/fromcharcode-payload",          ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "String.fromCharCode payload",          cweId: "CWE-506" },
  { id: "MALWARE/env-mass-collect",              ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "process.env mass-collection",          cweId: "CWE-506" },
  { id: "MALWARE/env-targeted-secrets",          ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "Targeted env credential harvest",      cweId: "CWE-506" },
  { id: "MALWARE/ip-callback",                   ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "Hardcoded-IP C2 callback",             cweId: "CWE-506" },
  { id: "MALWARE/dns-exfil",                     ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "Encoded data in subdomain/path",       cweId: "CWE-506" },
  { id: "MALWARE/env-then-fetch",                ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "env access → external fetch",          cweId: "CWE-506" },
  { id: "MALWARE/child-process-dynamic",         ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "child_process.exec(dynamic)",          cweId: "CWE-506" },
  { id: "MALWARE/reverse-shell",                 ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "Reverse-shell command literal",        cweId: "CWE-506" },
  { id: "MALWARE/postinstall-payload",           ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "postinstall payload (inline)",         cweId: "CWE-506" },
  { id: "MALWARE/curl-pipe-shell",               ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "curl/wget | bash dropper",             cweId: "CWE-506" },
  { id: "MALWARE/cryptominer-pool",              ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "stratum+tcp mining pool",              cweId: "CWE-506" },
  { id: "MALWARE/wasm-cryptominer",              ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "WebAssembly cryptominer pattern",      cweId: "CWE-506" },
  { id: "MALWARE/obfuscator-hex-vars",           ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "javascript-obfuscator _0x vars",       cweId: "CWE-506" },
  { id: "MALWARE/long-base64",                   ruleFile: "malware-detection", category: "MALWARE", maxSeverity: "CRITICAL_MALWARE", label: "Long inline Base64 blob",              cweId: "CWE-506" },

  // ── classic-flaws.ts ────────────────────────────────────────────────────────
  { id: "SQL_INJECTION/concat",                  ruleFile: "classic-flaws", category: "SQL_INJECTION",         maxSeverity: "HIGH", label: "SQL Injection — Concatenation",      cweId: "CWE-89"  },
  { id: "SQL_INJECTION/template-literal",        ruleFile: "classic-flaws", category: "SQL_INJECTION",         maxSeverity: "HIGH", label: "SQL Injection — Template Literal",   cweId: "CWE-89"  },
  { id: "SQL_INJECTION/supabase-rpc-interp",     ruleFile: "classic-flaws", category: "SQL_INJECTION",         maxSeverity: "HIGH", label: "SQL Injection — Supabase RPC",       cweId: "CWE-89"  },
  { id: "IDOR/lookup-without-owner",             ruleFile: "classic-flaws", category: "IDOR",                  maxSeverity: "HIGH", label: "IDOR — Lookup by params.id",         cweId: "CWE-284" },
  { id: "IDOR/missing-owner-filter",             ruleFile: "classic-flaws", category: "IDOR",                  maxSeverity: "HIGH", label: "IDOR — Missing owner filter",        cweId: "CWE-284" },
  { id: "IDOR/path-traversal",                   ruleFile: "classic-flaws", category: "IDOR",                  maxSeverity: "HIGH", label: "Path Traversal via User Input",      cweId: "CWE-22"  },
  { id: "BROKEN_AUTH/jwt-decode",                ruleFile: "classic-flaws", category: "BROKEN_AUTHENTICATION", maxSeverity: "HIGH", label: "jwt.decode w/o verify",              cweId: "CWE-287" },
  { id: "BROKEN_AUTH/hardcoded-jwt-secret",      ruleFile: "classic-flaws", category: "BROKEN_AUTHENTICATION", maxSeverity: "HIGH", label: "Hardcoded JWT secret",               cweId: "CWE-321" },
  { id: "BROKEN_AUTH/missing-auth-guard",        ruleFile: "classic-flaws", category: "BROKEN_AUTHENTICATION", maxSeverity: "MEDIUM_AI_HALLUCINATION", label: "Missing Auth Guard on Route", cweId: "CWE-287" },
  { id: "BROKEN_AUTH/plaintext-password",        ruleFile: "classic-flaws", category: "BROKEN_AUTHENTICATION", maxSeverity: "HIGH", label: "Plaintext Password Storage",         cweId: "CWE-256" },
  { id: "BROKEN_AUTH/insecure-cookie",           ruleFile: "classic-flaws", category: "BROKEN_AUTHENTICATION", maxSeverity: "HIGH", label: "Cookie w/o httpOnly/secure",         cweId: "CWE-614" },
  { id: "BROKEN_AUTH/cors-wildcard-creds",       ruleFile: "classic-flaws", category: "BROKEN_AUTHENTICATION", maxSeverity: "HIGH", label: "CORS * + credentials:true",          cweId: "CWE-346" },

  // ── phantom-deps.ts ─────────────────────────────────────────────────────────
  { id: "PHANTOM_DEPENDENCY/name-heuristic",     ruleFile: "phantom-deps", category: "PHANTOM_DEPENDENCY", maxSeverity: "MEDIUM_AI_HALLUCINATION", label: "AI-Hallucinated Package Name Pattern", cweId: "CWE-1104" },
  { id: "PHANTOM_DEPENDENCY/registry-404",       ruleFile: "phantom-deps", category: "PHANTOM_DEPENDENCY", maxSeverity: "MEDIUM_AI_HALLUCINATION", label: "npm Registry 404 (not published)",    cweId: "CWE-1104" },

  // ── dependency-confusion.ts ─────────────────────────────────────────────────
  { id: "DEPENDENCY_CONFUSION/custom-registry",  ruleFile: "dependency-confusion", category: "DEPENDENCY_CONFUSION", maxSeverity: "HIGH",             label: "Custom .npmrc Registry",       cweId: "CWE-427" },
  { id: "DEPENDENCY_CONFUSION/lifecycle-script", ruleFile: "dependency-confusion", category: "DEPENDENCY_CONFUSION", maxSeverity: "CRITICAL_MALWARE", label: "Dangerous Lifecycle Script",   cweId: "CWE-506" },
  { id: "DEPENDENCY_CONFUSION/internal-prefix",  ruleFile: "dependency-confusion", category: "DEPENDENCY_CONFUSION", maxSeverity: "HIGH",             label: "Internal-Prefix Confusion",    cweId: "CWE-427" },
  { id: "DEPENDENCY_CONFUSION/anon-net-fetch",   ruleFile: "dependency-confusion", category: "DEPENDENCY_CONFUSION", maxSeverity: "CRITICAL_MALWARE", label: "Anon Pkg + Lifecycle + Fetch", cweId: "CWE-506" },
] as const;

// ── Public helpers ─────────────────────────────────────────────────────────────

/** Total number of distinct detection patterns available. */
export function getCheckCount(): number {
  return CHECK_REGISTRY.length;
}

/** Unique SecurityCategory values this scanner covers. */
export function getCoveredCategories(): SecurityCategory[] {
  return Array.from(new Set(CHECK_REGISTRY.map((c) => c.category)));
}

/** Checks grouped by category, for dashboard display. */
export function getChecksByCategory(): Record<SecurityCategory, CheckDescriptor[]> {
  const grouped = {} as Record<SecurityCategory, CheckDescriptor[]>;
  for (const check of CHECK_REGISTRY) {
    const bucket = grouped[check.category] ?? [];
    bucket.push(check);
    grouped[check.category] = bucket;
  }
  return grouped;
}

/** Check IDs grouped by rule file (useful for per-file timing output). */
export function getChecksByRuleFile(): Record<string, CheckDescriptor[]> {
  const grouped: Record<string, CheckDescriptor[]> = {};
  for (const check of CHECK_REGISTRY) {
    const bucket = grouped[check.ruleFile] ?? [];
    bucket.push(check);
    grouped[check.ruleFile] = bucket;
  }
  return grouped;
}

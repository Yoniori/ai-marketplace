/**
 * Rule: Classic Web Security Flaws
 *
 * Detects SQL injection via string concatenation, Insecure Direct Object References (IDOR),
 * broken authentication patterns, and other OWASP Top-10 class vulnerabilities.
 *
 * Severity: HIGH
 * CWE: CWE-89 (SQLi) / CWE-284 (IDOR) / CWE-287 (Broken Auth)
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

// ── Pattern definitions ────────────────────────────────────────────────────────

interface ClassicPattern {
  name: string;
  description: string;
  regex: RegExp;
  category: "SQL_INJECTION" | "IDOR" | "BROKEN_AUTHENTICATION";
  cweId: string;
  recommendation: string;
  severity: "HIGH" | "MEDIUM_AI_HALLUCINATION";
}

const CLASSIC_PATTERNS: ClassicPattern[] = [

  // ══════════════════════════════════════════════════════════════════════════════
  // SQL INJECTION
  // ══════════════════════════════════════════════════════════════════════════════

  {
    name: "SQL Injection via String Concatenation",
    description:
      "A SQL query string is built by directly concatenating a variable using `+` or string " +
      "interpolation. If the variable originates from user input (request body, URL params, etc.), " +
      "an attacker can break out of the query context and execute arbitrary SQL — including " +
      "data extraction, deletion, and authentication bypass.",
    regex: /(?:SELECT|INSERT|UPDATE|DELETE|WHERE|FROM)\s+[^;'"]{0,60}\s*\+\s*(?:req|request|params|body|query|input|user)[.\w[\]'"()]+/gi,
    category: "SQL_INJECTION",
    cweId: "CWE-89",
    severity: "HIGH",
    recommendation:
      "Use parameterised queries / prepared statements exclusively. " +
      "With Supabase/PostgreSQL: use `.eq()`, `.filter()`, or the rpc() method with params. " +
      "With raw pg/mysql2: use `$1` placeholders. NEVER build SQL strings via concatenation " +
      "or template literals containing user-supplied values.",
  },
  {
    name: "SQL Injection via Template Literal",
    description:
      "A SQL query is constructed using a template literal that interpolates a variable. " +
      "Template literals offer no protection against SQL injection — the result is identical " +
      "to string concatenation.",
    regex: /`\s*(?:SELECT|INSERT|UPDATE|DELETE|WHERE|FROM)[^`]*\$\{(?:req|request|params|body|query|input|user)[^}]*\}[^`]*`/gi,
    category: "SQL_INJECTION",
    cweId: "CWE-89",
    severity: "HIGH",
    recommendation:
      "Replace all template-literal SQL with parameterised queries. " +
      "If using a query builder (Knex, Drizzle), use the binding API. " +
      "If using Supabase, use the typed `.from().select().eq()` chain.",
  },
  {
    name: "Raw SQL via Supabase .rpc() with Interpolated Argument",
    description:
      "A Supabase `.rpc()` or `.from().select(raw)` call uses a template literal that " +
      "interpolates user-controlled data. Supabase RPC calls are parameterised at the API level " +
      "but injecting into the function name or raw SQL arguments bypasses that protection.",
    regex: /\.rpc\s*\(\s*`[^`]*\$\{/g,
    category: "SQL_INJECTION",
    cweId: "CWE-89",
    severity: "HIGH",
    recommendation:
      "Pass RPC arguments in the second parameter object: " +
      "`supabase.rpc('my_function', { param: userValue })`, not in the function name itself.",
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // INSECURE DIRECT OBJECT REFERENCE (IDOR)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    name: "IDOR: Resource Lookup by User-Supplied ID Without Ownership Check",
    description:
      "A database or storage lookup uses an ID taken directly from the request URL " +
      "(`params.id`, `params.userId`, route `[id]`) without verifying that the requesting " +
      "user owns or is authorised to access that resource. An attacker can enumerate or " +
      "modify any resource by changing the ID.",
    regex: /\.(?:from|select|eq|find(?:One|ById))\s*\([^)]*\)\s*(?:[.\n\s]*(?:\.single|\.maybeSingle|\.execute|\.run|\.first))?\s*(?:\/\/[^\n]*)?\n?[^;{]*params\.(?:id|userId|listingId|resourceId|orderId|documentId)/gis,
    category: "IDOR",
    cweId: "CWE-284",
    severity: "HIGH",
    recommendation:
      "After retrieving a resource by ID, verify `resource.user_id === session.user.id` " +
      "before returning or modifying it. With Supabase, enable RLS policies that enforce " +
      "ownership at the database level: `USING (user_id = auth.uid())`.",
  },
  {
    name: "IDOR: Missing Ownership Filter in Query",
    description:
      "A database query filters by a URL-provided ID parameter but the query does NOT " +
      "include a user/owner equality filter. This allows any authenticated user to access " +
      "any record by guessing or enumerating IDs.",
    regex: /\.eq\s*\(\s*['"`]id['"`]\s*,\s*(?:params|searchParams|req\.params|request\.params)\.(?:id|listingId|resourceId|orderId)[^;]{0,200}\.(?:single|maybeSingle|data|execute)/gis,
    category: "IDOR",
    cweId: "CWE-284",
    severity: "HIGH",
    recommendation:
      "Add `.eq('user_id', session.user.id)` to every query that fetches user-owned resources. " +
      "Never rely solely on a public-facing ID as an access control mechanism.",
  },
  {
    name: "IDOR: File Path Traversal via User Input",
    description:
      "A file system path is constructed using user-supplied input without path sanitisation. " +
      "An attacker can supply `../../etc/passwd` or similar payloads to read files outside " +
      "the intended directory.",
    regex: /(?:path\.join|path\.resolve|fs\.(?:read|write|open)File(?:Sync)?)\s*\([^)]*(?:req|params|query|body)[.\w[\]'"()]+/g,
    category: "IDOR",
    cweId: "CWE-22",
    severity: "HIGH",
    recommendation:
      "Resolve the final path and verify it starts with the expected base directory: " +
      "`if (!resolved.startsWith(BASE_DIR)) throw new Error('Path traversal')`. " +
      "Never construct file paths from user input without normalisation and prefix checks.",
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // BROKEN AUTHENTICATION
  // ══════════════════════════════════════════════════════════════════════════════

  {
    name: "JWT Verification Skipped (jwt.decode Without verify)",
    description:
      "`jwt.decode()` is used instead of `jwt.verify()`. `decode()` does NOT validate the " +
      "signature — it simply base64-decodes the payload. An attacker can forge any JWT and " +
      "impersonate any user if the signature is never checked.",
    regex: /\bjwt\.decode\s*\(\s*(?!.*jwt\.verify)/g,
    category: "BROKEN_AUTHENTICATION",
    cweId: "CWE-287",
    severity: "HIGH",
    recommendation:
      "Always use `jwt.verify(token, SECRET)` which validates the signature. " +
      "Only use `jwt.decode()` for non-security purposes such as extracting the expiry time " +
      "before verification for early rejection.",
  },
  {
    name: "Hardcoded JWT Secret",
    description:
      "A JWT is signed or verified with a hardcoded string literal as the secret. " +
      "Anyone with access to the source code can forge valid tokens for any user.",
    regex: /jwt\.(?:sign|verify)\s*\([^,)]+,\s*['"`][A-Za-z0-9!@#$%^&*_\-+=]{8,}['"`]/g,
    category: "BROKEN_AUTHENTICATION",
    cweId: "CWE-321",
    severity: "HIGH",
    recommendation:
      "Move the JWT secret to an environment variable (`process.env.JWT_SECRET`) " +
      "and generate it with at least 256 bits of entropy: `openssl rand -hex 64`.",
  },
  {
    name: "Missing Authentication Check on Protected Route",
    description:
      "A route handler or API function accesses sensitive data or performs a privileged action " +
      "without an early session/auth guard. The handler appears to access user-scoped data " +
      "without first checking `session.user` or similar.",
    regex: /export\s+(?:async\s+)?(?:function\s+)?(?:GET|POST|PUT|DELETE|PATCH|default)\s*\([^)]*\)[^{]*\{(?![\s\S]*?(?:session|auth|user|getUser|getSession|verifyToken|authenticate|requireAuth|middleware)[\s\S]*?(?:return|throw|redirect))/gm,
    category: "BROKEN_AUTHENTICATION",
    cweId: "CWE-287",
    severity: "MEDIUM_AI_HALLUCINATION",
    recommendation:
      "Add an authentication guard at the top of every protected route handler: " +
      "retrieve the session, check it's non-null, and return 401 immediately if absent. " +
      "In Next.js App Router: `const { data: { session } } = await supabase.auth.getSession(); " +
      "if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });`",
  },
  {
    name: "Password Stored Without Hashing",
    description:
      "A variable named `password` is inserted or stored directly in a database query without " +
      "an obvious hashing step (bcrypt, argon2, scrypt). Storing plaintext passwords is a " +
      "critical vulnerability — a database breach exposes all user credentials immediately.",
    regex: /(?:\.insert|\.update|\.upsert|\.set)\s*\(\s*\{[^}]*(?:password|passwd|pwd)\s*:\s*(?!(?:await\s+)?(?:bcrypt|argon2|scrypt|crypto\.pbkdf2|hashSync|hash))/gi,
    category: "BROKEN_AUTHENTICATION",
    cweId: "CWE-256",
    severity: "HIGH",
    recommendation:
      "Hash passwords with bcrypt (cost factor ≥ 12) or argon2id before storing: " +
      "`const hashed = await bcrypt.hash(password, 12)`. " +
      "Never store, log, or transmit plaintext passwords.",
  },
  {
    name: "Insecure Cookie (Missing httpOnly / secure flags)",
    description:
      "A cookie is set without the `httpOnly` and/or `secure` flags. A cookie without " +
      "`httpOnly` can be read by client-side JavaScript, enabling session hijacking via XSS. " +
      "A cookie without `secure` will be transmitted over unencrypted HTTP connections.",
    regex: /(?:res\.cookie|setCookie|cookies\(\)\.set)\s*\([^)]*\)\s*(?!.*httpOnly)(?!.*secure)/gi,
    category: "BROKEN_AUTHENTICATION",
    cweId: "CWE-614",
    severity: "HIGH",
    recommendation:
      "Always set `{ httpOnly: true, secure: true, sameSite: 'strict' }` on authentication " +
      "cookies: `res.cookie('session', token, { httpOnly: true, secure: true, sameSite: 'strict' })`.",
  },
  {
    name: "CORS Wildcard with Credentials Allowed",
    description:
      "CORS is configured with `origin: '*'` (allow all) while also allowing credentials. " +
      "This is an invalid and insecure configuration — browsers will block it — but " +
      "misconfigured CORS that allows attacker-controlled origins with credentials can " +
      "enable cross-origin session hijacking.",
    regex: /(?:cors|corsOptions|Access-Control-Allow-Origin)[^;{]{0,100}(?:'\*'|\"\\*\"|`\*`)[^;]{0,200}(?:credentials\s*:\s*true|Access-Control-Allow-Credentials\s*:\s*['"`]true)/gi,
    category: "BROKEN_AUTHENTICATION",
    cweId: "CWE-346",
    severity: "HIGH",
    recommendation:
      "Never combine `origin: '*'` with `credentials: true`. Use an explicit allowlist of " +
      "trusted origins and reflect only those in the `Access-Control-Allow-Origin` header.",
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

    for (const pattern of CLASSIC_PATTERNS) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        const lineNum = getLineNumber(content, match.index);
        const snippet = getSnippet(content, lineNum);

        // Skip comment-only lines
        const matchLine = content.split("\n")[lineNum - 1] ?? "";
        const trimmed = matchLine.trimStart();
        if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("#")) {
          continue;
        }

        findings.push(
          makeFinding({
            severity: pattern.severity,
            category: pattern.category,
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

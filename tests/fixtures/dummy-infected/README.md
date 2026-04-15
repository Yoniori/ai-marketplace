# ⚠️ DUMMY INFECTED REPOSITORY — TEST FIXTURE ONLY

> **WARNING: This directory contains DELIBERATELY VULNERABLE and SIMULATED MALICIOUS code.**
> It exists solely to validate the Security Auditor rule engines.
>
> - **DO NOT** install the packages listed in `package.json`
> - **DO NOT** run any scripts from this directory
> - **DO NOT** deploy or use any code from this directory
> - **DO NOT** add these files to any real project

## Purpose

These files simulate the output of an AI coding assistant that has:

1. Hallucinated npm package names that don't exist
2. Generated code with hardcoded secrets
3. Introduced prompt injection vulnerabilities
4. Used insecure output rendering
5. Implemented SQL injection vectors
6. Added broken authentication logic
7. Embedded obfuscated/malicious-looking code

## Files

| File | Issues Simulated |
|------|-----------------|
| `package.json` | Phantom deps, dangerous postinstall hook, dependency confusion |
| `.env.local` | Hardcoded API keys (fake) |
| `src/ai-handler.ts` | Prompt injection, insecure output handling |
| `src/api-routes.ts` | SQL injection, IDOR, broken auth |
| `src/malicious-utils.js` | Obfuscated eval, credential harvesting, backdoor fetch |

## Running the Scanner Against These Fixtures

```bash
npm run audit:test
```

This runs `scripts/test-security-auditor.ts` which loads these files and
produces a full security report to stdout.

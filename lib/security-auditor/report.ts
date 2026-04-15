/**
 * ─── Security Auditor — Markdown Report Generator ───────────────────────────
 *
 * Converts a SecurityReport into a rich, formatted Markdown document suitable
 * for display in a GitHub comment, email, or terminal pager.
 */

import type { SecurityFinding, SecurityReport, RiskLevel, Severity } from "./types";
import { severityLabel } from "./utils";

// ── Risk level display ─────────────────────────────────────────────────────────

function riskBadge(risk: RiskLevel): string {
  switch (risk) {
    case "CRITICAL": return "🔴 **CRITICAL**";
    case "HIGH":     return "🟠 **HIGH**";
    case "MEDIUM":   return "🟡 **MEDIUM**";
    case "LOW":      return "🔵 **LOW**";
    case "CLEAN":    return "✅ **CLEAN**";
  }
}

function riskSummaryLine(risk: RiskLevel): string {
  switch (risk) {
    case "CRITICAL":
      return "⚠️  **This repository contains definitive malware or critical security flaws. " +
             "DO NOT install or deploy this code.**";
    case "HIGH":
      return "⚠️  **Exploitable security vulnerabilities found. " +
             "This code should not be used in production without remediation.**";
    case "MEDIUM":
      return "⚠️  **AI-specific risks detected (phantom dependencies, prompt injection surface, " +
             "insecure output handling). Review before use.**";
    case "LOW":
      return "ℹ️  **Minor code quality / hygiene issues found. Low exploitation risk.**";
    case "CLEAN":
      return "✅  **No security issues detected. This repository passed all automated checks.**";
  }
}

// ── Category display ──────────────────────────────────────────────────────────

function categoryLabel(category: SecurityFinding["category"]): string {
  const MAP: Record<SecurityFinding["category"], string> = {
    MALWARE:               "🦠 Malware / Backdoor",
    PROMPT_INJECTION:      "💉 Prompt Injection",
    INSECURE_OUTPUT:       "🖥️  Insecure AI Output",
    HARDCODED_SECRET:      "🔑 Hardcoded Secret",
    SQL_INJECTION:         "💣 SQL Injection",
    IDOR:                  "🚪 IDOR",
    BROKEN_AUTHENTICATION: "🔓 Broken Authentication",
    PHANTOM_DEPENDENCY:    "👻 Phantom Dependency",
    DEPENDENCY_CONFUSION:  "🎭 Dependency Confusion",
  };
  return MAP[category] ?? category;
}

// ── Confidence badge ──────────────────────────────────────────────────────────

function confidenceBadge(conf: SecurityFinding["confidence"]): string {
  switch (conf) {
    case "HIGH":   return "🔴 HIGH";
    case "MEDIUM": return "🟡 MEDIUM";
    case "LOW":    return "🔵 LOW";
  }
}

// ── Escape Markdown ────────────────────────────────────────────────────────────

function escapeMd(s: string): string {
  return s.replace(/[`*_[\]<>]/g, "\\$&");
}

// ── Individual finding block ───────────────────────────────────────────────────

function renderFinding(finding: SecurityFinding, index: number): string {
  const lines: string[] = [];

  lines.push(`### ${index + 1}. ${escapeMd(finding.title)}`);
  lines.push("");
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| **Severity** | ${severityLabel(finding.severity)} |`);
  lines.push(`| **Category** | ${categoryLabel(finding.category)} |`);
  lines.push(`| **Confidence** | ${confidenceBadge(finding.confidence)} |`);
  lines.push(`| **File** | \`${finding.file}\` |`);
  if (finding.line) {
    lines.push(`| **Line** | ${finding.line} |`);
  }
  if (finding.cweId) {
    lines.push(
      `| **CWE** | [${finding.cweId}](https://cwe.mitre.org/data/definitions/${finding.cweId.replace("CWE-", "")}.html) |`
    );
  }
  lines.push(`| **Finding ID** | \`${finding.id}\` |`);
  lines.push("");

  lines.push(`**Description**`);
  lines.push("");
  lines.push(finding.description);
  lines.push("");

  if (finding.snippet) {
    lines.push(`**Code Snippet**`);
    lines.push("");
    lines.push("```");
    lines.push(finding.snippet);
    lines.push("```");
    lines.push("");
  }

  lines.push(`**Recommendation**`);
  lines.push("");
  lines.push(`> ${finding.recommendation.replace(/\n/g, "\n> ")}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  return lines.join("\n");
}

// ── Summary table ─────────────────────────────────────────────────────────────

function renderSummaryTable(report: SecurityReport): string {
  const { summary } = report;
  const lines: string[] = [];

  lines.push("## 📊 Scan Summary");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| **Overall Risk** | ${riskBadge(report.overallRisk)} |`);
  lines.push(`| **Files Scanned** | ${report.filesScanned} |`);
  lines.push(`| **Scan Duration** | ${report.scanDurationMs}ms |`);
  lines.push(`| **Total Findings** | ${summary.total} |`);
  lines.push(`| 🔴 Critical (Malware) | ${summary.critical} |`);
  lines.push(`| 🟠 High (Security) | ${summary.high} |`);
  lines.push(`| 🟡 Medium (AI Risk) | ${summary.medium} |`);
  lines.push(`| 🔵 Low (Hygiene) | ${summary.low} |`);
  lines.push("");

  return lines.join("\n");
}

// ── Findings by severity section ──────────────────────────────────────────────

function renderFindingsSection(
  findings: SecurityFinding[],
  severity: Severity,
  sectionTitle: string
): string {
  const filtered = findings.filter((f) => f.severity === severity);
  if (filtered.length === 0) return "";

  const lines: string[] = [];
  lines.push(`## ${sectionTitle} (${filtered.length})`);
  lines.push("");

  const startIndex = findings.indexOf(filtered[0]);
  filtered.forEach((f, i) => {
    lines.push(renderFinding(f, startIndex + i));
  });

  return lines.join("\n");
}

// ── Phantom dependencies section ──────────────────────────────────────────────

function renderPhantomDepsSection(phantomDeps: string[]): string {
  if (phantomDeps.length === 0) return "";

  const lines: string[] = [];
  lines.push("## 👻 Phantom Dependencies (Not Found on npm)");
  lines.push("");
  lines.push(
    "The following packages were listed in `package.json` but **do not exist** on the " +
    "public npm registry. They were likely hallucinated by an AI coding assistant."
  );
  lines.push("");
  phantomDeps.forEach((name) => {
    lines.push(`- \`${name}\``);
  });
  lines.push("");
  lines.push(
    "> **Risk:** An attacker can claim any of these package names and publish malicious " +
    "code that will be automatically installed by everyone running `npm install`."
  );
  lines.push("");

  return lines.join("\n");
}

// ── Clean bill section ─────────────────────────────────────────────────────────

function renderCleanSection(): string {
  return [
    "## ✅ Audit Result: Clean",
    "",
    "No security issues were detected in this repository.",
    "The following checks all passed:",
    "",
    "- ✅ No hardcoded API keys or secrets",
    "- ✅ No prompt injection vectors detected",
    "- ✅ No insecure AI output handling",
    "- ✅ No malware or backdoor patterns",
    "- ✅ No SQL injection or IDOR risks",
    "- ✅ No broken authentication patterns",
    "- ✅ All npm dependencies verified on registry",
    "- ✅ No dependency confusion indicators",
    "",
    "> **Note:** Automated scanning cannot guarantee the absence of all vulnerabilities. " +
    "This report should be combined with manual code review and dependency auditing.",
    "",
  ].join("\n");
}

// ── Main report generator ─────────────────────────────────────────────────────

export function generateMarkdownReport(report: SecurityReport): string {
  const lines: string[] = [];

  // ── Header ─────────────────────────────────────────────────────────────────
  lines.push("# 🔐 Security Audit Report");
  lines.push("");
  lines.push(`**Target:** \`${report.repoIdentifier}\``);
  lines.push(`**Scanned:** ${new Date(report.scanTimestamp).toUTCString()}`);
  lines.push(`**Engine:** Vibe Code Market — External Repo Security Auditor v1.0`);
  lines.push("");

  // ── Risk banner ─────────────────────────────────────────────────────────────
  lines.push(`## ${riskBadge(report.overallRisk)} Overall Risk`);
  lines.push("");
  lines.push(riskSummaryLine(report.overallRisk));
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Summary table ───────────────────────────────────────────────────────────
  lines.push(renderSummaryTable(report));

  // ── Phantom deps ────────────────────────────────────────────────────────────
  if (report.phantomDependencies.length > 0) {
    lines.push(renderPhantomDepsSection(report.phantomDependencies));
  }

  if (report.findings.length === 0) {
    lines.push(renderCleanSection());
  } else {
    // ── Findings grouped by severity ──────────────────────────────────────────
    lines.push("## 🔍 Findings");
    lines.push("");

    lines.push(
      renderFindingsSection(
        report.findings,
        "CRITICAL_MALWARE",
        "🔴 CRITICAL — Malware / Backdoor"
      )
    );
    lines.push(
      renderFindingsSection(
        report.findings,
        "HIGH",
        "🟠 HIGH — Exploitable Security Flaws"
      )
    );
    lines.push(
      renderFindingsSection(
        report.findings,
        "MEDIUM_AI_HALLUCINATION",
        "🟡 MEDIUM — AI-Specific Risks"
      )
    );
    lines.push(
      renderFindingsSection(
        report.findings,
        "LOW",
        "🔵 LOW — Hygiene / Code Quality"
      )
    );
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  lines.push("---");
  lines.push("");
  lines.push(
    "*This report was generated automatically by the Vibe Code Market Security Auditor. " +
    "Findings are heuristic and may include false positives. Always perform manual review " +
    "before taking action based on this report.*"
  );
  lines.push("");

  return lines.join("\n");
}

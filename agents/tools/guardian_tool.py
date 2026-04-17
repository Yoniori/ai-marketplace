"""
─── Guardian Scan Tool (Python ↔ TypeScript bridge) ─────────────────────────

Wraps the existing SecurityGuardian (TypeScript, lib/security-auditor/) as a
CrewAI tool so the fullstack_coder agent can scan any code artifact before
returning it.

Flow:
  1. Agent calls  guardian_scan(code=..., filename="proposed-Navbar.tsx")
  2. Tool writes code to an ephemeral temp file.
  3. Tool shells out to `npx tsx scripts/guardian-scan-file.ts <path>` from
     the repository root.
  4. The TS CLI runs the full SecurityGuardian pipeline, emits a JSON summary
     on stdout, exits non-zero if CRITICAL or HIGH findings exist.
  5. Tool returns the JSON to the agent, who must iterate if findings exist.

This is the only sanctioned Guardian gate — do not replace with a mock.
"""

from __future__ import annotations

import json
import os
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Type

from crewai.tools import BaseTool
from pydantic import BaseModel, Field


# ── Resolve repo root: agents/tools/guardian_tool.py → agents/ → repo root ──
REPO_ROOT = Path(__file__).resolve().parents[2]
SCANNER_CLI = "scripts/guardian-scan-file.ts"
SCAN_TIMEOUT_SEC = 90


class GuardianScanInput(BaseModel):
    code: str = Field(
        ...,
        description=(
            "The full source code to scan. Pass the COMPLETE file contents, "
            "not a snippet — the scanner analyses the file as a whole."
        ),
    )
    filename: str = Field(
        ...,
        description=(
            "A synthetic filename with the correct extension, e.g. "
            "'proposed-Navbar.tsx', 'proposed-route.ts', 'proposed-query.sql'. "
            "The extension tells the scanner which rules to apply."
        ),
    )


class GuardianScanTool(BaseTool):
    name: str = "guardian_scan"
    description: str = (
        "Run the SecurityGuardian static analyzer on a proposed code artifact. "
        "Returns a JSON summary with overallRisk, totalFindings, and each "
        "finding's severity/category/title/recommendation. "
        "You MUST call this on every file you generate. If the result contains "
        "any finding with severity CRITICAL or HIGH, you MUST rewrite the code "
        "to remediate the finding and scan again. Do not return a final answer "
        "while CRITICAL or HIGH findings exist."
    )
    args_schema: Type[BaseModel] = GuardianScanInput

    def _run(self, code: str, filename: str) -> str:
        # Guard against path-traversal in the filename — we only use the basename.
        safe_name = os.path.basename(filename) or "proposed-file.txt"
        tmp_path = Path(tempfile.gettempdir()) / f"crew-guardian-{uuid.uuid4().hex}-{safe_name}"

        try:
            tmp_path.write_text(code, encoding="utf-8")

            result = subprocess.run(
                ["npx", "tsx", SCANNER_CLI, str(tmp_path)],
                cwd=str(REPO_ROOT),
                capture_output=True,
                text=True,
                timeout=SCAN_TIMEOUT_SEC,
            )

            # The CLI always emits a JSON summary on stdout, even when exit=1
            # (it exits non-zero purely to signal the presence of CRITICAL/HIGH).
            stdout = (result.stdout or "").strip()
            if stdout:
                return stdout

            stderr = (result.stderr or "").strip() or "Guardian CLI produced no output"
            return json.dumps({"error": stderr, "exitCode": result.returncode})

        except subprocess.TimeoutExpired:
            return json.dumps({
                "error": f"Guardian scan timed out after {SCAN_TIMEOUT_SEC}s",
                "filename": safe_name,
            })
        except FileNotFoundError:
            return json.dumps({
                "error": "npx not found — ensure Node.js is installed and on PATH",
            })
        except Exception as exc:  # pylint: disable=broad-except
            return json.dumps({"error": f"Guardian tool crashed: {exc!s}"})
        finally:
            try:
                tmp_path.unlink()
            except OSError:
                pass


# Singleton the crew imports.
guardian_scan = GuardianScanTool()

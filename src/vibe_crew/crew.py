"""
─── src/vibe_crew/crew.py — CrewAI Cloud discovery shim ─────────────────────

The CrewAI Cloud deployer inspects this file path to confirm the project
contains a crew module. The real `@CrewBase` class lives in
`agents/crews/vibe_crew.py` (the canonical local development location).

This shim:
  1. Adds the `agents/` directory to sys.path so its modules import cleanly.
  2. Re-exports the VibeCrew class and a `crew()` factory.

Keeping the authored code in `agents/` prevents duplication and keeps the
local development ergonomics intact (a single source of truth for the crew
definition, YAML configs, and custom tools).
"""

from __future__ import annotations

import sys
from pathlib import Path

# ── Make the authored crew package importable ────────────────────────────────
_REPO_ROOT = Path(__file__).resolve().parents[2]
_AGENTS_DIR = _REPO_ROOT / "agents"
if str(_AGENTS_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENTS_DIR))

# ── Re-export the canonical VibeCrew ─────────────────────────────────────────
from crews.vibe_crew import VibeCrew  # noqa: E402


def crew():
    """Factory returning a configured Crew instance — used by CrewAI runners."""
    return VibeCrew().crew()


__all__ = ["VibeCrew", "crew"]

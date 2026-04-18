"""
─── src/vibe_crew/crew.py — CrewAI Cloud discovery shim ─────────────────────

The CrewAI Cloud deployer requires this exact project layout:

    src/vibe_crew/
      __init__.py
      crew.py            ← this file
      main.py
      config/
        agents.yaml      ← canonical YAML location (read at runtime)
        tasks.yaml

The authored `@CrewBase` class lives in `agents/crews/vibe_crew.py`. This
file is a thin shim that:

  1. Adds the `agents/` directory to sys.path so its modules import.
  2. Re-exports VibeCrew and a `crew()` factory.

Runtime config resolution (defined in agents/crews/vibe_crew.py):
    prefer  src/vibe_crew/config/*.yaml   (present in every deploy bundle)
    fall back to  agents/config/*.yaml    (legacy, local dev only)

This means production always reads from `src/vibe_crew/config/`, which is
what the CrewAI Cloud deployer inspects and what ships inside the wheel.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# ── Earliest-possible env diagnostics ────────────────────────────────────────
#
# This runs BEFORE the authored crew package is imported, so the very first
# lines in the CrewAI Cloud deploy log show us whether the required keys
# actually reached the Python runtime. We deliberately print only the
# length — never the value — so this is safe to leave in production.
#
# If `length=0` here, no amount of deeper wiring can save us: the secret
# never made it from the CrewAI Cloud dashboard into the worker process.
# That is a platform-config problem, not a code problem.
for _k in ("ANTHROPIC_API_KEY", "OPENAI_API_KEY"):
    _v = os.environ.get(_k, "")
    print(
        f"[vibe_crew.shim] {_k}: present={bool(_v)} "
        f"length={len(_v)} stripped_length={len(_v.strip())}",
        flush=True,
    )

# ── Make the authored crew package importable ────────────────────────────────
_HERE       = Path(__file__).resolve()
_REPO_ROOT  = _HERE.parents[2]
_AGENTS_DIR = _REPO_ROOT / "agents"
if str(_AGENTS_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENTS_DIR))

# ── Re-export the canonical VibeCrew ─────────────────────────────────────────
from crews.vibe_crew import VibeCrew  # noqa: E402


def crew():
    """Factory returning a configured Crew instance — used by CrewAI runners."""
    return VibeCrew().crew()


# ── Production sanity check ──────────────────────────────────────────────────
# The deployer requires src/vibe_crew/config/ to exist. If it doesn't (e.g. a
# partial checkout), fail loud rather than silently falling back.
_CONFIG_DIR = _HERE.parent / "config"
if not (_CONFIG_DIR / "agents.yaml").exists() or not (_CONFIG_DIR / "tasks.yaml").exists():
    raise FileNotFoundError(
        f"CrewAI Cloud canonical config missing at {_CONFIG_DIR}. "
        "Expected agents.yaml and tasks.yaml inside src/vibe_crew/config/."
    )


__all__ = ["VibeCrew", "crew"]

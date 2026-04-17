"""
─── src/vibe_crew/main.py — CrewAI Cloud CLI entrypoint ─────────────────────

Exposes `run()` as the deployable entry point (registered under
`[project.scripts]` in the root pyproject.toml). The CrewAI runner invokes
this function with the user's brief.

For local development, prefer `python agents/main.py "<brief>"`.
"""

from __future__ import annotations

import sys

from .crew import VibeCrew


def run(brief: str | None = None) -> None:
    """Kick off the crew with the given brief (or prompt for one)."""
    if brief is None:
        brief = " ".join(sys.argv[1:]).strip() or ""
    if not brief:
        try:
            brief = input("Brief: ").strip()
        except EOFError:
            brief = ""
    if not brief:
        print("No brief provided. Exiting.", file=sys.stderr)
        sys.exit(1)

    crew = VibeCrew().crew()
    result = crew.kickoff(inputs={"brief": brief})
    print("\n═══════════════════  FINAL CREW OUTPUT  ═══════════════════\n")
    print(result)


def train() -> None:
    """Reserved for CrewAI training hooks; not yet implemented."""
    raise NotImplementedError("Training harness is not configured for this crew.")


if __name__ == "__main__":
    run()

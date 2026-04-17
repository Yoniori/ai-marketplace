"""
─── Vibe Code Market — Crew Entry Point ─────────────────────────────────────

Usage:
    python main.py "Ship a creator-earnings dashboard showing 30-day revenue"

Or interactively:
    python main.py
    Brief: <type your brief>

The brief is piped into the crew as the `{brief}` placeholder in tasks.yaml.
"""

from __future__ import annotations

import sys
from pathlib import Path

from dotenv import load_dotenv

# Ensure `crews/` and `tools/` are importable when run from anywhere.
sys.path.insert(0, str(Path(__file__).parent))

# Load .env from the agents/ folder (API keys, model overrides).
load_dotenv(Path(__file__).parent / ".env")

from crews.vibe_crew import VibeCrew  # noqa: E402  (import after sys.path tweak)


BANNER = """
╔══════════════════════════════════════════════════════════════╗
║  🛸  VIBE CODE MARKET — AGENTIC ORGANIZATION                  ║
║      CEO (Claude 3.5 Sonnet)  +  6 workers (GPT-4o Mini)      ║
║      Guardian gate: ACTIVE                                    ║
╚══════════════════════════════════════════════════════════════╝
"""


def run(brief: str) -> None:
    print(BANNER)
    print(f"  Brief: {brief}\n")

    crew = VibeCrew().crew()
    result = crew.kickoff(inputs={"brief": brief})

    print("\n═══════════════════  FINAL CREW OUTPUT  ═══════════════════\n")
    print(result)


def main() -> None:
    if len(sys.argv) > 1:
        brief = " ".join(sys.argv[1:])
    else:
        try:
            brief = input("Brief: ").strip()
        except EOFError:
            brief = ""
    if not brief:
        print("No brief provided. Exiting.", file=sys.stderr)
        sys.exit(1)
    run(brief)


if __name__ == "__main__":
    main()

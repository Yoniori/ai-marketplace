"""
─── vibe_crew — CrewAI Cloud package shim ───────────────────────────────────

This package exists purely to satisfy the CrewAI Cloud deployer's expected
project layout (`src/<crew>/crew.py`). The canonical crew definition lives
in `agents/crews/vibe_crew.py` and is re-exported here.
"""

from .crew import VibeCrew  # noqa: F401

__all__ = ["VibeCrew"]

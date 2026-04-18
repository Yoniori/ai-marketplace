"""
─── Vibe Code Market — Hierarchical Crew Wiring ─────────────────────────────

Builds the agentic organization from YAML definitions:

  • CEO (Claude 3.5 Sonnet) as the explicit manager_agent
  • 6 worker agents (GPT-4o Mini) across Design, Dev, Marketing teams
  • Task pipeline chained via `context:` so dependency order is enforced
  • Fullstack coder is wired with the SecurityGuardian bridge tool

The process is `Process.hierarchical` — the CEO delegates tasks to workers,
reviews outputs, and may re-delegate if quality is insufficient.
"""

from __future__ import annotations

import os
import traceback
from pathlib import Path

from crewai import LLM, Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

from tools.guardian_tool import guardian_scan


# ─── Model routing (env overrides permitted) ─────────────────────────────────
CEO_MODEL    = os.getenv("CEO_MODEL",    "anthropic/claude-3-5-sonnet-20241022")
WORKER_MODEL = os.getenv("WORKER_MODEL", "openai/gpt-4o-mini")


# ─── API key resolution (eager, explicit) ────────────────────────────────────
#
# CrewAI's bare-string `llm=...` shorthand defers LLM construction until the
# first task runs, which is where we were catching the "ANTHROPIC_API_KEY is
# required" error on CrewAI Cloud — the env var hadn't propagated into the
# worker subprocess by that late binding point.
#
# We resolve the keys AT IMPORT TIME and pass them explicitly into `LLM(...)`
# so the binding is deterministic. Missing-key failures surface immediately in
# the deploy log rather than three stack frames into the first task.
_ANTHROPIC_KEY = (os.getenv("ANTHROPIC_API_KEY") or "").strip() or None
_OPENAI_KEY    = (os.getenv("OPENAI_API_KEY")    or "").strip() or None

# Some downstream SDKs still read from os.environ. Normalise both locations so
# either access path finds the same (stripped) value.
if _ANTHROPIC_KEY: os.environ["ANTHROPIC_API_KEY"] = _ANTHROPIC_KEY
if _OPENAI_KEY:    os.environ["OPENAI_API_KEY"]    = _OPENAI_KEY

# Visible at the top of every crew run. We print *length only* (never the
# value) so CrewAI Cloud logs are safe to share, but we still get enough
# signal to tell "env var missing" from "env var present but malformed".
print(
    f"[vibe_crew] ANTHROPIC_API_KEY present={bool(_ANTHROPIC_KEY)} "
    f"length={len(os.environ.get('ANTHROPIC_API_KEY', ''))} "
    f"stripped_length={len((_ANTHROPIC_KEY or ''))}",
    flush=True,
)
print(
    f"[vibe_crew] OPENAI_API_KEY    present={bool(_OPENAI_KEY)} "
    f"length={len(os.environ.get('OPENAI_API_KEY', ''))} "
    f"stripped_length={len((_OPENAI_KEY or ''))}",
    flush=True,
)
if not _ANTHROPIC_KEY or not _OPENAI_KEY:
    print(
        "[vibe_crew] WARNING: one or more required API keys are missing — the "
        "crew will fail on the first task. Set ANTHROPIC_API_KEY and "
        "OPENAI_API_KEY under CrewAI Cloud → Environment Variables, then "
        "redeploy.",
        flush=True,
    )

# Explicit LLM objects — one per provider. CrewAI's Agent constructor accepts
# an LLM instance via the `llm=` kwarg, and that kwarg overrides whatever
# `llm:` string lives in the YAML config dict we also pass in.
#
# We wrap each constructor in a try/except that prints the full traceback
# to stdout before re-raising, so the CrewAI Cloud deploy log captures the
# WHY of an init failure (missing key / bad model name / litellm import
# error / etc) — not just the final "ANTHROPIC_API_KEY is required" line
# several frames deep in the stack.
def _init_llm(model: str, api_key: str | None, label: str) -> LLM:
    try:
        llm = LLM(model=model, api_key=api_key)
        print(
            f"[vibe_crew] {label} initialised ok (model={model}, "
            f"api_key_bound={bool(api_key)})",
            flush=True,
        )
        return llm
    except Exception as exc:  # surface the real reason, then re-raise
        print(
            f"[vibe_crew] ERROR initialising {label} "
            f"(model={model}, api_key_bound={bool(api_key)}): "
            f"{type(exc).__name__}: {exc}",
            flush=True,
        )
        traceback.print_exc()
        raise

CEO_LLM    = _init_llm(CEO_MODEL,    _ANTHROPIC_KEY, "CEO_LLM")
WORKER_LLM = _init_llm(WORKER_MODEL, _OPENAI_KEY,    "WORKER_LLM")

# ─── Config paths (absolute so resolution is stable across CWDs) ─────────────
#
# CrewAI Cloud expects YAMLs at the canonical src/vibe_crew/config/ location.
# We prefer that path when present (the deploy bundle always ships it) and
# fall back to the authored location in agents/config/ for purely-local
# development where the canonical copy may not yet be populated.
_HERE      = Path(__file__).resolve()
_REPO_ROOT = _HERE.parents[2]                                # repo root
_CANONICAL = _REPO_ROOT / "src" / "vibe_crew" / "config"     # CrewAI Cloud layout
_LEGACY    = _HERE.parent.parent / "config"                  # agents/config/

_CONFIG_DIR = _CANONICAL if (_CANONICAL / "agents.yaml").exists() else _LEGACY


@CrewBase
class VibeCrew:
    """Vibe Code Market's agentic organization."""

    agents_config = str(_CONFIG_DIR / "agents.yaml")
    tasks_config  = str(_CONFIG_DIR / "tasks.yaml")

    # ─── Manager ────────────────────────────────────────────────────────────
    @agent
    def ceo(self) -> Agent:
        return Agent(
            config=self.agents_config["ceo"],
            llm=CEO_LLM,
            allow_delegation=True,
            verbose=True,
        )

    # ─── Design Team ────────────────────────────────────────────────────────
    @agent
    def creative_director(self) -> Agent:
        return Agent(
            config=self.agents_config["creative_director"],
            llm=WORKER_LLM,
            allow_delegation=False,
            verbose=True,
        )

    @agent
    def interface_specialist(self) -> Agent:
        return Agent(
            config=self.agents_config["interface_specialist"],
            llm=WORKER_LLM,
            allow_delegation=False,
            verbose=True,
        )

    # ─── Dev Team ───────────────────────────────────────────────────────────
    @agent
    def system_architect(self) -> Agent:
        return Agent(
            config=self.agents_config["system_architect"],
            llm=WORKER_LLM,
            allow_delegation=False,
            verbose=True,
        )

    @agent
    def fullstack_coder(self) -> Agent:
        # The ONLY agent with Guardian access. Every code artifact it produces
        # must pass through guardian_scan before the task is marked complete.
        return Agent(
            config=self.agents_config["fullstack_coder"],
            llm=WORKER_LLM,
            tools=[guardian_scan],
            allow_delegation=False,
            verbose=True,
        )

    # ─── Marketing Team ─────────────────────────────────────────────────────
    @agent
    def growth_strategist(self) -> Agent:
        return Agent(
            config=self.agents_config["growth_strategist"],
            llm=WORKER_LLM,
            allow_delegation=False,
            verbose=True,
        )

    @agent
    def copywriter(self) -> Agent:
        return Agent(
            config=self.agents_config["copywriter"],
            llm=WORKER_LLM,
            allow_delegation=False,
            verbose=True,
        )

    # ─── Tasks ──────────────────────────────────────────────────────────────
    @task
    def brand_direction(self) -> Task:
        return Task(config=self.tasks_config["brand_direction"])

    @task
    def ui_specification(self) -> Task:
        return Task(config=self.tasks_config["ui_specification"])

    @task
    def system_architecture(self) -> Task:
        return Task(config=self.tasks_config["system_architecture"])

    @task
    def implementation(self) -> Task:
        return Task(config=self.tasks_config["implementation"])

    @task
    def growth_plan(self) -> Task:
        return Task(config=self.tasks_config["growth_plan"])

    @task
    def launch_copy(self) -> Task:
        return Task(config=self.tasks_config["launch_copy"])

    # ─── Crew ───────────────────────────────────────────────────────────────
    @crew
    def crew(self) -> Crew:
        # IMPORTANT: the CEO is NOT in the `agents` list — they are the
        # explicit manager_agent. CrewAI requires manager and workers to be
        # distinct in hierarchical mode.
        log_dir = Path(__file__).resolve().parents[1] / "logs"
        log_dir.mkdir(exist_ok=True)

        return Crew(
            agents=[
                self.creative_director(),
                self.interface_specialist(),
                self.system_architect(),
                self.fullstack_coder(),
                self.growth_strategist(),
                self.copywriter(),
            ],
            tasks=self.tasks,              # populated by @task decorators
            process=Process.hierarchical,
            manager_agent=self.ceo(),
            verbose=True,
            output_log_file=str(log_dir / "crew.log"),
        )

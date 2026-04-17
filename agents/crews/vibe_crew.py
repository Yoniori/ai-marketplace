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
from pathlib import Path

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

from tools.guardian_tool import guardian_scan


# ─── Model routing (env overrides permitted) ─────────────────────────────────
CEO_MODEL    = os.getenv("CEO_MODEL",    "anthropic/claude-3-5-sonnet-20241022")
WORKER_MODEL = os.getenv("WORKER_MODEL", "openai/gpt-4o-mini")

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
            llm=CEO_MODEL,
            allow_delegation=True,
            verbose=True,
        )

    # ─── Design Team ────────────────────────────────────────────────────────
    @agent
    def creative_director(self) -> Agent:
        return Agent(
            config=self.agents_config["creative_director"],
            llm=WORKER_MODEL,
            allow_delegation=False,
            verbose=True,
        )

    @agent
    def interface_specialist(self) -> Agent:
        return Agent(
            config=self.agents_config["interface_specialist"],
            llm=WORKER_MODEL,
            allow_delegation=False,
            verbose=True,
        )

    # ─── Dev Team ───────────────────────────────────────────────────────────
    @agent
    def system_architect(self) -> Agent:
        return Agent(
            config=self.agents_config["system_architect"],
            llm=WORKER_MODEL,
            allow_delegation=False,
            verbose=True,
        )

    @agent
    def fullstack_coder(self) -> Agent:
        # The ONLY agent with Guardian access. Every code artifact it produces
        # must pass through guardian_scan before the task is marked complete.
        return Agent(
            config=self.agents_config["fullstack_coder"],
            llm=WORKER_MODEL,
            tools=[guardian_scan],
            allow_delegation=False,
            verbose=True,
        )

    # ─── Marketing Team ─────────────────────────────────────────────────────
    @agent
    def growth_strategist(self) -> Agent:
        return Agent(
            config=self.agents_config["growth_strategist"],
            llm=WORKER_MODEL,
            allow_delegation=False,
            verbose=True,
        )

    @agent
    def copywriter(self) -> Agent:
        return Agent(
            config=self.agents_config["copywriter"],
            llm=WORKER_MODEL,
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

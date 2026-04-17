# Vibe Code Market — Agentic Organization

A CrewAI-powered multi-agent system for the Vibe Code Market codebase.
One CEO-manager, six worker agents, one non-negotiable security gate.

```
                ┌─────────────────────────────────────┐
                │           CEO (Manager)             │
                │      Claude 3.5 Sonnet              │
                │   "Visionary Founder" — delegates   │
                └──────────────┬──────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
  ┌──────────┐           ┌──────────┐           ┌──────────┐
  │  DESIGN  │           │   DEV    │           │MARKETING │
  └────┬─────┘           └────┬─────┘           └────┬─────┘
       │                      │                      │
 creative_director      system_architect      growth_strategist
 interface_specialist   fullstack_coder       copywriter
                             │
                             ▼
                   ┌──────────────────┐
                   │ SecurityGuardian │  ← TS bridge (non-negotiable)
                   └──────────────────┘

       All workers: GPT-4o Mini (cost-optimized execution)
```

## How it works

Tasks chain via CrewAI `context:` dependencies:

```
brand_direction ─► ui_specification ─► system_architecture
                                        └► implementation ──► growth_plan
                                            (Guardian gate)       └► launch_copy
```

The CEO reviews every handoff and can re-delegate. The `fullstack_coder` is
the only agent with Guardian access — it MUST invoke `guardian_scan` on every
file it generates before the `implementation` task can complete. CRITICAL and
HIGH findings fail the gate and force a rewrite.

## Setup

```bash
cd agents
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Then edit .env and paste your ANTHROPIC_API_KEY and OPENAI_API_KEY
```

## Run

```bash
# From the agents/ folder, with the venv active:
python main.py "Ship a creator-earnings widget showing 30-day revenue"

# Or interactively:
python main.py
Brief: <type the brief>
```

## The Python ↔ TypeScript bridge

The Guardian gate is enforced through a real code path, not a prompt
instruction:

1. `agents/tools/guardian_tool.py` exposes `guardian_scan` to the agent.
2. The tool writes the proposed code to a temp file.
3. It shells out to `npx tsx scripts/guardian-scan-file.ts <path>` from the
   repo root.
4. The TS CLI runs the full rule pipeline from `lib/security-auditor/` and
   emits a JSON summary. Exit code 1 when CRITICAL or HIGH findings exist.
5. The JSON goes back to the agent, which must iterate if the gate failed.

Node.js must be on `PATH` for the bridge to work — the agent uses the same
toolchain the rest of the repo uses.

## Files

| Path | Role |
|------|------|
| `config/agents.yaml` | Agent DNA — role, goal, backstory, LLM routing |
| `config/tasks.yaml`  | Task pipeline with `context:` dependency chain |
| `crews/vibe_crew.py` | `@CrewBase` wiring: hierarchical process, CEO as `manager_agent` |
| `tools/guardian_tool.py` | CrewAI `BaseTool` that shells out to the TS scanner |
| `main.py` | CLI entry point |
| `requirements.txt` | Python dependencies |
| `.env.example` | Template for provider keys |

## Frozen files (never modified by Dev agents)

The System Architect's task description explicitly forbids proposing
changes to the security-hardened API routes:

- `app/api/github/callback/route.ts` (CSRF)
- `app/api/discover/route.ts` (auth guard)
- `app/api/webhooks/stripe/route.ts` (idempotency)
- `app/api/listings/[id]/check/route.ts` (key logging)
- `app/api/profiles/me/route.ts` (HTTPS validation)
- `app/api/payments/checkout/route.ts` (price bounds)
- `lib/listing-check/worker.ts`

If a proposed feature would require touching any of these, the architect
escalates to the CEO instead of including them in the change list.

## Cost model

| Agent | Model | Reason |
|-------|-------|--------|
| CEO | `anthropic/claude-3-5-sonnet-20241022` | Strategic judgment, delegation quality, taste |
| Workers (×6) | `openai/gpt-4o-mini` | High-volume execution, cost-optimized |

Override either via env: `CEO_MODEL=...`, `WORKER_MODEL=...`.

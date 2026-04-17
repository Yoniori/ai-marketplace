"use server";

export interface AgentResult {
  executionId?: string;
  result?: unknown;
  error?: string;
}

export async function runAgents(prompt: string): Promise<AgentResult> {
  const base = process.env.CREWAI_API_URL;
  const token = process.env.CREWAI_BEARER_TOKEN;

  if (!base || !token) {
    return { error: "CREWAI_API_URL and CREWAI_BEARER_TOKEN must be set in environment variables." };
  }

  // CrewAI Cloud's run endpoint is POST <base>/kickoff. Be defensive against
  // the env var already including the suffix (with or without a trailing slash).
  const trimmed = base.replace(/\/+$/, "");
  const url = /\/kickoff$/.test(trimmed) ? trimmed : `${trimmed}/kickoff`;

  // The `inputs` object keys must match the placeholders in tasks.yaml.
  // Our crew templates use `{brief}` — do not change this key without
  // updating agents/config/tasks.yaml and src/vibe_crew/config/tasks.yaml.
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ inputs: { brief: prompt } }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { error: `CrewAI API error ${res.status}: ${text}` };
    }

    const data = (await res.json()) as AgentResult;
    return data;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

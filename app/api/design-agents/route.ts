// ─── POST /api/design-agents ────────────────────────────────────────────────
//
// Runs the native 6-stage design pipeline end-to-end in the Next.js runtime,
// streaming progress back to the client as newline-delimited JSON
// (application/x-ndjson).
//
// Request body: { "topic": string }
// Response:     a stream of `PipelineEvent` objects, one per line.
//
// This endpoint replaces the old CrewAI Cloud kickoff + polling flow.
// Everything runs in-process against process.env.ANTHROPIC_API_KEY.

import type { NextRequest } from "next/server";

import { runPipeline, type PipelineEvent } from "@/lib/design-agents/pipeline";

// Six sequential LLM calls can legitimately take longer than the default
// 10s/60s Vercel function timeout — raise the ceiling. Requires Vercel Pro
// or higher at runtime; harmless on Hobby (will clamp to 60s).
export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  topic?: unknown;
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  // ── Credential check ─────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return jsonError(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (local dev) or the deployment environment and restart.",
      500,
    );
  }

  // ── Input validation ─────────────────────────────────────────────────────
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  if (!topic) {
    return jsonError("`topic` is required and must be a non-empty string.", 400);
  }
  if (topic.length > 8_000) {
    return jsonError("`topic` must be 8000 characters or fewer.", 400);
  }

  // ── Streaming response ───────────────────────────────────────────────────
  //
  // We forward each PipelineEvent as a single NDJSON line. One event per
  // line keeps the client parser trivial (split on '\n', JSON.parse each
  // non-empty line) and avoids any framing protocol.
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (event: PipelineEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        for await (const event of runPipeline(topic, { signal: req.signal })) {
          write(event);
        }
      } catch (err) {
        // This catches anything the generator didn't already convert into a
        // typed `error` event — e.g. provider module import failures.
        write({
          type: "error",
          message: err instanceof Error ? err.message : "Unknown pipeline error",
        });
      } finally {
        controller.close();
      }
    },
    cancel() {
      // The `req.signal` passed into runPipeline takes care of aborting the
      // in-flight LLM call when the client disconnects — nothing else to
      // clean up here.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      // Disable proxy / edge buffering so deltas stream in real time.
      "X-Accel-Buffering": "no",
    },
  });
}

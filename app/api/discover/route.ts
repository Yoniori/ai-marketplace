import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const MAX_QUERY_LENGTH = 300; // prevent prompt injection / token abuse

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────
  // Require a logged-in user — unauthenticated callers should not be
  // able to trigger OpenAI calls and exhaust the project's API budget.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query } = (await request.json()) as { query?: string };
  if (!query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `query must be ${MAX_QUERY_LENGTH} characters or fewer` },
      { status: 400 }
    );
  }
  // Fetch up to 40 published listings for context
  const { data: listings } = await (supabase as any)
    .from("listings")
    .select("id, slug, title, tagline, price_type, price_cents, currency, categories(name)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(40);

  const catalog = (listings ?? []).map((l: any) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    tagline: l.tagline,
    price: l.price_type === "free" ? "free" : `$${(l.price_cents / 100).toFixed(2)}`,
    category: l.categories?.name ?? "Other",
  }));

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a helpful marketplace assistant for Vibe Code Market — a marketplace for AI-built apps and tools.
You help users find the right product based on their needs.
Here is the current catalog in JSON:
${JSON.stringify(catalog, null, 2)}

When the user describes what they need, recommend 1–3 relevant products from the catalog.
Format your response as friendly markdown with product names as bold links like **[Product Name](/listing/slug)**.
If nothing matches, say so and suggest they browse by category.
Keep responses under 120 words.`,
      },
      { role: "user", content: query },
    ],
    max_tokens: 200,
    temperature: 0.4,
  });

  const message =
    completion.choices[0]?.message?.content ??
    "I couldn't find a match. Try browsing the marketplace!";
  return NextResponse.json({ message });
}

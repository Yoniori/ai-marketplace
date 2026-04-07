import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { query } = (await request.json()) as { query?: string };
  if (!query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const supabase = await createClient();
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

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { description } = await req.json();
  if (!description?.trim()) {
    return NextResponse.json({ error: "No description provided" }, { status: 400 });
  }

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `You are a nutrition expert. Estimate macros for the meal described. Return ONLY valid JSON, no markdown:
{
  "name": "<meal name>",
  "mealType": "<breakfast|lunch|dinner|snack>",
  "calories": <integer>,
  "proteinG": <integer>,
  "carbsG": <integer>,
  "fatG": <integer>
}

Rules:
- Use realistic average serving sizes
- mealType: infer from context; default to "lunch" if unclear
- Be conservative and accurate; do not overestimate
- All numeric values must be integers`,
    messages: [{ role: "user", content: description }],
  });

  try {
    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    const cleaned = raw.replace(/```(?:json)?\n?|\n?```/g, "").trim();
    const data = JSON.parse(cleaned);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to estimate macros" }, { status: 500 });
  }
}

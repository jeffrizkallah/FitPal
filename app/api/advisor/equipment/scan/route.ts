import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { image, mediaType } = await req.json() as {
    image: string;
    mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  };

  if (!image || !mediaType) {
    return NextResponse.json({ error: "Missing image or mediaType" }, { status: 400 });
  }

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: image },
          },
          {
            type: "text",
            text: `Identify all gym equipment visible in this image. For each item, provide a name and category.

Return ONLY a valid JSON array — no markdown, no explanation, no backticks:
[
  { "name": "equipment name", "category": "free_weights" | "machines" | "cables" | "cardio" | "bodyweight" | "resistance_bands" }
]

Guidelines:
- Be specific with names (e.g. "Barbell" not "weight", "Cable crossover machine" not "machine")
- If multiple of the same item exist, list it once
- Only include actual gym equipment, not furniture or accessories
- If you cannot identify any gym equipment, return an empty array []`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No response from AI" }, { status: 500 });
  }

  const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return NextResponse.json([]);
  }

  const items = JSON.parse(jsonMatch[0]);
  return NextResponse.json(items);
}

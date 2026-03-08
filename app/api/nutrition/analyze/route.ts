import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { image, mediaType, refinement } = body as {
    image: string;
    mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    refinement?: string;
  };

  if (!image || !mediaType) {
    return NextResponse.json(
      { error: "Missing image or mediaType" },
      { status: 400 }
    );
  }

  const refinementText = refinement
    ? `\n\nAdditional context from the user: "${refinement}". Factor this into your analysis.`
    : "";

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
            text: `Analyze this food image and estimate its nutritional content.${refinementText}

Return ONLY a valid JSON object — no markdown, no explanation, no backticks. Use this exact structure:
{
  "name": "concise descriptive meal name",
  "mealType": "breakfast" | "lunch" | "dinner" | "snack",
  "calories": integer,
  "proteinG": integer,
  "carbsG": integer,
  "fatG": integer,
  "items": [
    { "name": "item name", "calories": integer, "proteinG": integer, "carbsG": integer, "fatG": integer }
  ]
}

Guidelines:
- Be realistic with estimates, not aspirational
- Infer mealType from food content (eggs/toast → breakfast, sandwich → lunch, etc.)
- If you cannot clearly identify food in the image, make your best estimate
- Round all numbers to the nearest integer
- Items array should list the individual components of the meal`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No response from AI" }, { status: 500 });
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json(
      { error: "Could not parse AI response" },
      { status: 500 }
    );
  }

  const data = JSON.parse(jsonMatch[0]);
  return NextResponse.json(data);
}

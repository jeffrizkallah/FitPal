import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET — return the user's saved gym coordinates
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db
    .select({ gymLatitude: users.gymLatitude, gymLongitude: users.gymLongitude })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return NextResponse.json({
    gymLatitude: user?.gymLatitude ?? null,
    gymLongitude: user?.gymLongitude ?? null,
  });
}

// POST — save current GPS coords as gym location
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { latitude, longitude } = await req.json();
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ gymLatitude: latitude, gymLongitude: longitude })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}

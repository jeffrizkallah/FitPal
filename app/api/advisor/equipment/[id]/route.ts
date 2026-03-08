import { auth } from "@/auth";
import { db } from "@/db";
import { gymEquipment } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db
    .delete(gymEquipment)
    .where(and(eq(gymEquipment.id, id), eq(gymEquipment.userId, session.user.id)));

  return NextResponse.json({ success: true });
}

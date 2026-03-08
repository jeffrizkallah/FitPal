import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import BottomNav from "@/components/nav/BottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Check onboarding status
  const user = await db
    .select({ onboardingDone: users.onboardingDone })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  // New user — send to onboarding
  if (!user[0] || !user[0].onboardingDone) {
    redirect("/onboarding");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-24 pt-safe">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

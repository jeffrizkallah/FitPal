import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import BottomNav from "@/components/nav/BottomNav";
import PageTransition from "@/components/PageTransition";
import { WorkoutSessionProvider } from "@/contexts/WorkoutSessionContext";
import WorkoutIsland from "@/components/workout/WorkoutIsland";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;

  const user = await db
    .select({ onboardingDone: users.onboardingDone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user[0] || !user[0].onboardingDone) {
    redirect("/onboarding");
  }

  return (
    <WorkoutSessionProvider>
      <div className="flex flex-col min-h-screen">
        <WorkoutIsland />
        <main className="flex-1 pb-24 pt-safe">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomNav />
      </div>
    </WorkoutSessionProvider>
  );
}

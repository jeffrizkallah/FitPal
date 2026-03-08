import { redirect } from "next/navigation";
import ActiveWorkout from "@/components/workout/ActiveWorkout";

export default async function ActiveWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const { sessionId } = await searchParams;
  if (!sessionId) redirect("/workout");

  return <ActiveWorkout sessionId={sessionId} />;
}

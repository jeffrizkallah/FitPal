"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MealCard from "./MealCard";

interface Meal {
  id: string;
  name: string;
  mealType: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt: Date | string;
}

const DELETE_WIDTH = 80;
const SWIPE_THRESHOLD = 44;

export default function MealList({ meals: initialMeals }: { meals: Meal[] }) {
  const [meals, setMeals] = useState(initialMeals);
  const router = useRouter();

  async function handleDelete(id: string) {
    // Optimistic removal
    setMeals((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/nutrition/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {meals.map((meal) => (
        <SwipeableRow key={meal.id} onDelete={() => handleDelete(meal.id)}>
          <MealCard
            name={meal.name}
            mealType={meal.mealType}
            calories={meal.calories}
            proteinG={meal.proteinG}
            carbsG={meal.carbsG}
            fatG={meal.fatG}
            loggedAt={meal.loggedAt}
          />
        </SwipeableRow>
      ))}
    </div>
  );
}

function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  // Use a ref for offset so touch handlers always see the latest value
  const offsetRef = useRef(0);
  const [offset, setOffsetState] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);

  function setOffset(v: number) {
    offsetRef.current = v;
    setOffsetState(v);
  }

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startOffset.current = offsetRef.current;
    setIsDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current;
    const next = Math.min(0, Math.max(-DELETE_WIDTH, startOffset.current + dx));
    setOffset(next);
  }

  function onTouchEnd() {
    setIsDragging(false);
    setOffset(offsetRef.current < -SWIPE_THRESHOLD ? -DELETE_WIDTH : 0);
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Delete zone — revealed as card slides left */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: DELETE_WIDTH,
          backgroundColor: "#FF3B30",
          borderRadius: "0 1.5rem 1.5rem 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        onClick={onDelete}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 6H5H21M8 6V4C8 3.47 8.21 2.96 8.59 2.59C8.96 2.21 9.47 2 10 2H14C14.53 2 15.04 2.21 15.41 2.59C15.79 2.96 16 3.47 16 4V6M19 6V20C19 20.53 18.79 21.04 18.41 21.41C18.04 21.79 17.53 22 17 22H7C6.47 22 5.96 21.79 5.59 21.41C5.21 21.04 5 20.53 5 20V6H19Z"
            stroke="white"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Card — slides left on swipe */}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? "none" : "transform 0.25s ease-out",
          position: "relative",
          zIndex: 1,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

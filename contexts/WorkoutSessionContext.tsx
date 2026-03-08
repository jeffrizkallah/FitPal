"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type WorkoutSessionState = {
  isActive: boolean;
  sessionId: string | null;
  exerciseName: string | null;
  setNumber: number;
  targetSets: number;
  restTimeLeft: number; // -1 = no rest active
};

type WorkoutSessionContextValue = WorkoutSessionState & {
  startSession: (sessionId: string) => void;
  updateExercise: (name: string, setNumber: number, targetSets: number) => void;
  updateRestTimer: (seconds: number) => void;
  endSession: () => void;
};

const WorkoutSessionContext = createContext<WorkoutSessionContextValue | null>(null);

export function WorkoutSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkoutSessionState>({
    isActive: false,
    sessionId: null,
    exerciseName: null,
    setNumber: 1,
    targetSets: 3,
    restTimeLeft: -1,
  });

  const startSession = useCallback((sessionId: string) => {
    setState((s) => ({ ...s, isActive: true, sessionId }));
  }, []);

  const updateExercise = useCallback((name: string, setNumber: number, targetSets: number) => {
    setState((s) => ({ ...s, exerciseName: name, setNumber, targetSets }));
  }, []);

  const updateRestTimer = useCallback((seconds: number) => {
    setState((s) => ({ ...s, restTimeLeft: seconds }));
  }, []);

  const endSession = useCallback(() => {
    setState({
      isActive: false,
      sessionId: null,
      exerciseName: null,
      setNumber: 1,
      targetSets: 3,
      restTimeLeft: -1,
    });
  }, []);

  return (
    <WorkoutSessionContext.Provider
      value={{ ...state, startSession, updateExercise, updateRestTimer, endSession }}
    >
      {children}
    </WorkoutSessionContext.Provider>
  );
}

export function useWorkoutSession() {
  const ctx = useContext(WorkoutSessionContext);
  if (!ctx) throw new Error("useWorkoutSession must be used inside WorkoutSessionProvider");
  return ctx;
}

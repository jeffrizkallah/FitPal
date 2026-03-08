import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  pgEnum,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────
export const goalEnum = pgEnum("goal", [
  "lose_fat",
  "build_muscle",
  "maintain",
  "improve_endurance",
]);

export const activityLevelEnum = pgEnum("activity_level", [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
]);

export const muscleGroupEnum = pgEnum("muscle_group", [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "core",
  "glutes",
  "quads",
  "hamstrings",
  "calves",
  "full_body",
]);

export const mealTypeEnum = pgEnum("meal_type", [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

// ─── Users ────────────────────────────────────────────────
// clerkId is the primary key — no separate auth table needed
export const users = pgTable("users", {
  clerkId:       text("clerk_id").primaryKey(),
  email:         text("email").notNull().unique(),
  name:          text("name"),
  avatarUrl:     text("avatar_url"),
  // Biometrics
  ageYears:      integer("age_years"),
  heightCm:      real("height_cm"),
  weightKg:      real("weight_kg"),
  // Goals
  goal:          goalEnum("goal"),
  activityLevel: activityLevelEnum("activity_level"),
  // Calculated targets (stored for fast reads)
  targetCalories: integer("target_calories"),
  targetProteinG: integer("target_protein_g"),
  targetCarbsG:   integer("target_carbs_g"),
  targetFatG:     integer("target_fat_g"),
  // Onboarding
  onboardingDone: boolean("onboarding_done").default(false),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

// ─── Exercises ────────────────────────────────────────────
export const exercises = pgTable("exercises", {
  id:           uuid("id").defaultRandom().primaryKey(),
  name:         text("name").notNull(),
  muscleGroup:  muscleGroupEnum("muscle_group").notNull(),
  equipment:    text("equipment"),          // e.g. "barbell", "dumbbell", "bodyweight"
  instructions: text("instructions"),
  videoUrl:     text("video_url"),          // Cloudinary URL
  imageUrl:     text("image_url"),          // Cloudinary URL
  isCustom:     boolean("is_custom").default(false),
  createdBy:    text("created_by").references(() => users.clerkId),
});

// ─── Workout Plans ────────────────────────────────────────
export const workoutPlans = pgTable("workout_plans", {
  id:          uuid("id").defaultRandom().primaryKey(),
  userId:      text("user_id").notNull().references(() => users.clerkId, { onDelete: "cascade" }),
  name:        text("name").notNull(),
  description: text("description"),
  isActive:    boolean("is_active").default(false),
  aiGenerated: boolean("ai_generated").default(false),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});

// ─── Plan Exercises (exercises within a plan) ─────────────
export const planExercises = pgTable("plan_exercises", {
  id:           uuid("id").defaultRandom().primaryKey(),
  planId:       uuid("plan_id").notNull().references(() => workoutPlans.id, { onDelete: "cascade" }),
  exerciseId:   uuid("exercise_id").notNull().references(() => exercises.id),
  orderIndex:   integer("order_index").notNull(),
  targetSets:   integer("target_sets").notNull().default(3),
  targetReps:   integer("target_reps"),    // null = AMRAP
  targetWeightKg: real("target_weight_kg"),
  restSeconds:  integer("rest_seconds").default(90),
  notes:        text("notes"),
});

// ─── Workout Sessions ─────────────────────────────────────
export const workoutSessions = pgTable("workout_sessions", {
  id:          uuid("id").defaultRandom().primaryKey(),
  userId:      text("user_id").notNull().references(() => users.clerkId, { onDelete: "cascade" }),
  planId:      uuid("plan_id").references(() => workoutPlans.id),
  startedAt:   timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  durationMin: integer("duration_min"),
  notes:       text("notes"),
  aiSummary:   text("ai_summary"),          // AI-generated session summary
});

// ─── Logged Sets ──────────────────────────────────────────
export const loggedSets = pgTable("logged_sets", {
  id:          uuid("id").defaultRandom().primaryKey(),
  sessionId:   uuid("session_id").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId:  uuid("exercise_id").notNull().references(() => exercises.id),
  setNumber:   integer("set_number").notNull(),
  reps:        integer("reps"),
  weightKg:    real("weight_kg"),
  durationSec: integer("duration_sec"),     // for time-based exercises
  rpe:         integer("rpe"),              // Rate of Perceived Exertion 1-10
  loggedAt:    timestamp("logged_at").defaultNow().notNull(),
});

// ─── Meal Logs ────────────────────────────────────────────
export const mealLogs = pgTable("meal_logs", {
  id:         uuid("id").defaultRandom().primaryKey(),
  userId:     text("user_id").notNull().references(() => users.clerkId, { onDelete: "cascade" }),
  mealType:   mealTypeEnum("meal_type").notNull(),
  loggedAt:   timestamp("logged_at").defaultNow().notNull(),
  imageUrl:   text("image_url"),            // Cloudinary URL of food photo
  // AI-estimated nutrition
  name:       text("name").notNull(),       // e.g. "Grilled chicken with rice"
  calories:   integer("calories").notNull(),
  proteinG:   real("protein_g").notNull(),
  carbsG:     real("carbs_g").notNull(),
  fatG:       real("fat_g").notNull(),
  // Raw AI response for auditing
  aiRawData:  jsonb("ai_raw_data"),
});

// ─── Daily Summaries (materialized per day) ───────────────
export const dailySummaries = pgTable("daily_summaries", {
  id:              uuid("id").defaultRandom().primaryKey(),
  userId:          text("user_id").notNull().references(() => users.clerkId, { onDelete: "cascade" }),
  date:            text("date").notNull(),  // "YYYY-MM-DD"
  totalCalories:   integer("total_calories").default(0),
  totalProteinG:   real("total_protein_g").default(0),
  totalCarbsG:     real("total_carbs_g").default(0),
  totalFatG:       real("total_fat_g").default(0),
  workoutDoneMin:  integer("workout_done_min").default(0),
});

// ─── Advisor Messages ─────────────────────────────────────
export const advisorMessages = pgTable("advisor_messages", {
  id:        uuid("id").defaultRandom().primaryKey(),
  userId:    text("user_id").notNull().references(() => users.clerkId, { onDelete: "cascade" }),
  role:      text("role").notNull(),        // "user" | "assistant"
  content:   text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  workoutPlans:     many(workoutPlans),
  workoutSessions:  many(workoutSessions),
  mealLogs:         many(mealLogs),
  dailySummaries:   many(dailySummaries),
  advisorMessages:  many(advisorMessages),
}));

export const workoutPlansRelations = relations(workoutPlans, ({ one, many }) => ({
  user:     one(users, { fields: [workoutPlans.userId], references: [users.clerkId] }),
  exercises: many(planExercises),
  sessions:  many(workoutSessions),
}));

export const planExercisesRelations = relations(planExercises, ({ one }) => ({
  plan:     one(workoutPlans, { fields: [planExercises.planId], references: [workoutPlans.id] }),
  exercise: one(exercises, { fields: [planExercises.exerciseId], references: [exercises.id] }),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user: one(users, { fields: [workoutSessions.userId], references: [users.clerkId] }),
  plan: one(workoutPlans, { fields: [workoutSessions.planId], references: [workoutPlans.id] }),
  sets: many(loggedSets),
}));

export const mealLogsRelations = relations(mealLogs, ({ one }) => ({
  user: one(users, { fields: [mealLogs.userId], references: [users.clerkId] }),
}));

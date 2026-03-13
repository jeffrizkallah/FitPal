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
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccount } from "next-auth/adapters";

// ─── NextAuth.js tables (required by Drizzle adapter) ────
export const authUsers = pgTable("auth_users", {
  id:            text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:          text("name"),
  email:         text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image:         text("image"),
  // Hashed password for credentials provider
  password:      text("password"),
});

export const accounts = pgTable("accounts", {
  userId:            text("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  type:              text("type").$type<AdapterAccount["type"]>().notNull(),
  provider:          text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token:     text("refresh_token"),
  access_token:      text("access_token"),
  expires_at:        integer("expires_at"),
  token_type:        text("token_type"),
  scope:             text("scope"),
  id_token:          text("id_token"),
  session_state:     text("session_state"),
}, (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId:       text("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  expires:      timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token:      text("token").notNull(),
  expires:    timestamp("expires", { mode: "date" }).notNull(),
}, (t) => [primaryKey({ columns: [t.identifier, t.token] })]);

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

// ─── Users (app profile — linked to authUsers) ───────────
export const users = pgTable("users", {
  id:            text("id").primaryKey().references(() => authUsers.id, { onDelete: "cascade" }),
  // Display name (can differ from auth name)
  name:          text("name"),
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
  // Saved gym location (for context detection)
  gymLatitude:   real("gym_latitude"),
  gymLongitude:  real("gym_longitude"),
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
  createdBy:    text("created_by").references(() => users.id),
});

// ─── Workout Plans ────────────────────────────────────────
export const workoutPlans = pgTable("workout_plans", {
  id:          uuid("id").defaultRandom().primaryKey(),
  userId:      text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  dayOfWeek:    integer("day_of_week"),    // 0=Mon…6=Sun, null=unscheduled
  notes:        text("notes"),
});

// ─── Workout Sessions ─────────────────────────────────────
export const workoutSessions = pgTable("workout_sessions", {
  id:          uuid("id").defaultRandom().primaryKey(),
  userId:      text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  userId:     text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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

// ─── Saved Meals (frequent meals for quick logging) ───────
export const savedMeals = pgTable("saved_meals", {
  id:        uuid("id").defaultRandom().primaryKey(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  calories:  integer("calories").notNull(),
  proteinG:  real("protein_g").notNull(),
  carbsG:    real("carbs_g").notNull(),
  fatG:      real("fat_g").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Daily Summaries (materialized per day) ───────────────
export const dailySummaries = pgTable("daily_summaries", {
  id:              uuid("id").defaultRandom().primaryKey(),
  userId:          text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date:            text("date").notNull(),  // "YYYY-MM-DD"
  totalCalories:   integer("total_calories").default(0),
  totalProteinG:   real("total_protein_g").default(0),
  totalCarbsG:     real("total_carbs_g").default(0),
  totalFatG:       real("total_fat_g").default(0),
  workoutDoneMin:  integer("workout_done_min").default(0),
});

// ─── Gym Equipment ────────────────────────────────────────
export const gymEquipment = pgTable("gym_equipment", {
  id:        uuid("id").defaultRandom().primaryKey(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  category:  text("category"),   // 'free_weights' | 'machines' | 'cables' | 'cardio' | 'bodyweight' | 'resistance_bands'
  notes:     text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Exercise Day Logs (per-day completion + weight, synced to DB) ────────────
export const exerciseDayLogs = pgTable("exercise_day_logs", {
  id:             uuid("id").defaultRandom().primaryKey(),
  userId:         text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planExId:       uuid("plan_ex_id").notNull().references(() => planExercises.id, { onDelete: "cascade" }),
  exerciseId:     uuid("exercise_id").notNull().references(() => exercises.id),
  date:           text("date").notNull(),          // "YYYY-MM-DD"
  completed:      boolean("completed").notNull().default(false),
  completedSets:  jsonb("completed_sets").$type<boolean[]>(),
  weightKg:       real("weight_kg"),
});

// ─── Advisor Messages ─────────────────────────────────────
export const advisorMessages = pgTable("advisor_messages", {
  id:        uuid("id").defaultRandom().primaryKey(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role:      text("role").notNull(),        // "user" | "assistant"
  content:   text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  workoutPlans:     many(workoutPlans),
  workoutSessions:  many(workoutSessions),
  mealLogs:         many(mealLogs),
  savedMeals:       many(savedMeals),
  dailySummaries:   many(dailySummaries),
  advisorMessages:  many(advisorMessages),
  gymEquipment:     many(gymEquipment),
}));

export const workoutPlansRelations = relations(workoutPlans, ({ one, many }) => ({
  user:     one(users, { fields: [workoutPlans.userId], references: [users.id] }),
  exercises: many(planExercises),
  sessions:  many(workoutSessions),
}));

export const planExercisesRelations = relations(planExercises, ({ one }) => ({
  plan:     one(workoutPlans, { fields: [planExercises.planId], references: [workoutPlans.id] }),
  exercise: one(exercises, { fields: [planExercises.exerciseId], references: [exercises.id] }),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user: one(users, { fields: [workoutSessions.userId], references: [users.id] }),
  plan: one(workoutPlans, { fields: [workoutSessions.planId], references: [workoutPlans.id] }),
  sets: many(loggedSets),
}));

export const mealLogsRelations = relations(mealLogs, ({ one }) => ({
  user: one(users, { fields: [mealLogs.userId], references: [users.id] }),
}));

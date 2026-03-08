import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Drop all app tables in dependency order
await sql`DROP TABLE IF EXISTS advisor_messages CASCADE`;
await sql`DROP TABLE IF EXISTS daily_summaries CASCADE`;
await sql`DROP TABLE IF EXISTS meal_logs CASCADE`;
await sql`DROP TABLE IF EXISTS logged_sets CASCADE`;
await sql`DROP TABLE IF EXISTS workout_sessions CASCADE`;
await sql`DROP TABLE IF EXISTS plan_exercises CASCADE`;
await sql`DROP TABLE IF EXISTS workout_plans CASCADE`;
await sql`DROP TABLE IF EXISTS exercises CASCADE`;
await sql`DROP TABLE IF EXISTS users CASCADE`;
await sql`DROP TABLE IF EXISTS verification_tokens CASCADE`;
await sql`DROP TABLE IF EXISTS sessions CASCADE`;
await sql`DROP TABLE IF EXISTS accounts CASCADE`;
await sql`DROP TABLE IF EXISTS auth_users CASCADE`;
// Drop enums
await sql`DROP TYPE IF EXISTS goal CASCADE`;
await sql`DROP TYPE IF EXISTS activity_level CASCADE`;
await sql`DROP TYPE IF EXISTS muscle_group CASCADE`;
await sql`DROP TYPE IF EXISTS meal_type CASCADE`;

console.log("All tables dropped. Run npm run db:push to recreate.");

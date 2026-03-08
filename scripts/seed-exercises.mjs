import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const exercises = [
  // Chest
  { name: "Barbell Bench Press", group: "chest", equipment: "barbell", instructions: "Lie flat on bench. Lower bar to mid-chest, touch lightly, press back to lockout. Keep wrists straight and feet flat." },
  { name: "Push-Up", group: "chest", equipment: "bodyweight", instructions: "Hands shoulder-width, body in a straight line. Lower chest to floor, press back up. Keep core braced throughout." },
  { name: "Dumbbell Fly", group: "chest", equipment: "dumbbell", instructions: "Lie on bench, arms wide with slight elbow bend. Arc dumbbells together over chest, squeezing pecs at top." },
  { name: "Incline Dumbbell Press", group: "chest", equipment: "dumbbell", instructions: "Set bench to 30–45°. Press dumbbells from shoulder height to lockout. Lower with control in 2–3 seconds." },

  // Back
  { name: "Pull-Up", group: "back", equipment: "bodyweight", instructions: "Hang from bar with overhand grip. Pull chin above bar leading with elbows. Lower fully, do not kip." },
  { name: "Barbell Row", group: "back", equipment: "barbell", instructions: "Hinge at hips, back flat. Pull bar to lower chest, squeezing shoulder blades. Lower with control." },
  { name: "Dumbbell Row", group: "back", equipment: "dumbbell", instructions: "One knee on bench for support. Row dumbbell to hip, elbow stays close to body. Full stretch at bottom." },
  { name: "Deadlift", group: "back", equipment: "barbell", instructions: "Bar over mid-foot. Grip outside legs, back flat. Drive through the floor to stand. Hinge to lower, do not round." },

  // Shoulders
  { name: "Overhead Press", group: "shoulders", equipment: "barbell", instructions: "Bar at shoulder height. Press overhead to full lockout, bar stays over mid-foot. Lower to shoulders." },
  { name: "Lateral Raise", group: "shoulders", equipment: "dumbbell", instructions: "Slight elbow bend, raise arms to sides until parallel with floor. Control the descent — 3 seconds down." },
  { name: "Face Pull", group: "shoulders", equipment: "cable", instructions: "Rope at face height. Pull to forehead with elbows high and wide. External rotate at the end position." },

  // Biceps
  { name: "Barbell Curl", group: "biceps", equipment: "barbell", instructions: "Elbows at sides, curl bar to shoulder height. Squeeze at top. Lower fully — do not swing." },
  { name: "Hammer Curl", group: "biceps", equipment: "dumbbell", instructions: "Neutral grip (thumbs up). Curl dumbbell while keeping wrist neutral. Targets brachialis and brachioradialis." },
  { name: "Incline Dumbbell Curl", group: "biceps", equipment: "dumbbell", instructions: "Set bench to 60°. Hang arms straight, curl up with supination. Full stretch at bottom is the point." },

  // Triceps
  { name: "Tricep Dip", group: "triceps", equipment: "bodyweight", instructions: "Grip parallel bars, elbows back. Lower until 90° elbow bend. Press up to lockout. Lean slightly forward." },
  { name: "Skull Crusher", group: "triceps", equipment: "barbell", instructions: "Lie on bench, bar above face. Lower by bending elbows toward forehead. Extend back to lockout." },
  { name: "Cable Tricep Pushdown", group: "triceps", equipment: "cable", instructions: "Elbows pinned at sides. Push bar or rope down to full extension. Squeeze at bottom, control the return." },

  // Core
  { name: "Plank", group: "core", equipment: "bodyweight", instructions: "Forearms on floor, body in straight line hip to shoulder. Brace core, squeeze glutes. Hold without sagging." },
  { name: "Hanging Leg Raise", group: "core", equipment: "bodyweight", instructions: "Dead hang from bar. Raise straight legs to 90° or above. Lower with control — no swinging." },
  { name: "Cable Crunch", group: "core", equipment: "cable", instructions: "Kneel below cable, rope at neck. Crunch elbows toward knees, rounding the spine. Pause and squeeze abs." },

  // Quads
  { name: "Barbell Squat", group: "quads", equipment: "barbell", instructions: "Bar on upper back. Squat until thighs parallel or below. Drive knees out, keep chest up, heels flat." },
  { name: "Leg Press", group: "quads", equipment: "machine", instructions: "Feet shoulder-width, mid-platform. Lower to 90°, press through heels. Do not lock knees at top." },
  { name: "Walking Lunge", group: "quads", equipment: "dumbbell", instructions: "Step forward, lower back knee toward floor. Push off front foot to step through. Keep torso upright." },

  // Hamstrings
  { name: "Romanian Deadlift", group: "hamstrings", equipment: "barbell", instructions: "Slight knee bend, push hips back. Bar stays close to legs. Lower until you feel a stretch, drive hips forward to stand." },
  { name: "Leg Curl", group: "hamstrings", equipment: "machine", instructions: "Pad behind ankles. Curl heels to glutes. Pause at contraction. Lower fully — do not let weight stack touch." },

  // Glutes
  { name: "Hip Thrust", group: "glutes", equipment: "barbell", instructions: "Upper back on bench, bar across hips. Drive hips up to parallel, squeeze glutes hard at top. Lower with control." },
  { name: "Glute Bridge", group: "glutes", equipment: "bodyweight", instructions: "Lie on back, knees bent. Drive hips up, squeeze glutes. Hold 1 second at top. Bodyweight or add plate." },

  // Calves
  { name: "Standing Calf Raise", group: "calves", equipment: "machine", instructions: "Rise on toes to maximum height. Lower slowly past platform level for full stretch. Pause at bottom." },
  { name: "Seated Calf Raise", group: "calves", equipment: "machine", instructions: "Pad on knees, rise on toes. Full range of motion — stretch at bottom, peak contraction at top." },

  // Full Body
  { name: "Burpee", group: "full_body", equipment: "bodyweight", instructions: "Squat, kick feet back, do push-up, jump feet forward, jump and clap overhead. Continuous movement." },
  { name: "Kettlebell Swing", group: "full_body", equipment: "kettlebell", instructions: "Hinge — not squat. Drive hips forward to swing bell to shoulder height. Let it pendulum back between legs." },
  { name: "Clean and Press", group: "full_body", equipment: "barbell", instructions: "Pull bar from floor in one explosive motion to shoulders, then press overhead. Reset each rep." },
];

console.log(`Seeding ${exercises.length} exercises...`);

let inserted = 0;
for (const ex of exercises) {
  try {
    await sql`
      INSERT INTO exercises (id, name, muscle_group, equipment, instructions, is_custom)
      VALUES (gen_random_uuid(), ${ex.name}, ${ex.group}, ${ex.equipment}, ${ex.instructions}, false)
      ON CONFLICT DO NOTHING
    `;
    inserted++;
  } catch (err) {
    console.error(`Failed to insert "${ex.name}":`, err.message);
  }
}

console.log(`Done. ${inserted}/${exercises.length} exercises seeded.`);

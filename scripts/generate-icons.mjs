/**
 * Generates PWA PNG icons from an inline SVG.
 * Run: node scripts/generate-icons.mjs
 *
 * Requires: npm install -D sharp (dev dependency)
 * If sharp is not installed, run: npm install -D sharp
 */

import { createRequire } from "module";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

// Inline SVG — minimal dumbbell on #f0f0f0 background
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="128" fill="#f0f0f0"/>
  <!-- Neumorphic circle background for icon -->
  <circle cx="256" cy="256" r="180" fill="#e8e8e8"/>
  <!-- Dumbbell icon in #007AFF -->
  <g stroke="#007AFF" stroke-width="28" stroke-linecap="round" fill="none">
    <!-- Left plate -->
    <line x1="120" y1="220" x2="120" y2="292"/>
    <!-- Right plate -->
    <line x1="392" y1="220" x2="392" y2="292"/>
    <!-- Bar -->
    <line x1="120" y1="256" x2="392" y2="256"/>
    <!-- Left collar -->
    <line x1="176" y1="230" x2="176" y2="282"/>
    <!-- Right collar -->
    <line x1="336" y1="230" x2="336" y2="282"/>
  </g>
</svg>`;

async function generate() {
  let sharp;
  try {
    const require = createRequire(import.meta.url);
    sharp = require("sharp");
  } catch {
    console.error("sharp is not installed. Run: npm install -D sharp");
    process.exit(1);
  }

  const svgBuffer = Buffer.from(SVG);

  for (const size of [192, 512]) {
    const outPath = join(rootDir, "public", "icons", `icon-${size}.png`);
    await sharp(svgBuffer).resize(size, size).png().toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
}

generate();

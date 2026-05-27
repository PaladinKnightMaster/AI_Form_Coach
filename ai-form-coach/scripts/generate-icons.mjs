#!/usr/bin/env node
/**
 * Carriage · PWA icon raster generator.
 *
 * Reads public/icon-source.svg and writes:
 *   public/icon-192.png
 *   public/icon-512.png
 *   public/icon-maskable-192.png
 *   public/icon-maskable-512.png
 *
 * The maskable variants are identical to the standard ones — the
 * Carriage tile already includes safe padding (18%), so the same source
 * survives Android's adaptive-icon mask.
 *
 * Usage:
 *   node scripts/generate-icons.mjs
 *
 * Requirements:
 *   pnpm add -D sharp     # or npm install --save-dev sharp
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(process.cwd());
const SRC = path.join(ROOT, "public", "icon-source.svg");
const OUT_DIR = path.join(ROOT, "public");

const TARGETS = [
  { out: "icon-192.png", size: 192 },
  { out: "icon-512.png", size: 512 },
  { out: "icon-maskable-192.png", size: 192 },
  { out: "icon-maskable-512.png", size: 512 },
];

async function main() {
  const svg = await fs.readFile(SRC);
  await Promise.all(
    TARGETS.map(async ({ out, size }) => {
      const dest = path.join(OUT_DIR, out);
      await sharp(svg, { density: 384 })
        .resize(size, size, { fit: "contain", background: { r: 7, g: 7, b: 7, alpha: 1 } })
        .png({ compressionLevel: 9 })
        .toFile(dest);
      console.log(`✓ wrote ${out} (${size}×${size})`);
    }),
  );
}

main().catch((err) => {
  console.error("✗ icon generation failed:", err);
  process.exit(1);
});

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/** next/og does not export its options type across versions, so model the
 *  font descriptor Satori expects directly. */
type OgFont = {
  name: string;
  data: Buffer | ArrayBuffer;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style?: "normal" | "italic";
};

/* ─────────────────────────────────────────────────────────────────────────
 * Fonts for the Carriage OG / Twitter share cards.
 *
 * next/og (Satori) does NOT read the site's @font-face / public-font URLs —
 * it needs the raw font bytes passed in explicitly, or it falls back to a
 * system serif. The system fallback is *wider* than Fraunces italic, which
 * overflowed the 1200×630 canvas and clipped the headline. Loading the real
 * faces fixes both the clip and the brand fidelity.
 *
 * The .ttf files are co-located in ./og-fonts so they are traced and bundled
 * into the route's serverless function (via `new URL(..., import.meta.url)`),
 * independent of whether /public is served at runtime. Satori needs ttf/otf
 * (not woff2), so these are static instances:
 *   - Fraunces 72pt Italic (display headline + trust line)
 *   - Satoshi Regular OTF    (subtitle)
 *   - JetBrains Mono Regular (mono eyebrows)
 *
 * Note: Satori ignores `font-variation-settings`, so the WONK-1 quirk does
 * not render in the rasterised card — the headline still reads as Fraunces
 * italic, just without the wonky `r`. Acceptable for a share image.
 * ──────────────────────────────────────────────────────────────────────── */

let cached: OgFont[] | null = null;

// Each path must be a STATIC string literal inside new URL(..., import.meta.url):
// bundlers (Turbopack/webpack) trace these at build time. A dynamic
// `./og-fonts/${file}` template cannot be traced and silently resolves every
// call to the same asset — which collapsed all three faces onto Fraunces.
const read = (url: URL): Promise<Buffer> => readFile(fileURLToPath(url));

export async function loadOgFonts(): Promise<OgFont[]> {
  if (cached) return cached;

  const [fraunces, satoshi, mono] = await Promise.all([
    read(new URL("./og-fonts/Fraunces-Italic.ttf", import.meta.url)),
    read(new URL("./og-fonts/Satoshi.otf", import.meta.url)),
    read(new URL("./og-fonts/JetBrainsMono.ttf", import.meta.url)),
  ]);

  cached = [
    { name: "Fraunces", data: fraunces, weight: 500, style: "italic" },
    { name: "Satoshi", data: satoshi, weight: 400, style: "normal" },
    { name: "JetBrains Mono", data: mono, weight: 400, style: "normal" },
  ];

  return cached;
}

import { ImageResponse } from "next/og";

/* ─────────────────────────────────────────────────────────────────────────
 * Carriage Apple touch icon — 180 × 180 obsidian tile.
 *
 * Next.js file-based metadata: this route is picked up automatically and
 * rendered as `apple-icon.png` in the production build. iOS uses it for
 * Home-Screen Add and the safari pinned-tab fallback.
 *
 * Composition matches the App Icon winner from the Visual Direction
 * Review (Study 35): mark only · ~18% padding · 22% radius · champagne
 * calibration nodes · malachite stroke · obsidian ground.
 * ──────────────────────────────────────────────────────────────────────── */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070707",      // obsidian
          borderRadius: "40px",       // ~22% of 180 — iOS overrides anyway
        }}
      >
        <svg
          viewBox="0 0 220 220"
          width="128"
          height="128"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 168 56 C 138 30, 86 30, 60 70 C 34 110, 34 156, 70 184 C 102 208, 156 200, 178 168"
            fill="none"
            stroke="#149A80"
            strokeWidth="11"
            strokeLinecap="round"
          />
          <circle cx="60" cy="70" r="6" fill="#D8C29D" />
          <circle cx="44" cy="130" r="6" fill="#D8C29D" />
          <circle cx="102" cy="200" r="6" fill="#D8C29D" />
        </svg>
      </div>
    ),
    size,
  );
}

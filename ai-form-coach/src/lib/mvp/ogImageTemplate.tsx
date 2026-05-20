import { type ReactElement } from "react";

/* ─────────────────────────────────────────────────────────────────────────
 * Carriage OG / Twitter share image — obsidian camera surface.
 *
 * Composition matches the Hero Keyart winner (Visual Direction Review,
 * Study 20): obsidian ground, generous breathing room, mark + italic
 * wordmark, hairline rule, single champagne trust line. The "foiled
 * ribbon" of the AI source is replaced with the production single-stroke
 * Ribbon C, per the brand council's verdict.
 *
 * Sizing: 1200 × 630 — Twitter `summary_large_image` and OG default.
 * Fonts:  Fraunces italic (display) · Satoshi (UI) · JetBrains Mono (eyebrow).
 *
 * Tokens are inlined (hex) because ImageResponse runs in the edge runtime
 * and cannot resolve CSS variables. Values mirror :root in globals.css.
 * ──────────────────────────────────────────────────────────────────────── */

export const MVP_OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;

type OgImageTemplateProps = {
  /** Italic Fraunces — the brand line. Use locked hero or section headlines. */
  title: string;
  /** Satoshi — body subtitle. One line, calm and direct. */
  subtitle: string;
  /** Mono uppercase eyebrow. Defaults to "Carriage · AI Form Coach". */
  eyebrow?: string;
};

export function renderMvpOgImage({
  title,
  subtitle,
  eyebrow = "Carriage · AI Form Coach",
}: OgImageTemplateProps): ReactElement {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        // Hero dark gradient — obsidian → deep slate → elevated dark
        backgroundColor: "#070707",
        backgroundImage:
          "linear-gradient(135deg, #070707 0%, #111418 55%, #1A1F24 100%)",
        padding: "72px 84px",
        position: "relative",
      }}
    >
      {/* Champagne hairline rule, top — editorial mark */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 84,
          right: 84,
          height: "1px",
          background: "rgba(216, 194, 157, 0.30)",
          display: "flex",
        }}
      />

      {/* Top row · eyebrow + Ribbon C lockup */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#8A8377",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "16px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#D8C29D",
          }}
        >
          {eyebrow}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "14px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#8A8377",
            display: "flex",
          }}
        >
          Public Beta · On-device
        </span>
      </div>

      {/* Centerpiece · mark + italic wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: "44px" }}>
        <svg
          width="160"
          height="160"
          viewBox="0 0 220 220"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "flex" }}
        >
          <path
            d="M 168 56 C 138 30, 86 30, 60 70 C 34 110, 34 156, 70 184 C 102 208, 156 200, 178 168"
            fill="none"
            stroke="#149A80"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <circle cx="60" cy="70" r="6.5" fill="#D8C29D" />
          <circle cx="44" cy="130" r="6.5" fill="#D8C29D" />
          <circle cx="102" cy="200" r="6.5" fill="#D8C29D" />
          <circle cx="168" cy="56" r="4" fill="#0E6F5C" />
          <circle cx="178" cy="168" r="4" fill="#0E6F5C" />
        </svg>

        {/* Vertical hairline — Lockup A divider */}
        <div
          style={{
            width: "1px",
            height: "120px",
            background: "rgba(216, 194, 157, 0.35)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Italic Fraunces display — locked variation settings */}
          <span
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "108px",
              lineHeight: 0.94,
              letterSpacing: "-0.028em",
              color: "#F4EFE6",
              fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'WONK' 1",
              display: "flex",
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontFamily: "'Satoshi', ui-sans-serif, system-ui, sans-serif",
              fontSize: "26px",
              fontWeight: 400,
              color: "#C9C0B2",
              maxWidth: "780px",
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            {subtitle}
          </span>
        </div>
      </div>

      {/* Footer · trust line + champagne hairline */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "32px",
          borderTop: "1px solid rgba(216, 194, 157, 0.30)",
        }}
      >
        <span
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: "32px",
            color: "#D8C29D",
            letterSpacing: "-0.012em",
            fontVariationSettings: "'opsz' 144, 'SOFT' 80, 'WONK' 1",
            display: "flex",
          }}
        >
          Your video stays on your device.
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "14px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#8A8377",
            display: "flex",
          }}
        >
          Form, carried.
        </span>
      </div>
    </div>
  );
}

import { type ReactElement } from "react";

type OgImageTemplateProps = {
  title: string;
  subtitle: string;
};

export const MVP_OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;

export function renderMvpOgImage({ title, subtitle }: OgImageTemplateProps): ReactElement {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        backgroundImage:
          "radial-gradient(circle at 25% 25%, rgba(20,184,166,0.22) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(14,165,233,0.2) 0%, transparent 52%)",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          maxWidth: "920px",
          padding: "0 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
            padding: "10px 18px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.12)",
            backgroundColor: "rgba(255,255,255,0.08)",
            color: "#a7f3d0",
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Motion coaching beta
        </div>

        <h1
          style={{
            fontSize: "76px",
            fontWeight: 800,
            color: "#ffffff",
            margin: "0 0 24px 0",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: "34px",
            color: "#cbd5e1",
            margin: "0 0 42px 0",
            fontWeight: 400,
            lineHeight: 1.28,
            maxWidth: "820px",
          }}
        >
          {subtitle}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
            color: "#f8fafc",
            fontSize: "18px",
            fontWeight: 500,
          }}
        >
          <Badge label="Private live loop" />
          <Badge label="Human-reviewed cues" />
          <Badge label="No video uploads" />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: "64px",
          bottom: "58px",
          opacity: 0.14,
          display: "flex",
        }}
      >
        <svg width="136" height="136" viewBox="0 0 136 136" fill="none">
          <circle cx="50" cy="28" r="5" fill="#2dd4bf" />
          <circle cx="50" cy="50" r="5" fill="#2dd4bf" />
          <circle cx="34" cy="54" r="5" fill="#2dd4bf" />
          <circle cx="66" cy="54" r="5" fill="#2dd4bf" />
          <circle cx="40" cy="82" r="5" fill="#2dd4bf" />
          <circle cx="60" cy="82" r="5" fill="#2dd4bf" />
          <circle cx="32" cy="116" r="5" fill="#2dd4bf" />
          <circle cx="68" cy="116" r="5" fill="#2dd4bf" />
          <line x1="50" y1="28" x2="50" y2="50" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round" />
          <line x1="34" y1="54" x2="50" y2="50" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round" />
          <line x1="66" y1="54" x2="50" y2="50" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round" />
          <line x1="50" y1="50" x2="40" y2="82" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round" />
          <line x1="50" y1="50" x2="60" y2="82" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round" />
          <line x1="40" y1="82" x2="32" y2="116" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="82" x2="68" y2="116" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 16px",
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,0.1)",
        backgroundColor: "rgba(15,23,42,0.34)",
      }}
    >
      <div
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "999px",
          backgroundColor: "#2dd4bf",
        }}
      />
      {label}
    </div>
  );
}
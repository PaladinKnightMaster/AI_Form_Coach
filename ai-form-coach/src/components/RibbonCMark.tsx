/**
 * Ribbon C — Carriage primary mark.
 *
 * Single-stroke cubic Bézier on a 220×220 viewBox.
 * - Stroke is `currentColor` by default; set color on the parent.
 * - Calibration nodes render in malachite (`#0E6F5C`).
 * - Termini render in champagne (`#D8C29D`).
 * - Below 24 px, set `nodes={false}` to drop the calibration dots; the
 *   component does this automatically based on `size`.
 *
 * Locked geometry — do not modify path, stroke-width ratio, or node
 * positions without consulting the brand council. See the Carriage
 * Design System (Vol. 01) for the full specimen.
 */
import * as React from "react";

interface RibbonCMarkProps extends Omit<React.SVGProps<SVGSVGElement>, "color"> {
  /** Pixel size of the rendered mark. Default 32. */
  size?: number;
  /** Show the three calibration nodes and two termini. Default true. */
  nodes?: boolean;
  /** Override the stroke color. Default `currentColor`. */
  color?: string;
  /** Accessible label. Default "Carriage". Pass null/"" for a decorative mark. */
  label?: string | null;
}

/**
 * Stroke-width ramp lifted from the Design System specimen.
 * 16 → 22  · favicon
 * 24 → 18
 * 32 → 14
 * 64 → 11
 * 128+ → 9
 */
function strokeWidthFor(size: number): number {
  if (size <= 16) return 22;
  if (size <= 24) return 18;
  if (size <= 32) return 14;
  if (size <= 64) return 11;
  return 9;
}

export function RibbonCMark({
  size = 32,
  nodes = true,
  color = "currentColor",
  label = "Carriage",
  ...rest
}: RibbonCMarkProps) {
  const strokeWidth = strokeWidthFor(size);
  const showNodes = nodes && size >= 24;
  const showTermini = nodes && size >= 64;
  const nodeRadius = size <= 32 ? 7 : 5.5;
  const isDecorative = label === null || label === "";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 220"
      width={size}
      height={size}
      role={isDecorative ? "presentation" : "img"}
      aria-label={isDecorative ? undefined : label!}
      aria-hidden={isDecorative ? true : undefined}
      {...rest}
    >
      {!isDecorative ? <title>{label}</title> : null}
      <path
        d="M 168 56 C 138 30, 86 30, 60 70 C 34 110, 34 156, 70 184 C 102 208, 156 200, 178 168"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {showNodes ? (
        <>
          <circle cx="60"  cy="70"  r={nodeRadius} fill="#0E6F5C" />
          <circle cx="44"  cy="130" r={nodeRadius} fill="#0E6F5C" />
          <circle cx="102" cy="200" r={nodeRadius} fill="#0E6F5C" />
        </>
      ) : null}
      {showTermini ? (
        <>
          <circle cx="168" cy="56"  r="3.5" fill="#D8C29D" />
          <circle cx="178" cy="168" r="3.5" fill="#D8C29D" />
        </>
      ) : null}
    </svg>
  );
}

export default RibbonCMark;

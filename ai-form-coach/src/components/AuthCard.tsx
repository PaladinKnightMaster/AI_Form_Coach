import Link from "next/link";
import RibbonCMark from "@/components/RibbonCMark";

interface AuthCardProps {
  title: string;
  children: React.ReactNode;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Carriage auth card — bone editorial.
 *
 * Auth lives under (marketing) → bone surface. The Ribbon C and the
 * italic wordmark anchor the card so the brand reads on first sight.
 * Title (e.g. "Sign in", "Create account") is set in italic Fraunces.
 * ──────────────────────────────────────────────────────────────────────── */

export default function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-[#F4EFE6] p-4 text-[#17120D] sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="space-y-6 border border-[#C7B796] bg-[#FAF6EF] p-8 shadow-sm">

          {/* Lockup B · stacked · mark over wordmark */}
          <div className="flex flex-col items-center gap-2 text-center">
            <RibbonCMark size={36} color="#17120D" label={null} />
            <span
              className="wordmark text-2xl leading-none text-[#17120D]"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
            >
              Carriage
            </span>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#7A6240]">
              AI Form Coach
            </p>
          </div>

          <hr className="border-0 border-t border-[#E5DDCD]" />

          <div className="text-center">
            <h1
              className="font-display italic text-[#17120D]"
              style={{
                fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1',
                fontSize: "clamp(1.75rem, 3.2vw, 2.25rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.022em",
                fontWeight: 500,
              }}
            >
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#4B423A]">
              Your video stays on your device.
            </p>
          </div>

          {children}

          <div className="pt-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[#7A6240]">
            By continuing, you agree to our{" "}
            <Link
              href="/privacy"
              className="text-[#17120D] underline decoration-[#C7B796] underline-offset-4 hover:decoration-[#0E6F5C]"
            >
              Privacy
            </Link>{" "}
            and{" "}
            <Link
              href="/terms"
              className="text-[#17120D] underline decoration-[#C7B796] underline-offset-4 hover:decoration-[#0E6F5C]"
            >
              Terms
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import RibbonCMark from "@/components/RibbonCMark";
import { useAuth } from "@/contexts/AuthContext";
import { getFooterRouteGroups } from "@/lib/mvp/featureRegistry";

/* ─────────────────────────────────────────────────────────────────────────
 * Carriage footer — bone editorial.
 *
 * Lockup A (mark + wordmark) lives top-left of the brand column.
 * Marketing surface is bone (#F4EFE6); the footer steps to bone-elev
 * (#FAF6EF) so it reads as a "last page" of the document.
 * ──────────────────────────────────────────────────────────────────────── */

export default function SiteFooter() {
  const { user } = useAuth();
  const groups = getFooterRouteGroups(Boolean(user));

  return (
    <footer className="mt-20 border-t border-[#E5DDCD] bg-[#FAF6EF] text-[#17120D]">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">

        {/* Brand · Lockup A */}
        <section className="space-y-5 lg:col-span-1">
          <Link href="/" aria-label="Carriage — AI Form Coach" className="flex items-center gap-3 text-[#17120D]">
            <RibbonCMark size={28} color="currentColor" label={null} />
            <span aria-hidden="true" className="hidden h-7 w-px bg-[#C7B796] sm:block" />
            <span
              className="wordmark text-2xl leading-none"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
            >
              Carriage
            </span>
          </Link>
          <p className="max-w-sm text-sm leading-6 text-[#4B423A]">
            Private motion coaching for squat, pushup, and plank. The public beta focuses on the live coach and session history.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#7A6240]">
            Form, carried.
          </p>
        </section>

        {/* Auto-generated route groups */}
        {groups.map((group) => (
          <section key={group.title} aria-labelledby={`footer-${group.title}`}>
            <h3
              id={`footer-${group.title}`}
              className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#7A6240]"
            >
              {group.title}
            </h3>
            <ul className="space-y-3 text-sm">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#4B423A] underline-offset-4 transition-colors hover:text-[#0E6F5C] hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Beta truth — locked plain language, lifted from the Design System */}
        <section aria-labelledby="footer-truth">
          <h3
            id="footer-truth"
            className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#7A6240]"
          >
            Beta truth
          </h3>
          <ul className="space-y-3 text-sm leading-6 text-[#4B423A]">
            <li>Your video stays on your device during live coaching.</li>
            <li>Session summaries save when you sign in.</li>
            <li>Nutrition, plans, and health integrations are not in the public beta.</li>
            <li>Supported launch movements: squat, pushup, plank.</li>
          </ul>
        </section>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#E5DDCD]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-6 sm:px-6 md:flex-row md:items-center lg:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#7A6240]">
            © {new Date().getFullYear()} Carriage · Public beta
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="text-[#4B423A] transition-colors hover:text-[#0E6F5C]">
              Privacy
            </Link>
            <Link href="/terms" className="text-[#4B423A] transition-colors hover:text-[#0E6F5C]">
              Terms
            </Link>
            <a
              href="mailto:support@aiformcoach.com"
              className="text-[#4B423A] transition-colors hover:text-[#0E6F5C]"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

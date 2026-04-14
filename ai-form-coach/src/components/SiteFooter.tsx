"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getFooterRouteGroups } from "@/lib/mvp/featureRegistry";

export default function SiteFooter() {
  const { user } = useAuth();
  const groups = getFooterRouteGroups(Boolean(user));

  return (
    <footer className="mt-20 border-t bg-slate-50/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-8 py-12 md:grid-cols-2 lg:grid-cols-4">
        <section className="space-y-4 lg:col-span-1">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">AI Form Coach</h3>
          <p className="max-w-sm text-sm text-slate-600">
            Private motion coaching for squat, pushup, and plank. The public beta focuses on live feedback and session history only.
          </p>
        </section>

        {groups.map((group) => (
          <section key={group.title} aria-labelledby={`footer-${group.title}`}>
            <h3 id={`footer-${group.title}`} className="mb-4 text-sm font-semibold text-slate-900">
              {group.title}
            </h3>
            <ul className="space-y-3 text-sm">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-600 transition-colors hover:text-slate-950">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section aria-labelledby="footer-privacy">
          <h3 id="footer-privacy" className="mb-4 text-sm font-semibold text-slate-900">
            Beta Truth
          </h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li>Camera frames stay in your browser during live coaching.</li>
            <li>Session summaries save when you sign in.</li>
            <li>Nutrition, plans, and health integrations are not in the public beta.</li>
            <li>Supported launch exercises: squat, pushup, plank.</li>
          </ul>
        </section>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-start justify-between gap-3 border-t py-6 text-sm text-slate-600 md:flex-row md:items-center">
        <p>Copyright {new Date().getFullYear()} AI Form Coach. Public beta.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="transition-colors hover:text-slate-950">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-slate-950">
            Terms
          </Link>
          <a href="mailto:support@aiformcoach.com" className="transition-colors hover:text-slate-950">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}

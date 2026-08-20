"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthStatus from "@/components/AuthStatus";
import RibbonCMark from "@/components/RibbonCMark";
import { useAuth } from "@/contexts/AuthContext";
import { getHeaderRoutes } from "@/lib/mvp/featureRegistry";
import { Button, Icon } from "@/ui/DS";

function labelForRoute(href: string) {
  if (href === "/coach") {
    return (
      <span className="flex items-center gap-1">
        <Icon name="activity" className="h-4 w-4" />
        Coach
      </span>
    );
  }

  if (href === "/history") {
    return (
      <span className="flex items-center gap-1">
        <Icon name="bar-chart-2" className="h-4 w-4" />
        History
      </span>
    );
  }

  if (href === "/pricing") {
    return (
      <span className="flex items-center gap-1">
        <Icon name="lock" className="h-4 w-4" />
        Beta Access
      </span>
    );
  }

  return "Home";
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const isAuthed = Boolean(user);
  const routes = getHeaderRoutes(isAuthed);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-[#1F2228] bg-[#070707]/90 shadow-sm backdrop-blur"
        role="banner"
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only rounded bg-black px-3 py-1 text-white focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100]"
        >
          Skip to content
        </a>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Carriage lockup A · horizontal · mark + hairline + wordmark.
              Wordmark must be italic Fraunces with the locked axes. */}
          <Link
            href="/"
            aria-label="Carriage — AI Form Coach"
            className="flex items-center gap-3 text-[#F4EFE6]"
          >
            <RibbonCMark size={28} color="currentColor" label={null} />
            <span
              aria-hidden="true"
              className="hidden h-7 w-px bg-[#2C3036] sm:block"
            />
            <span
              className="wordmark text-2xl leading-none"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
            >
              Carriage
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Main navigation">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="text-[#C9C0B2] transition-colors hover:text-[#F4EFE6]"
              >
                {labelForRoute(route.href)}
              </Link>
            ))}
            {isAuthed ? (
              <Link href="/coach">
                <Button variant="primary" size="sm" className="flex items-center gap-2">
                  <Icon name="play" className="h-4 w-4" />
                  Start Session
                </Button>
              </Link>
            ) : null}
            <AuthStatus />
          </nav>

          <button
            aria-label="Open menu"
            aria-expanded={open}
            className="flex min-h-[44px] items-center gap-2 rounded-md border border-[#2C3036] px-3 py-2 text-[#C9C0B2] transition-colors hover:bg-[#111418] md:hidden"
            onClick={() => setOpen(true)}
            type="button"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              suppressHydrationWarning
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            Menu
          </button>
        </div>
      </header>

      {/* Mobile menu rendered outside header to escape backdrop-blur stacking context */}
      {open ? (
        <div className="fixed inset-0 z-50" aria-modal="true" role="dialog" aria-labelledby="mobile-menu-title">
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" onClick={() => setOpen(false)} />
          <aside
            className="absolute right-0 top-0 grid h-full w-80 max-w-[85vw] content-start gap-4 bg-[#070707] p-6 shadow-xl"
            aria-label="Mobile navigation"
            role="navigation"
          >
            <div className="mb-4 flex items-center justify-between">
              {/* Compact lockup at the top of the mobile menu */}
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 text-[#F4EFE6]">
                <RibbonCMark size={24} color="currentColor" label={null} />
                <span
                  id="mobile-menu-title"
                  className="wordmark text-lg leading-none"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
                >
                  Carriage
                </span>
              </Link>
              <button
                aria-label="Close menu"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 transition-colors hover:bg-[#111418]"
                onClick={() => setOpen(false)}
                type="button"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  suppressHydrationWarning
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="space-y-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-3 transition-colors hover:bg-[#111418]"
                >
                  {labelForRoute(route.href)}
                </Link>
              ))}
              <Link
                href="/privacy"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-3 transition-colors hover:bg-[#111418]"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-3 transition-colors hover:bg-[#111418]"
              >
                Terms
              </Link>
            </nav>

            <div className="space-y-4 border-t border-[#1F2228] pt-4">
              {/* Carriage brand gradient on the mobile CTA — malachite range. */}
              <Link
                href={isAuthed ? "/coach" : "/signin"}
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-[#F4EFE6] shadow-lg transition"
                style={{
                  background: "linear-gradient(135deg, #149A80 0%, #094B3F 100%)",
                }}
              >
                {isAuthed ? "Start session" : "Sign in"}
              </Link>
            </div>

            {/* Account block (email · Settings · Sign out). The drawer previously
                rendered no AuthStatus at all, so on a phone there was no way to
                sign out and no route to /settings — which is where account
                deletion lives. Renders nothing when signed out. */}
            <AuthStatus variant="mobile" onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}

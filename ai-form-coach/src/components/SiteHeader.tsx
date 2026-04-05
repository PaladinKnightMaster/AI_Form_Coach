"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthStatus from "@/components/AuthStatus";
import { useAuth } from "@/contexts/AuthContext";
import { getHeaderRoutes } from "@/lib/mvp/featureRegistry";
import { Button, Icon } from "@/ui/DS";
import ThemeToggle from "@/ui/ThemeToggle";

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

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-white/90 shadow-sm backdrop-blur dark:bg-black/70" role="banner" suppressHydrationWarning>
        <a href="#main-content" className="sr-only rounded bg-black px-3 py-1 text-white focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50">
          Skip to content
        </a>
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            AI Form Coach
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Main navigation">
            {routes.map((route) => (
              <Link key={route.href} href={route.href} className="text-slate-700 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                {labelForRoute(route.href)}
              </Link>
            ))}
            <ThemeToggle />
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
            className="flex min-h-[44px] items-center gap-2 rounded-md border px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 md:hidden"
            onClick={() => setOpen(true)}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" suppressHydrationWarning>
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
          <aside className="absolute right-0 top-0 grid h-full w-80 max-w-[85vw] content-start gap-4 bg-white p-6 shadow-xl dark:bg-black" aria-label="Mobile navigation" role="navigation">
            <div className="mb-4 flex items-center justify-between">
              <span id="mobile-menu-title" className="text-lg font-semibold">
                Menu
              </span>
              <button
                aria-label="Close menu"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setOpen(false)}
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" suppressHydrationWarning>
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
                  className="block rounded-md px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {labelForRoute(route.href)}
                </Link>
              ))}
              <Link href="/privacy" onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                Privacy
              </Link>
              <Link href="/terms" onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                Terms
              </Link>
            </nav>

            <div className="space-y-4 border-t pt-4">
              <div className="px-3">
                <ThemeToggle />
              </div>
              <Link
                href={isAuthed ? "/coach" : "/signin"}
                className="btn btn-primary w-full"
                onClick={() => setOpen(false)}
              >
                {isAuthed ? "Start session" : "Sign in"}
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

export const MVP_EXERCISES = ["squat", "pushup", "plank"] as const;

export type MvpExercise = (typeof MVP_EXERCISES)[number];

export type MvpFeatureFlag =
  | "liveCoaching"
  | "recordedVoicePack"
  | "tutorialSamples"
  | "community"
  | "nutritionAi"
  | "planGeneration"
  | "readiness"
  | "healthIntegrations"
  | "organizations"
  | "demoMode"
  | "monetization";

export const MVP_FEATURE_FLAGS: Record<MvpFeatureFlag, boolean> = {
  liveCoaching: true,
  recordedVoicePack: true,
  tutorialSamples: true,
  community: false,
  nutritionAi: false,
  planGeneration: false,
  readiness: false,
  healthIntegrations: false,
  organizations: false,
  demoMode: false,
  monetization: false,
};

export interface PublicRouteDefinition {
  href: string;
  label: string;
  authRequired?: boolean;
  priority?: number;
  changeFrequency?: "daily" | "weekly" | "monthly" | "yearly";
}

export const MVP_PUBLIC_ROUTES: PublicRouteDefinition[] = [
  { href: "/", label: "Home", priority: 1, changeFrequency: "weekly" },
  { href: "/coach", label: "Coach", authRequired: true, priority: 0.9, changeFrequency: "monthly" },
  { href: "/history", label: "History", authRequired: true, priority: 0.7, changeFrequency: "monthly" },
  { href: "/pricing", label: "Beta Access", priority: 0.6, changeFrequency: "monthly" },
  { href: "/privacy", label: "Privacy", priority: 0.5, changeFrequency: "yearly" },
  { href: "/terms", label: "Terms", priority: 0.5, changeFrequency: "yearly" },
  { href: "/signin", label: "Sign In", priority: 0.4, changeFrequency: "monthly" },
  { href: "/signup", label: "Create Account", priority: 0.4, changeFrequency: "monthly" },
  { href: "/reset-password", label: "Reset Password", priority: 0.3, changeFrequency: "monthly" },
];

export function isMvpFeatureEnabled(feature: MvpFeatureFlag): boolean {
  return MVP_FEATURE_FLAGS[feature];
}

export function getHeaderRoutes(isAuthenticated: boolean): PublicRouteDefinition[] {
  return MVP_PUBLIC_ROUTES.filter((route) => {
    // Auth pages are handled by AuthStatus component — never show in nav links
    if (route.href === "/signin" || route.href === "/signup" || route.href === "/reset-password") {
      return false;
    }
    // Footer-only pages
    if (route.href === "/privacy" || route.href === "/terms") {
      return false;
    }
    // Auth-required pages hidden when logged out
    if (route.authRequired && !isAuthenticated) {
      return false;
    }
    return true;
  });
}

export function getFooterRouteGroups(isAuthenticated: boolean): Array<{ title: string; links: PublicRouteDefinition[] }> {
  return [
    {
      title: "Product",
      links: [
        { href: "/coach", label: "Live Coach", authRequired: true },
        { href: "/history", label: "History", authRequired: true },
        { href: "/pricing", label: "Beta Access" },
      ].filter((link) => !link.authRequired || isAuthenticated),
    },
    {
      title: "Company",
      links: [
        { href: "/", label: "Home" },
        { href: isAuthenticated ? "/coach" : "/signin", label: isAuthenticated ? "Start Session" : "Sign In" },
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms of Service" },
      ],
    },
  ];
}

const MVP_AUTH_ONLY_PREFIXES = ["/coach", "/history", "/session"];

export const MVP_DISABLED_EXACT_PATHS = [
  "/account",
  "/calibrate",
  "/debug-subscription",
  "/demo",
  "/faq",
  "/health",
  "/leaderboards",
  "/org",
  "/plans",
  "/pricing/cancel",
  "/pricing/success",
  "/programs",
  "/sentry-example-page",
  "/test",
  "/test-auth",
  "/test-monetization",
  "/nutrition",
];

const MVP_DISABLED_EXACT_PATH_SET = new Set(MVP_DISABLED_EXACT_PATHS);

export const MVP_DISABLED_PREFIXES = [
  "/challenges",
  "/coach-packs",
  "/creator-packs",
  "/internal",
  "/marketing",
  "/nutrition",
  "/org",
  "/plans",
  "/programs",
  "/test",
];

export function isMvpAuthOnlyPath(pathname: string): boolean {
  return MVP_AUTH_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isMvpDisabledPage(pathname: string): boolean {
  if (MVP_DISABLED_EXACT_PATH_SET.has(pathname)) {
    return true;
  }
  return MVP_DISABLED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function getMvpDisabledRedirect(pathname: string, isAuthenticated: boolean): string {
  if (pathname.startsWith("/pricing/")) {
    return "/pricing";
  }
  return isAuthenticated ? "/coach" : "/";
}

export function getSitemapRoutes() {
  return MVP_PUBLIC_ROUTES.filter((route) => !route.authRequired && route.href !== "/reset-password").map((route) => ({
    url: route.href,
    priority: route.priority ?? 0.5,
    changeFrequency: route.changeFrequency ?? "monthly",
  }));
}

export function getRobotsDisallowPaths(): string[] {
  return [
    "/account",
    "/api/",
    "/auth/",
    "/coach",
    "/history",
    "/session/",
    "/reset-password",
    "/_next/",
    "/admin/",
    ...MVP_DISABLED_EXACT_PATHS,
    ...MVP_DISABLED_PREFIXES.map((prefix) => `${prefix}/`),
  ];
}

export const FeatureRegistry = {
  MVP_EXERCISES,
  MVP_FEATURE_FLAGS,
  MVP_PUBLIC_ROUTES,
  getHeaderRoutes,
  getFooterRouteGroups,
  getSitemapRoutes,
  getRobotsDisallowPaths,
  isMvpFeatureEnabled,
  isMvpAuthOnlyPath,
  isMvpDisabledPage,
  getMvpDisabledRedirect,
};

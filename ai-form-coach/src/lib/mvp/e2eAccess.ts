export function isLoopbackHost(hostname: string | null | undefined): boolean {
  return hostname === "127.0.0.1" || hostname === "localhost";
}

export function isLoopbackAutomationAllowed(
  searchParams: URLSearchParams | null | undefined,
  hostname: string | null | undefined,
): boolean {
  return searchParams?.get("e2e-access") === "1" && isLoopbackHost(hostname);
}

export function withLoopbackAutomationParams(
  pathname: string,
  params?: Record<string, string | null | undefined>,
): string {
  const nextParams = new URLSearchParams();
  nextParams.set("e2e-access", "1");

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) {
      nextParams.set(key, value);
    }
  }

  return `${pathname}?${nextParams.toString()}`;
}

import { defineConfig, devices } from "@playwright/test";

const fakeCameraArgs = ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"];

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  webServer: {
    command: "node scripts/run-next-with-baseline-env.mjs dev --hostname 127.0.0.1 --port 3100",
    // Probe the auth-bypassed coach URL: the bare `/coach` middleware-redirects
    // to `/signin` (200) for an unauthenticated session, which used to mask
    // silent auth failures behind a "webServer is ready" green light. Hitting
    // the loopback-only bypass route here means a future regression in the
    // bypass itself surfaces immediately as a webServer-start failure instead
    // of as 33 cryptic "element not found" test failures.
    url: "http://127.0.0.1:3100/coach?e2e-access=1",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        permissions: ["camera"],
        launchOptions: {
          args: fakeCameraArgs,
        },
      },
    },
    {
      name: "android-chrome",
      use: {
        ...devices["Pixel 7"],
        browserName: "chromium",
        permissions: ["camera"],
        launchOptions: {
          args: fakeCameraArgs,
        },
      },
    },
    {
      name: "iphone-safari",
      use: {
        ...devices["iPhone 13"],
        browserName: "webkit",
      },
    },
  ],
});

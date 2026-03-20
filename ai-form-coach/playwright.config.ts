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
    url: "http://127.0.0.1:3100/coach",
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

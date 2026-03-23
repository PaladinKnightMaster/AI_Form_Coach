import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium, _android as android } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const adbPath = process.env.ADB_PATH ?? "C:/Users/Administrator/AppData/Local/Android/Sdk/platform-tools/adb.exe";
const requestedSerial = process.env.ANDROID_DEVICE_ID ?? null;
const attachOnly = process.env.ANDROID_DEVICE_ATTACH_ONLY === "1";
const port = Number(process.env.ANDROID_DEVICE_TEST_PORT ?? 3104);
const cdpPort = Number(process.env.ANDROID_DEVICE_CDP_PORT ?? 9227);
const host = "127.0.0.1";
const baseUrl = `http://${host}:${port}`;
const cdpUrl = `http://${host}:${cdpPort}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runAdb(args, serial = null) {
  const finalArgs = serial ? ["-s", serial, ...args] : args;
  const result = spawnSync(adbPath, finalArgs, {
    cwd: projectRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(`adb ${finalArgs.join(" ")} failed: ${result.stderr || result.stdout}`);
  }

  return (result.stdout || "").trim();
}

async function waitForServer(url, serverProcess, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Server exited early with code ${serverProcess.exitCode}.`);
    }

    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status >= 200 && response.status < 400) {
        return;
      }
    } catch {
      // Keep polling until the server responds.
    }

    await sleep(1000);
  }

  throw new Error(`Timed out waiting for server at ${url}.`);
}

async function isServerReachable(url) {
  try {
    const response = await fetch(url, { redirect: "manual" });
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

async function waitForJson(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.ok) {
        return await response.json();
      }
      lastError = new Error(`Unexpected status ${response.status} from ${url}.`);
    } catch (error) {
      lastError = error;
    }

    await sleep(1000);
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function startServer() {
  return spawn(process.execPath, ["scripts/run-next-with-baseline-env.mjs", "start", "--hostname", host, "--port", String(port)], {
    cwd: projectRoot,
    env: { ...process.env, COACH_E2E_BYPASS: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function stopServer(serverProcess) {
  if (!serverProcess?.pid || serverProcess.killed) {
    return;
  }

  spawnSync("taskkill", ["/pid", String(serverProcess.pid), "/t", "/f"], {
    cwd: projectRoot,
    stdio: "ignore",
  });
}

async function resolveChromeWebView(androidDevice) {
  const attachAttempts = [
    () => androidDevice.webView({ pkg: "com.android.chrome" }, { timeout: 20_000 }),
    () => androidDevice.webView({ socketName: "chrome_devtools_remote" }, { timeout: 20_000 }),
  ];

  for (const attempt of attachAttempts) {
    try {
      return await attempt();
    } catch {
      // Try the next attachment strategy.
    }
  }

  const visibleViews = androidDevice.webViews().map((view) => ({ pkg: view.pkg(), pid: view.pid() }));
  throw new Error(`No debuggable Chrome webview was discovered. Visible webviews: ${JSON.stringify(visibleViews)}`);
}

async function connectViaChromeCdp(serial) {
  runAdb(["forward", `tcp:${cdpPort}`, "localabstract:chrome_devtools_remote"], serial);

  const version = await waitForJson(`${cdpUrl}/json/version`);
  const targets = await waitForJson(`${cdpUrl}/json/list`);

  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error(`Chrome DevTools is reachable on ${serial}, but no page targets are exposed. Version: ${JSON.stringify(version)}`);
  }

  const browser = await chromium.connectOverCDP(cdpUrl);
  const context = browser.contexts()[0];

  if (!context) {
    throw new Error(`Connected to Chrome DevTools on ${serial}, but Playwright did not expose a browser context.`);
  }

  let page = context.pages().find((candidate) => candidate.url() && !candidate.url().startsWith("chrome://"));
  if (!page) {
    page = await context.newPage();
  }

  return { browser, page, version, targets };
}

async function logFailureDetails(page) {
  try {
    const url = page.url();
    const title = await page.title().catch(() => "");
    const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
    console.error(`Current page URL: ${url}`);
    console.error(`Current page title: ${title}`);
    console.error(`Current page text excerpt: ${bodyText.slice(0, 1000)}`);
    await page.screenshot({ path: path.join(projectRoot, "test-results", "real-android-device-failure.png"), fullPage: true }).catch(() => {});
  } catch (error) {
    console.error(`Failed to capture page diagnostics: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  const shouldReuseServer = await isServerReachable(`${baseUrl}/`);
  const server = shouldReuseServer ? null : startServer();
  let androidDevice;
  let serial = requestedSerial;
  let browser;

  if (server) {
    server.stdout.on("data", (chunk) => process.stdout.write(chunk));
    server.stderr.on("data", (chunk) => process.stderr.write(chunk));
  }

  try {
    if (server) {
      await waitForServer(`${baseUrl}/`, server);
    }

    const devices = await android.devices();
    androidDevice = devices.find((candidate) => !serial || candidate.serial() === serial);

    if (!androidDevice) {
      const known = devices.map((candidate) => candidate.serial()).join(", ");
      throw new Error(`No Android device matched '${serial ?? "first device"}'. Connected devices: ${known || "none"}.`);
    }

    serial = androidDevice.serial();
    console.log(`Using Android device ${androidDevice.model()} (${serial}).`);

    runAdb(["reverse", `tcp:${port}`, `tcp:${port}`], serial);

    if (!attachOnly) {
      await androidDevice.shell("input keyevent KEYCODE_WAKEUP");
      await androidDevice.shell("wm dismiss-keyguard");
      await androidDevice.shell("input keyevent 3");
      await sleep(1500);
      await androidDevice.shell("am force-stop com.android.chrome");
      await androidDevice.shell("am start -n com.android.chrome/com.google.android.apps.chrome.Main -d https://example.com");
      await sleep(5000);
    } else {
      console.log("Attach-only mode enabled. Expecting Chrome to already be open and visible on the device.");
    }

    let page;

    try {
      const chromeWebView = await resolveChromeWebView(androidDevice);
      page = await chromeWebView.page();
      console.log("Attached via Playwright Android webView discovery.");
    } catch (webViewError) {
      console.warn(`Playwright Android webView discovery failed, falling back to Chrome DevTools Protocol: ${webViewError instanceof Error ? webViewError.message : String(webViewError)}`);
      const connectionDetails = await connectViaChromeCdp(serial);
      browser = connectionDetails.browser;
      page = connectionDetails.page;
      console.log(`Attached via Chrome DevTools Protocol. Targets: ${connectionDetails.targets.length}. Browser: ${connectionDetails.version.Browser ?? "unknown"}.`);
    }

    try {
      await page.goto(`${baseUrl}/coach?pose-script=squat-single-rep&e2e-access=1`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });

      await page.getByText("Private motion coaching beta").waitFor({ state: "visible", timeout: 30_000 });

      const primaryAction = page.getByTestId("coach-primary-action").first();
      await page.waitForFunction(() => {
        const element = document.querySelector('[data-testid="coach-primary-action"]');
        return Boolean(element) && !element.hasAttribute("disabled");
      }, { timeout: 60_000 });

      await primaryAction.click();
      await page.getByTestId("coach-countdown").waitFor({ state: "visible", timeout: 20_000 });

      await page.waitForFunction(() => {
        const text = document.querySelector('[data-testid="coach-rep-count"]')?.textContent ?? "";
        return /[1-9]/.test(text);
      }, { timeout: 30_000 });

      const repText = await page.getByTestId("coach-rep-count").first().textContent();
      assert.match(repText ?? "", /[1-9]/);

      console.log(`Real Android coach smoke passed on ${androidDevice.model()} (${serial}).`);
    } catch (error) {
      await logFailureDetails(page);
      throw error;
    }
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (androidDevice) {
      if (!attachOnly) {
        try {
          await androidDevice.shell("am force-stop com.android.chrome");
        } catch {
          // Cleanup best effort only.
        }
      }
      if (serial) {
        try {
          runAdb(["reverse", "--remove", `tcp:${port}`], serial);
        } catch {
          // Cleanup best effort only.
        }
        try {
          runAdb(["forward", "--remove", `tcp:${cdpPort}`], serial);
        } catch {
          // Cleanup best effort only.
        }
      }
      await androidDevice.close().catch(() => {});
    }
    if (server) {
      stopServer(server);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});



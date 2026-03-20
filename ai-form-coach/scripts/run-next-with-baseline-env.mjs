import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error('Usage: node scripts/run-next-with-baseline-env.mjs <dev|build|start> [...args]');
  process.exit(1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const nextBin = require.resolve('next/dist/bin/next');
const preload = path.join(scriptDir, 'suppress-baseline-warning.cjs').replace(/\\/g, '/');
const nodeOptions = [process.env.NODE_OPTIONS, `--require=${preload}`]
  .filter(Boolean)
  .join(' ');

const warningPrefix = 'console.warn("[baseline-browser-mapping]';
const warningPatchedPrefix = '0&&console.warn("[baseline-browser-mapping]';
const patchTargets = [
  path.join(projectRoot, 'node_modules', 'baseline-browser-mapping', 'dist', 'index.js'),
  path.join(projectRoot, 'node_modules', 'baseline-browser-mapping', 'dist', 'index.cjs'),
  path.join(projectRoot, 'node_modules', 'next', 'dist', 'compiled', 'browserslist', 'index.js'),
];

const nextDevCacheDir = path.join(projectRoot, '.next', 'dev');

if (command === 'build' && fs.existsSync(nextDevCacheDir)) {
  fs.rmSync(nextDevCacheDir, { recursive: true, force: true });
}

for (const target of patchTargets) {
  if (!fs.existsSync(target)) {
    continue;
  }

  const source = fs.readFileSync(target, 'utf8');
  if (source.includes(warningPatchedPrefix)) {
    continue;
  }

  if (!source.includes(warningPrefix)) {
    continue;
  }

  fs.writeFileSync(target, source.replaceAll(warningPrefix, warningPatchedPrefix));
}

const child = spawn(process.execPath, [nextBin, command, ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
    BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA:
      process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA ?? 'true',
    BROWSERSLIST_IGNORE_OLD_DATA:
      process.env.BROWSERSLIST_IGNORE_OLD_DATA ?? 'true',
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

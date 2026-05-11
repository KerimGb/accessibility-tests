import { config as dotenvConfig } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Load local env files for development.
 * Priority: .env.local overrides .env.
 */
export function loadLocalEnv(repoRoot) {
  const envPath = join(repoRoot, '.env');
  const envLocalPath = join(repoRoot, '.env.local');
  if (existsSync(envPath)) dotenvConfig({ path: envPath, override: false });
  if (existsSync(envLocalPath)) dotenvConfig({ path: envLocalPath, override: true });
}

/**
 * Load `web/.env` and `web/.env.local` after repo root (each overrides prior).
 * Use this for Node entrypoints so PORT / APP_* in web/ match Vite during `astro dev`.
 */
export function loadWebEnv(repoRoot) {
  const webRoot = join(repoRoot, 'web');
  for (const name of ['.env', '.env.local']) {
    const p = join(webRoot, name);
    if (existsSync(p)) dotenvConfig({ path: p, override: true });
  }
}

/**
 * Vars the host may inject before Node starts (PaaS must win over web/.env dotenv overrides).
 */
const ENV_PRESERVE_FROM_HOST = ['PORT', 'NODE_ENV'];

/** Root env + web env (typical for server.js and web/run-server.mjs). */
export function loadAllAppEnv(repoRoot) {
  const preserved = {};
  for (const k of ENV_PRESERVE_FROM_HOST) {
    if (process.env[k] !== undefined) preserved[k] = process.env[k];
  }
  loadLocalEnv(repoRoot);
  loadWebEnv(repoRoot);
  for (const k of ENV_PRESERVE_FROM_HOST) {
    if (preserved[k] !== undefined) process.env[k] = preserved[k];
  }
}

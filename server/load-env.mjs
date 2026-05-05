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

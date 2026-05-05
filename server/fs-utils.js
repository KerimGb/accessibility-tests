import { existsSync, readFileSync } from 'fs';

export function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

export function isValidReportId(id) {
  return /^[a-zA-Z0-9.-]+$/.test(id) && id.length <= 120;
}

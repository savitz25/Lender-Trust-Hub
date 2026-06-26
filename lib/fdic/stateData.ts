/**
 * FDIC state data registry.
 *
 * TO ADD A NEW STATE:
 * 1. Run: python scripts/parse-fdic-xlsx.py path/to/state.xlsx FL
 * 2. Import the generated JSON below
 * 3. Add entry to stateData and set hasData: true in lib/fdic/states.ts
 */
import type { StateFDICData } from './types';
import floridaData from './data/florida.json';

export const stateData: Record<string, StateFDICData> = {
  FL: floridaData as StateFDICData,
};

export const DEFAULT_STATE_CODE = 'FL';
export const DATA_UPDATED = floridaData.updated;

export function getStateData(code: string): StateFDICData | null {
  return stateData[code] ?? null;
}

export function getAvailableStateCodes(): string[] {
  return Object.keys(stateData);
}
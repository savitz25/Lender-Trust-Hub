/**
 * FDIC state data registry.
 *
 * TO ADD A NEW STATE:
 * 1. Run: python scripts/parse-fdic-xlsx.py path/to/state.xlsx FL
 * 2. Import the generated JSON below
 * 3. Add entry to stateData and set hasData: true in lib/fdic/states.ts
 */
import type { StateFDICData } from './types';
import alabamaData from './data/alabama.json';
import arkansasData from './data/arkansas.json';
import floridaData from './data/florida.json';
import georgiaData from './data/georgia.json';
import iowaData from './data/iowa.json';
import kansasData from './data/kansas.json';
import louisianaData from './data/louisiana.json';
import mississippiData from './data/mississippi.json';
import minnesotaData from './data/minnesota.json';
import missouriData from './data/missouri.json';
import northCarolinaData from './data/north-carolina.json';
import oklahomaData from './data/oklahoma.json';
import southCarolinaData from './data/south-carolina.json';
import texasData from './data/texas.json';
import virginiaData from './data/virginia.json';
import westVirginiaData from './data/west-virginia.json';
import wisconsinData from './data/wisconsin.json';

export const stateData: Record<string, StateFDICData> = {
  AL: alabamaData as StateFDICData,
  AR: arkansasData as StateFDICData,
  FL: floridaData as StateFDICData,
  GA: georgiaData as StateFDICData,
  IA: iowaData as StateFDICData,
  KS: kansasData as StateFDICData,
  LA: louisianaData as StateFDICData,
  MS: mississippiData as StateFDICData,
  MN: minnesotaData as StateFDICData,
  MO: missouriData as StateFDICData,
  NC: northCarolinaData as StateFDICData,
  OK: oklahomaData as StateFDICData,
  SC: southCarolinaData as StateFDICData,
  TX: texasData as StateFDICData,
  VA: virginiaData as StateFDICData,
  WI: wisconsinData as StateFDICData,
  WV: westVirginiaData as StateFDICData,
};

export const DEFAULT_STATE_CODE = 'FL';
export const DATA_UPDATED = '2026-06-26';

export function getStateData(code: string): StateFDICData | null {
  return stateData[code] ?? null;
}

export function getAvailableStateCodes(): string[] {
  return Object.keys(stateData);
}
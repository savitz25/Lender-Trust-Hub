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
import arizonaData from './data/arizona.json';
import arkansasData from './data/arkansas.json';
import californiaData from './data/california.json';
import coloradoData from './data/colorado.json';
import connecticutData from './data/connecticut.json';
import delawareData from './data/delaware.json';
import districtOfColumbiaData from './data/district-of-columbia.json';
import floridaData from './data/florida.json';
import georgiaData from './data/georgia.json';
import idahoData from './data/idaho.json';
import illinoisData from './data/illinois.json';
import indianaData from './data/indiana.json';
import iowaData from './data/iowa.json';
import kansasData from './data/kansas.json';
import kentuckyData from './data/kentucky.json';
import louisianaData from './data/louisiana.json';
import maineData from './data/maine.json';
import marylandData from './data/maryland.json';
import massachusettsData from './data/massachusetts.json';
import michiganData from './data/michigan.json';
import mississippiData from './data/mississippi.json';
import minnesotaData from './data/minnesota.json';
import missouriData from './data/missouri.json';
import montanaData from './data/montana.json';
import nebraskaData from './data/nebraska.json';
import nevadaData from './data/nevada.json';
import newHampshireData from './data/new-hampshire.json';
import newMexicoData from './data/new-mexico.json';
import newJerseyData from './data/new-jersey.json';
import newYorkData from './data/new-york.json';
import northCarolinaData from './data/north-carolina.json';
import northDakotaData from './data/north-dakota.json';
import ohioData from './data/ohio.json';
import oklahomaData from './data/oklahoma.json';
import oregonData from './data/oregon.json';
import pennsylvaniaData from './data/pennsylvania.json';
import rhodeIslandData from './data/rhode-island.json';
import southCarolinaData from './data/south-carolina.json';
import southDakotaData from './data/south-dakota.json';
import tennesseeData from './data/tennessee.json';
import texasData from './data/texas.json';
import utahData from './data/utah.json';
import vermontData from './data/vermont.json';
import virginiaData from './data/virginia.json';
import washingtonData from './data/washington.json';
import westVirginiaData from './data/west-virginia.json';
import wisconsinData from './data/wisconsin.json';
import wyomingData from './data/wyoming.json';

export const stateData: Record<string, StateFDICData> = {
  AL: alabamaData as StateFDICData,
  AR: arkansasData as StateFDICData,
  AZ: arizonaData as StateFDICData,
  CA: californiaData as StateFDICData,
  CO: coloradoData as StateFDICData,
  CT: connecticutData as StateFDICData,
  DC: districtOfColumbiaData as StateFDICData,
  DE: delawareData as StateFDICData,
  FL: floridaData as StateFDICData,
  GA: georgiaData as StateFDICData,
  ID: idahoData as StateFDICData,
  IL: illinoisData as StateFDICData,
  IN: indianaData as StateFDICData,
  IA: iowaData as StateFDICData,
  KS: kansasData as StateFDICData,
  KY: kentuckyData as StateFDICData,
  LA: louisianaData as StateFDICData,
  MA: massachusettsData as StateFDICData,
  MD: marylandData as StateFDICData,
  ME: maineData as StateFDICData,
  MI: michiganData as StateFDICData,
  MS: mississippiData as StateFDICData,
  MN: minnesotaData as StateFDICData,
  MO: missouriData as StateFDICData,
  MT: montanaData as StateFDICData,
  NC: northCarolinaData as StateFDICData,
  ND: northDakotaData as StateFDICData,
  NE: nebraskaData as StateFDICData,
  NV: nevadaData as StateFDICData,
  NH: newHampshireData as StateFDICData,
  NM: newMexicoData as StateFDICData,
  NJ: newJerseyData as StateFDICData,
  NY: newYorkData as StateFDICData,
  OH: ohioData as StateFDICData,
  OK: oklahomaData as StateFDICData,
  OR: oregonData as StateFDICData,
  PA: pennsylvaniaData as StateFDICData,
  RI: rhodeIslandData as StateFDICData,
  SC: southCarolinaData as StateFDICData,
  SD: southDakotaData as StateFDICData,
  TN: tennesseeData as StateFDICData,
  TX: texasData as StateFDICData,
  UT: utahData as StateFDICData,
  VA: virginiaData as StateFDICData,
  VT: vermontData as StateFDICData,
  WA: washingtonData as StateFDICData,
  WI: wisconsinData as StateFDICData,
  WV: westVirginiaData as StateFDICData,
  WY: wyomingData as StateFDICData,
};

export const DEFAULT_STATE_CODE = 'FL';
export const DATA_UPDATED = '2026-06-26';

export function getStateData(code: string): StateFDICData | null {
  return stateData[code] ?? null;
}

export function getAvailableStateCodes(): string[] {
  return Object.keys(stateData);
}
import {
  getMatchedHmdaSlugs,
  loadAllHmdaStateData,
  loadHmdaStateData,
  MAJOR_FLORIDA_COUNTY_SLUGS,
  MAJOR_TEXAS_COUNTY_SLUGS,
  MAJOR_GEORGIA_COUNTY_SLUGS,
  MAJOR_CALIFORNIA_COUNTY_SLUGS,
  MAJOR_NORTH_CAROLINA_COUNTY_SLUGS,
  MAJOR_SOUTH_CAROLINA_COUNTY_SLUGS,
  MAJOR_NEW_JERSEY_COUNTY_SLUGS,
  MAJOR_NEW_YORK_COUNTY_SLUGS,
  MAJOR_PENNSYLVANIA_COUNTY_SLUGS,
  MAJOR_MASSACHUSETTS_COUNTY_SLUGS,
  MAJOR_RHODE_ISLAND_COUNTY_SLUGS,
  MAJOR_VERMONT_COUNTY_SLUGS,
  MAJOR_MAINE_COUNTY_SLUGS,
  MAJOR_CONNECTICUT_COUNTY_SLUGS,
  MAJOR_NEW_HAMPSHIRE_COUNTY_SLUGS,
  MAJOR_VIRGINIA_COUNTY_SLUGS,
  MAJOR_MARYLAND_COUNTY_SLUGS,
  MAJOR_DELAWARE_COUNTY_SLUGS,
  MAJOR_DISTRICT_OF_COLUMBIA_COUNTY_SLUGS,
  MAJOR_TENNESSEE_COUNTY_SLUGS,
  MAJOR_ILLINOIS_COUNTY_SLUGS,
  MAJOR_OHIO_COUNTY_SLUGS,
  MAJOR_MICHIGAN_COUNTY_SLUGS,
  MAJOR_INDIANA_COUNTY_SLUGS,
  MAJOR_ARIZONA_COUNTY_SLUGS,
  MAJOR_COLORADO_COUNTY_SLUGS,
  MAJOR_WISCONSIN_COUNTY_SLUGS,
  MAJOR_MINNESOTA_COUNTY_SLUGS,
  MAJOR_MISSOURI_COUNTY_SLUGS,
  MAJOR_KENTUCKY_COUNTY_SLUGS,
  MAJOR_UTAH_COUNTY_SLUGS,
  MAJOR_NEVADA_COUNTY_SLUGS,
  MAJOR_OREGON_COUNTY_SLUGS,
  MAJOR_WASHINGTON_COUNTY_SLUGS,
  MAJOR_ALABAMA_COUNTY_SLUGS,
  MAJOR_LOUISIANA_COUNTY_SLUGS,
  MAJOR_IOWA_COUNTY_SLUGS,
  MAJOR_KANSAS_COUNTY_SLUGS,
  MAJOR_NEBRASKA_COUNTY_SLUGS,
  MAJOR_ARKANSAS_COUNTY_SLUGS,
  MAJOR_MISSISSIPPI_COUNTY_SLUGS,
  MAJOR_OKLAHOMA_COUNTY_SLUGS,
} from '@/lib/hmda';
import { getLenderBySlug } from '@/lib/lenders';

export type AnalyzerLenderOption = {
  slug: string;
  name: string;
  nmlsId: string;
  /** Combined product-state originations for sort/display */
  originations: number;
  /** @deprecated Use originations */
  floridaOriginations: number;
};

export type AnalyzerCountyOption = {
  slug: string;
  name: string;
  originations: number;
  stateSlug: string;
};

/** HMDA-matched lenders for the analyzer dropdown (server-side). */
export function getAnalyzerLenderOptions(): AnalyzerLenderOption[] {
  const bySlug = new Map<string, AnalyzerLenderOption>();

  for (const bundle of loadAllHmdaStateData()) {
    const { mappings, stateSummaries } = bundle;
    for (const m of mappings) {
      if (!m.ourLenderSlug) continue;
      const summary = stateSummaries.find((s) => s.lei === m.lei);
      const catalog = getLenderBySlug(m.ourLenderSlug);
      const orig = summary?.stateOriginations ?? m.stateOriginations ?? 0;
      const existing = bySlug.get(m.ourLenderSlug);
      if (existing) {
        existing.originations += orig;
        existing.floridaOriginations = existing.originations;
        continue;
      }
      bySlug.set(m.ourLenderSlug, {
        slug: m.ourLenderSlug,
        name: catalog?.name || m.institutionName || m.ourLenderSlug,
        nmlsId: m.nmlsId || catalog?.nmlsId || '',
        originations: orig,
        floridaOriginations: orig,
      });
    }
  }

  for (const slug of getMatchedHmdaSlugs()) {
    if (bySlug.has(slug)) continue;
    const catalog = getLenderBySlug(slug);
    bySlug.set(slug, {
      slug,
      name: catalog?.name || slug,
      nmlsId: catalog?.nmlsId || '',
      originations: 0,
      floridaOriginations: 0,
    });
  }

  return [...bySlug.values()].sort(
    (a, b) => b.originations - a.originations || a.name.localeCompare(b.name)
  );
}

/** Major product-state counties for optional market context (prefixed names). */
export function getAnalyzerCountyOptions(): AnalyzerCountyOption[] {
  const out: AnalyzerCountyOption[] = [];

  const fl = loadHmdaStateData('FL');
  for (const c of fl.countyMarkets) {
    if (!MAJOR_FLORIDA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: c.countySlug,
      name: `${c.countyName} (FL)`,
      originations: c.originations,
      stateSlug: 'florida',
    });
  }

  const tx = loadHmdaStateData('TX');
  for (const c of tx.countyMarkets) {
    if (!MAJOR_TEXAS_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `tx:${c.countySlug}`,
      name: `${c.countyName} (TX)`,
      originations: c.originations,
      stateSlug: 'texas',
    });
  }

  const ga = loadHmdaStateData('GA');
  for (const c of ga.countyMarkets) {
    if (!MAJOR_GEORGIA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ga:${c.countySlug}`,
      name: `${c.countyName} (GA)`,
      originations: c.originations,
      stateSlug: 'georgia',
    });
  }

  const ca = loadHmdaStateData('CA');
  for (const c of ca.countyMarkets) {
    if (!MAJOR_CALIFORNIA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ca:${c.countySlug}`,
      name: `${c.countyName} (CA)`,
      originations: c.originations,
      stateSlug: 'california',
    });
  }

  const nc = loadHmdaStateData('NC');
  for (const c of nc.countyMarkets) {
    if (!MAJOR_NORTH_CAROLINA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `nc:${c.countySlug}`,
      name: `${c.countyName} (NC)`,
      originations: c.originations,
      stateSlug: 'north-carolina',
    });
  }

  const sc = loadHmdaStateData('SC');
  for (const c of sc.countyMarkets) {
    if (!MAJOR_SOUTH_CAROLINA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `sc:${c.countySlug}`,
      name: `${c.countyName} (SC)`,
      originations: c.originations,
      stateSlug: 'south-carolina',
    });
  }

  const nj = loadHmdaStateData('NJ');
  for (const c of nj.countyMarkets) {
    if (!MAJOR_NEW_JERSEY_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `nj:${c.countySlug}`,
      name: `${c.countyName} (NJ)`,
      originations: c.originations,
      stateSlug: 'new-jersey',
    });
  }

  const ny = loadHmdaStateData('NY');
  for (const c of ny.countyMarkets) {
    if (!MAJOR_NEW_YORK_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ny:${c.countySlug}`,
      name: `${c.countyName} (NY)`,
      originations: c.originations,
      stateSlug: 'new-york',
    });
  }

  const pa = loadHmdaStateData('PA');
  for (const c of pa.countyMarkets) {
    if (!MAJOR_PENNSYLVANIA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `pa:${c.countySlug}`,
      name: `${c.countyName} (PA)`,
      originations: c.originations,
      stateSlug: 'pennsylvania',
    });
  }

  const ma = loadHmdaStateData('MA');
  for (const c of ma.countyMarkets) {
    if (!MAJOR_MASSACHUSETTS_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ma:${c.countySlug}`,
      name: `${c.countyName} (MA)`,
      originations: c.originations,
      stateSlug: 'massachusetts',
    });
  }

  const ri = loadHmdaStateData('RI');
  for (const c of ri.countyMarkets) {
    if (!MAJOR_RHODE_ISLAND_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ri:${c.countySlug}`,
      name: `${c.countyName} (RI)`,
      originations: c.originations,
      stateSlug: 'rhode-island',
    });
  }

  const vt = loadHmdaStateData('VT');
  for (const c of vt.countyMarkets) {
    if (!MAJOR_VERMONT_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `vt:${c.countySlug}`,
      name: `${c.countyName} (VT)`,
      originations: c.originations,
      stateSlug: 'vermont',
    });
  }

  const me = loadHmdaStateData('ME');
  for (const c of me.countyMarkets) {
    if (!MAJOR_MAINE_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `me:${c.countySlug}`,
      name: `${c.countyName} (ME)`,
      originations: c.originations,
      stateSlug: 'maine',
    });
  }

  const ct = loadHmdaStateData('CT');
  for (const c of ct.countyMarkets) {
    if (!MAJOR_CONNECTICUT_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ct:${c.countySlug}`,
      name: `${c.countyName} (CT)`,
      originations: c.originations,
      stateSlug: 'connecticut',
    });
  }

  const nh = loadHmdaStateData('NH');
  for (const c of nh.countyMarkets) {
    if (!MAJOR_NEW_HAMPSHIRE_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `nh:${c.countySlug}`,
      name: `${c.countyName} (NH)`,
      originations: c.originations,
      stateSlug: 'new-hampshire',
    });
  }

  const va = loadHmdaStateData('VA');
  for (const c of va.countyMarkets) {
    if (!MAJOR_VIRGINIA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `va:${c.countySlug}`,
      name: `${c.countyName} (VA)`,
      originations: c.originations,
      stateSlug: 'virginia',
    });
  }

  const md = loadHmdaStateData('MD');
  for (const c of md.countyMarkets) {
    if (!MAJOR_MARYLAND_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `md:${c.countySlug}`,
      name: `${c.countyName} (MD)`,
      originations: c.originations,
      stateSlug: 'maryland',
    });
  }

  const de = loadHmdaStateData('DE');
  for (const c of de.countyMarkets) {
    if (!MAJOR_DELAWARE_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `de:${c.countySlug}`,
      name: `${c.countyName} (DE)`,
      originations: c.originations,
      stateSlug: 'delaware',
    });
  }

  const dc = loadHmdaStateData('DC');
  for (const c of dc.countyMarkets) {
    if (!MAJOR_DISTRICT_OF_COLUMBIA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `dc:${c.countySlug}`,
      name: `${c.countyName} (DC)`,
      originations: c.originations,
      stateSlug: 'district-of-columbia',
    });
  }

  const tn = loadHmdaStateData('TN');
  for (const c of tn.countyMarkets) {
    if (!MAJOR_TENNESSEE_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `tn:${c.countySlug}`,
      name: `${c.countyName} (TN)`,
      originations: c.originations,
      stateSlug: 'tennessee',
    });
  }

  const il = loadHmdaStateData('IL');
  for (const c of il.countyMarkets) {
    if (!MAJOR_ILLINOIS_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `il:${c.countySlug}`,
      name: `${c.countyName} (IL)`,
      originations: c.originations,
      stateSlug: 'illinois',
    });
  }

  const oh = loadHmdaStateData('OH');
  for (const c of oh.countyMarkets) {
    if (!MAJOR_OHIO_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `oh:${c.countySlug}`,
      name: `${c.countyName} (OH)`,
      originations: c.originations,
      stateSlug: 'ohio',
    });
  }

  const mi = loadHmdaStateData('MI');
  for (const c of mi.countyMarkets) {
    if (!MAJOR_MICHIGAN_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `mi:${c.countySlug}`,
      name: `${c.countyName} (MI)`,
      originations: c.originations,
      stateSlug: 'michigan',
    });
  }

  const indiana = loadHmdaStateData('IN');
  for (const c of indiana.countyMarkets) {
    if (!MAJOR_INDIANA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `in:${c.countySlug}`,
      name: `${c.countyName} (IN)`,
      originations: c.originations,
      stateSlug: 'indiana',
    });
  }

  const az = loadHmdaStateData('AZ');
  for (const c of az.countyMarkets) {
    if (!MAJOR_ARIZONA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `az:${c.countySlug}`,
      name: `${c.countyName} (AZ)`,
      originations: c.originations,
      stateSlug: 'arizona',
    });
  }

  const co = loadHmdaStateData('CO');
  for (const c of co.countyMarkets) {
    if (!MAJOR_COLORADO_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `co:${c.countySlug}`,
      name: `${c.countyName} (CO)`,
      originations: c.originations,
      stateSlug: 'colorado',
    });
  }

  const wi = loadHmdaStateData('WI');
  for (const c of wi.countyMarkets) {
    if (!MAJOR_WISCONSIN_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `wi:${c.countySlug}`,
      name: `${c.countyName} (WI)`,
      originations: c.originations,
      stateSlug: 'wisconsin',
    });
  }

  const mn = loadHmdaStateData('MN');
  for (const c of mn.countyMarkets) {
    if (!MAJOR_MINNESOTA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `mn:${c.countySlug}`,
      name: `${c.countyName} (MN)`,
      originations: c.originations,
      stateSlug: 'minnesota',
    });
  }

  const mo = loadHmdaStateData('MO');
  for (const c of mo.countyMarkets) {
    if (!MAJOR_MISSOURI_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `mo:${c.countySlug}`,
      name: `${c.countyName} (MO)`,
      originations: c.originations,
      stateSlug: 'missouri',
    });
  }

  const ky = loadHmdaStateData('KY');
  for (const c of ky.countyMarkets) {
    if (!MAJOR_KENTUCKY_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ky:${c.countySlug}`,
      name: `${c.countyName} (KY)`,
      originations: c.originations,
      stateSlug: 'kentucky',
    });
  }

  const ut = loadHmdaStateData('UT');
  for (const c of ut.countyMarkets) {
    if (!MAJOR_UTAH_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ut:${c.countySlug}`,
      name: `${c.countyName} (UT)`,
      originations: c.originations,
      stateSlug: 'utah',
    });
  }

  const nv = loadHmdaStateData('NV');
  for (const c of nv.countyMarkets) {
    if (!MAJOR_NEVADA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `nv:${c.countySlug}`,
      name: `${c.countyName} (NV)`,
      originations: c.originations,
      stateSlug: 'nevada',
    });
  }

  const or = loadHmdaStateData('OR');
  for (const c of or.countyMarkets) {
    if (!MAJOR_OREGON_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `or:${c.countySlug}`,
      name: `${c.countyName} (OR)`,
      originations: c.originations,
      stateSlug: 'oregon',
    });
  }

  const wa = loadHmdaStateData('WA');
  for (const c of wa.countyMarkets) {
    if (!MAJOR_WASHINGTON_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `wa:${c.countySlug}`,
      name: `${c.countyName} (WA)`,
      originations: c.originations,
      stateSlug: 'washington',
    });
  }

  const al = loadHmdaStateData('AL');
  for (const c of al.countyMarkets) {
    if (!MAJOR_ALABAMA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `al:${c.countySlug}`,
      name: `${c.countyName} (AL)`,
      originations: c.originations,
      stateSlug: 'alabama',
    });
  }

  const la = loadHmdaStateData('LA');
  for (const c of la.countyMarkets) {
    if (!MAJOR_LOUISIANA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `la:${c.countySlug}`,
      name: `${c.countyName} (LA)`,
      originations: c.originations,
      stateSlug: 'louisiana',
    });
  }

  const ia = loadHmdaStateData('IA');
  for (const c of ia.countyMarkets) {
    if (!MAJOR_IOWA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ia:${c.countySlug}`,
      name: `${c.countyName} (IA)`,
      originations: c.originations,
      stateSlug: 'iowa',
    });
  }

  const ks = loadHmdaStateData('KS');
  for (const c of ks.countyMarkets) {
    if (!MAJOR_KANSAS_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ks:${c.countySlug}`,
      name: `${c.countyName} (KS)`,
      originations: c.originations,
      stateSlug: 'kansas',
    });
  }

  const ne = loadHmdaStateData('NE');
  for (const c of ne.countyMarkets) {
    if (!MAJOR_NEBRASKA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ne:${c.countySlug}`,
      name: `${c.countyName} (NE)`,
      originations: c.originations,
      stateSlug: 'nebraska',
    });
  }

  const ar = loadHmdaStateData('AR');
  for (const c of ar.countyMarkets) {
    if (!MAJOR_ARKANSAS_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ar:${c.countySlug}`,
      name: `${c.countyName} (AR)`,
      originations: c.originations,
      stateSlug: 'arkansas',
    });
  }

  const ms = loadHmdaStateData('MS');
  for (const c of ms.countyMarkets) {
    if (!MAJOR_MISSISSIPPI_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ms:${c.countySlug}`,
      name: `${c.countyName} (MS)`,
      originations: c.originations,
      stateSlug: 'mississippi',
    });
  }

  const ok = loadHmdaStateData('OK');
  for (const c of ok.countyMarkets) {
    if (!MAJOR_OKLAHOMA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ok:${c.countySlug}`,
      name: `${c.countyName} (OK)`,
      originations: c.originations,
      stateSlug: 'oklahoma',
    });
  }

  return out.sort((a, b) => b.originations - a.originations);
}

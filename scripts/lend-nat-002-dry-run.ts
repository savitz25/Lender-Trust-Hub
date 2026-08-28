/**
 * LEND-NAT-002 dry-run: build in-memory identity graph + immutable manifest.
 * Does not write to Supabase. Does not mutate the public catalog.
 *
 *   npx tsx scripts/lend-nat-002-dry-run.ts
 */
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { lenders } from '../lib/mockData';
import { buildIdentityGraph, buildManifest, censusCatalog } from '../lib/identity/build-graph';
import { indexLeiMaps } from '../lib/identity/lei-resolution';
import { runIdentityTests } from '../lib/identity/id-tests';
import { graphFingerprints } from '../lib/identity/fingerprint';
import { normalizeLeiValue } from '../lib/identity/namespaces';
import type { LeiMapRow } from '../lib/identity/types';
import { stateData } from '../lib/fdic/stateData';

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs');
const OBSERVED = '2025-01-01';

function readCsv(file: string): Record<string, string>[] {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]!);
  const rows: Record<string, string>[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function loadLeiMaps(): LeiMapRow[] {
  const hmda = path.join(ROOT, 'data', 'hmda');
  const files = fs.readdirSync(hmda, { withFileTypes: true });
  const rows: LeiMapRow[] = [];
  for (const d of files) {
    if (!d.isDirectory()) continue;
    const p = path.join(hmda, d.name, 'lei_to_nmls_mapping.csv');
    if (!fs.existsSync(p)) continue;
    for (const r of readCsv(p)) {
      const lei = (r.lei || '').trim();
      if (!lei) continue;
      rows.push({
        lei,
        nmlsId: (r.nmls_id || r.nmls || '').trim(),
        slug: (r.our_lender_slug || r.ourLenderSlug || '').trim(),
        method: (r.match_method || r.method || '').trim(),
        institutionName: (r.institution_name_hmda || r.institution_name || r.legal_name || '').trim(),
        file: d.name,
      });
    }
  }
  return rows;
}

function loadNationalLeis(): string[] {
  const p = path.join(ROOT, 'data', 'hmda', 'national', 'lei_mapping_candidates.csv');
  const leis = new Set<string>();
  for (const r of readCsv(p)) {
    const lei = normalizeLeiValue(r.lei || '');
    if (lei) leis.add(lei);
  }
  return [...leis];
}

function gleifAudit(nationalLeis: string[]) {
  const p = path.join(ROOT, 'data', 'hmda', 'florida', '_gleif_name_cache.json');
  const cache: Record<string, string> = fs.existsSync(p)
    ? JSON.parse(fs.readFileSync(p, 'utf8'))
    : {};
  const cacheLeis = Object.keys(cache);
  const nat = new Set(nationalLeis);
  const overlap = cacheLeis.filter((k) => nat.has(k.toUpperCase()) || nat.has(k));
  return {
    cacheFile: 'data/hmda/florida/_gleif_name_cache.json',
    cacheEntries: cacheLeis.length,
    fieldsPresent: ['legal_name_only'],
    fieldsAbsent: [
      'lei_status',
      'legal_address',
      'headquarters_address',
      'registration_authority',
      'registration_authority_entity_id',
      'parent_relationships',
      'successor_predecessor',
      'entity_status',
    ],
    nationalLeis: nationalLeis.length,
    nationalLeisWithCachedName: overlap.length,
    coveragePct:
      nationalLeis.length === 0
        ? 0
        : Math.round((overlap.length / nationalLeis.length) * 1000) / 10,
    note: 'Cache is Florida matching names only. GLEIF does not provide NMLS. No bulk GLEIF API pull in this task.',
  };
}

function fdicPrep(legalNames: string[]) {
  const certs = new Set<string>();
  const byName = new Map<string, string[]>();
  for (const st of Object.values(stateData)) {
    for (const b of st.banks) {
      const cert = String(b.fdic_cert || '').trim();
      if (cert) certs.add(cert);
      const key = (b.name || '').toLowerCase().trim();
      if (!key) continue;
      const list = byName.get(key) ?? [];
      list.push(cert);
      byName.set(key, list);
    }
  }
  const exactNameHits: { name: string; certs: string[] }[] = [];
  for (const n of legalNames) {
    const hit = byName.get(n.toLowerCase().trim());
    if (hit?.length) exactNameHits.push({ name: n, certs: [...new Set(hit)] });
  }
  return {
    fdicRows: Object.values(stateData).reduce((n, s) => n + s.banks.length, 0),
    distinctCerts: certs.size,
    identifiersAttached: 0,
    identifiersCreated: 0,
    exactLegalNameMatches: exactNameHits.length,
    exactLegalNameMatchExamples: exactNameHits.slice(0, 15),
    disposition: 'UNRESOLVED — name match is not deterministic CERT↔NMLS; no FDIC identifiers attached',
  };
}

function leiRawCensus(maps: LeiMapRow[], nationalLeis: string[]) {
  const idx = indexLeiMaps(maps);
  const leiToNmls = new Map<string, Set<string>>();
  const nmlsToLei = new Map<string, Set<string>>();
  for (const [lei, pair] of idx) {
    leiToNmls.set(lei, pair.nmlsIds);
    for (const nmls of pair.nmlsIds) {
      const set = nmlsToLei.get(nmls) ?? new Set();
      set.add(lei);
      nmlsToLei.set(nmls, set);
    }
  }
  let oneLeiOne = 0;
  let oneLeiMany = 0;
  for (const set of leiToNmls.values()) {
    if (set.size === 1) oneLeiOne++;
    else if (set.size > 1) oneLeiMany++;
  }
  let oneNmlsOne = 0;
  let oneNmlsMany = 0;
  for (const set of nmlsToLei.values()) {
    if (set.size === 1) oneNmlsOne++;
    else if (set.size > 1) oneNmlsMany++;
  }
  return {
    mappingRows: maps.length,
    distinctMappedLeis: leiToNmls.size,
    distinctMappedNmls: nmlsToLei.size,
    oneLeiOneNmls: oneLeiOne,
    oneLeiManyNmls: oneLeiMany,
    oneNmlsOneLei: oneNmlsOne,
    oneNmlsManyLei: oneNmlsMany,
    nationalLeis: nationalLeis.length,
    unresolvedVsNational: nationalLeis.length - leiToNmls.size,
  };
}

function namedCollisionReport(graph: ReturnType<typeof buildIdentityGraph>) {
  const byClass = (cls: string) => graph.conflicts.filter((c) => c.conflictClass.includes(cls));
  return {
    fairway: byClass('fairway').map((c) => ({
      type: c.identifierType,
      value: c.identifierValue,
      disposition: c.disposition,
      notes: c.notes,
    })),
    cmg: byClass('cmg').map((c) => ({
      type: c.identifierType,
      value: c.identifierValue,
      disposition: c.disposition,
      notes: c.notes,
    })),
    movement_veterans_united: byClass('movement').map((c) => ({
      value: c.identifierValue,
      disposition: c.disposition,
    })),
    pennymac_fairway: byClass('pennymac').map((c) => ({
      value: c.identifierValue,
      disposition: c.disposition,
    })),
    guaranteed_rate_bank_of_america: byClass('guaranteed').map((c) => ({
      value: c.identifierValue,
      disposition: c.disposition,
    })),
    harborone_summit: byClass('harborone').map((c) => ({
      value: c.identifierValue,
      disposition: c.disposition,
    })),
    cadence_huntington: byClass('cadence').map((c) => ({
      value: c.identifierValue,
      disposition: c.disposition,
    })),
    first_tech: byClass('first_tech').map((c) => ({
      value: c.identifierValue,
      disposition: c.disposition,
    })),
  };
}

function catalogFingerprint(list: typeof lenders): string {
  const payload = list.map((l) => ({ id: l.id, slug: l.slug, nmls: l.nmlsId, name: l.name }));
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function main() {
  const catalogBefore = catalogFingerprint(lenders);
  const census = censusCatalog(lenders);
  const leiMaps = loadLeiMaps();
  const nationalLeis = loadNationalLeis();
  const graph = buildIdentityGraph({ lenders, leiMaps, nationalLeis });
  const graph2 = buildIdentityGraph({ lenders, leiMaps, nationalLeis });
  const rawLei = leiRawCensus(leiMaps, nationalLeis);
  const manifest = buildManifest(lenders, graph, nationalLeis.length);
  manifest.lei.leisWithAnyNmlsMap = rawLei.distinctMappedLeis;
  manifest.lei.distinctMappedNmls = rawLei.distinctMappedNmls;
  manifest.lei.oneLeiOneNmls = rawLei.oneLeiOneNmls;
  manifest.lei.oneLeiManyNmls = rawLei.oneLeiManyNmls;
  manifest.lei.oneNmlsOneLei = rawLei.oneNmlsOneLei;
  manifest.lei.oneNmlsManyLei = rawLei.oneNmlsManyLei;

  const catalogAfter = catalogFingerprint(lenders);
  const tests = runIdentityTests({ publicLenders: lenders });
  const fp1 = graphFingerprints(graph);
  const fp2 = graphFingerprints(graph2);

  const legalNames = graph.entities.map((e) => e.legalName);
  const gleif = gleifAudit(nationalLeis);
  const fdic = fdicPrep(legalNames);
  const named = namedCollisionReport(graph);

  const idempotent =
    fp1.INSTITUTION_COHORT === fp2.INSTITUTION_COHORT &&
    fp1.IDENTIFIER_COHORT === fp2.IDENTIFIER_COHORT &&
    fp1.SOURCE_LINK_COHORT === fp2.SOURCE_LINK_COHORT &&
    fp1.LEGACY_BRIDGE_COHORT === fp2.LEGACY_BRIDGE_COHORT;

  const out = {
    task: 'LEND-NAT-002',
    executedProductionWrites: false,
    publicCatalogWrites: 0,
    slugWrites: 0,
    sitemapChanges: 0,
    catalogFingerprintBefore: catalogBefore,
    catalogFingerprintAfter: catalogAfter,
    catalogUnchanged: catalogBefore === catalogAfter,
    census,
    manifest,
    gleif,
    fdic,
    namedCollisions: named,
    tests: {
      passed: tests.filter((t) => t.pass).length,
      failed: tests.filter((t) => !t.pass).length,
      results: tests,
    },
    idempotency: {
      pass: idempotent,
      first: fp1,
      second: fp2,
      newInstitutionEntities: 0,
      newIdentifiers: 0,
      newSourceLinks: 0,
      newBridges: 0,
    },
    observedAt: OBSERVED,
    hmdaSummariesUnchanged: true,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifestPath = path.join(OUT_DIR, 'lend-nat-002-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(out, null, 2), 'utf8');

  console.log(JSON.stringify({
    manifest: manifestPath,
    census: {
      locationRows: census.locationRows,
      distinctEntities: census.distinctEntities,
      nmlsVerifiedEntities: census.nmlsVerifiedEntities,
      nmlsSlotClasses: census.nmlsSlotClasses,
    },
    institutions: manifest.counts.confirmedInstitutionEntities,
    identifiers: manifest.counts.identifierRows,
    leis: manifest.counts.hmdaLeis,
    leisAttached: manifest.counts.leisDeterministicallyAttached,
    unresolvedLeis: manifest.counts.unresolvedLeis,
    bridges: manifest.counts.legacyBridges,
    conflicts: manifest.counts.identityConflicts,
    testsFailed: tests.filter((t) => !t.pass).map((t) => t.id),
    testsPassed: tests.filter((t) => t.pass).length,
    idempotent,
    catalogUnchanged: catalogBefore === catalogAfter,
    productionWrites: false,
  }, null, 2));

  const failed = tests.filter((t) => !t.pass);
  if (failed.length) {
    for (const f of failed) console.error('FAIL', f.id, f.detail);
    process.exitCode = 1;
  }
}

main();

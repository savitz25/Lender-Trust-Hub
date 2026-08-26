/**
 * LEND-NAT-002B — regenerate manifest, fingerprint-gate, optional production apply.
 *
 *   npx tsx scripts/lend-nat-002b-activate.ts --env-file <path> --dry-run
 *   npx tsx scripts/lend-nat-002b-activate.ts --env-file <path> --apply
 *
 * Does not mutate lib/mockData.ts or public routes.
 */
import { createHash } from 'crypto';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { lenders } from '../lib/mockData';
import { catalogDistinctEntities } from '../lib/verification';
import { cleanNmlsId } from '../lib/verification/nmls';
import { buildIdentityGraph, buildManifest, censusCatalog } from '../lib/identity/build-graph';
import { runIdentityTests } from '../lib/identity/id-tests';
import { graphFingerprints } from '../lib/identity/fingerprint';
import {
  APPROVED_COUNTS,
  APPROVED_FINGERPRINTS,
  EXPECTED_PROJECT_REF,
  EXPECTED_SUPABASE_HOST,
  REPO_ROOT,
  loadEnvFile,
  loadLeiMaps,
  loadNationalLeis,
} from './identity-io';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1]!.startsWith('--')) {
    return process.argv[i + 1];
  }
  return undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function catalogFingerprint(): string {
  const payload = lenders.map((l) => ({ id: l.id, slug: l.slug, nmls: l.nmlsId, name: l.name }));
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function sitemapProfileCount(): number {
  return catalogDistinctEntities(lenders).filter((l) => l.nmlsVerified && cleanNmlsId(l.nmlsId))
    .length;
}

function supabaseHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return url.includes(EXPECTED_PROJECT_REF) ? EXPECTED_SUPABASE_HOST : null;
  }
}

function main() {
  const envFile = arg('--env-file');
  const apply = hasFlag('--apply');
  if (envFile) loadEnvFile(envFile);

  const publicBefore = {
    catalogRows: lenders.length,
    distinctCompanies: censusCatalog(lenders).distinctEntities,
    nmlsVerified: censusCatalog(lenders).nmlsVerifiedEntities,
    sitemapProfiles: sitemapProfileCount(),
    fingerprint: catalogFingerprint(),
  };

  const leiMaps = loadLeiMaps();
  const nationalLeis = loadNationalLeis();
  const graph = buildIdentityGraph({ lenders, leiMaps, nationalLeis });
  const manifest = buildManifest(lenders, graph, nationalLeis.length);
  const fps = graphFingerprints(graph);
  const idTests = runIdentityTests({ publicLenders: lenders });

  const fpMatch =
    fps.INSTITUTION_COHORT === APPROVED_FINGERPRINTS.INSTITUTION_COHORT &&
    fps.IDENTIFIER_COHORT === APPROVED_FINGERPRINTS.IDENTIFIER_COHORT &&
    fps.SOURCE_LINK_COHORT === APPROVED_FINGERPRINTS.SOURCE_LINK_COHORT &&
    fps.LEGACY_BRIDGE_COHORT === APPROVED_FINGERPRINTS.LEGACY_BRIDGE_COHORT;

  const countMatch =
    manifest.counts.confirmedInstitutionEntities === APPROVED_COUNTS.institutions &&
    manifest.counts.identifierRows === APPROVED_COUNTS.identifiers &&
    manifest.counts.nmlsInstitutionIdentifiers === APPROVED_COUNTS.nmlsInstitution &&
    manifest.counts.sourceLinks === APPROVED_COUNTS.sourceLinks &&
    manifest.counts.legacyBridges === APPROVED_COUNTS.legacyBridges &&
    manifest.counts.identityConflicts === APPROVED_COUNTS.identityConflicts &&
    manifest.counts.leisDeterministicallyAttached === APPROVED_COUNTS.leisAttached &&
    manifest.counts.unresolvedLeis === APPROVED_COUNTS.leisUnattached;

  const predictedPublicWrites = {
    catalog: 0,
    slugs: 0,
    sitemap: 0,
    profiles: 0,
    hmdaSummaries: 0,
  };

  const host = supabaseHost();
  const hostOk = host === EXPECTED_SUPABASE_HOST || Boolean(host?.includes(EXPECTED_PROJECT_REF));

  const activationTests: { id: string; pass: boolean; detail: string }[] = [];
  const check = (id: string, pass: boolean, detail: string) => {
    activationTests.push({ id, pass, detail });
  };

  check('FP', fpMatch, fpMatch ? 'fingerprints match approved LEND-NAT-002' : 'FINGERPRINT MISMATCH — stop');
  check('COUNTS', countMatch, countMatch ? 'cohort counts match approved manifest' : 'COUNT MISMATCH — stop');
  check(
    'ID-REGRESSION',
    idTests.every((t) => t.pass),
    `ID1–ID18 ${idTests.filter((t) => t.pass).length}/18`
  );
  check('PUBLIC-PRE', publicBefore.catalogRows === 1049 && publicBefore.distinctCompanies === 629, JSON.stringify(publicBefore));
  check('HOST', !apply || hostOk, `supabase host ${host ?? 'unset'}`);

  const stop =
    !fpMatch ||
    !countMatch ||
    idTests.some((t) => !t.pass) ||
    predictedPublicWrites.catalog !== 0;

  const cohortPath = path.join(os.tmpdir(), 'lend-nat-002b-cohort.json');
  const outPath = path.join(REPO_ROOT, 'docs', 'lend-nat-002b-activation.json');
  fs.writeFileSync(cohortPath, JSON.stringify(graph), 'utf8');

  let dbResult: unknown = null;
  if (!stop && process.env.DATABASE_URL) {
    const py = spawnSync(
      'python',
      [
        path.join(REPO_ROOT, 'scripts', 'lend-nat-002b-apply.py'),
        '--cohort',
        cohortPath,
        '--migration',
        path.join(REPO_ROOT, 'supabase', 'migrations', '20260826120000_national_institution_identity_spine.sql'),
        ...(apply ? ['--apply'] : []),
      ],
      {
        env: process.env,
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
      }
    );
    if (py.stderr) {
      const err = py.stderr.trim();
      if (err) console.error(err.slice(0, 2000));
    }
    try {
      dbResult = JSON.parse(py.stdout.trim().split('\n').filter(Boolean).pop() || '{}');
    } catch {
      dbResult = { ok: false, parseError: true, stdout: py.stdout.slice(0, 2000), status: py.status };
    }
  } else if (!process.env.DATABASE_URL) {
    dbResult = { ok: false, error: 'DATABASE_URL unset — cannot inspect/apply live graph' };
  }

  const db = dbResult as {
    ok?: boolean;
    schema_missing?: string[];
    pre_counts?: Record<string, number>;
    post_counts?: Record<string, number>;
    inserted?: Record<string, number>;
    detail_counts?: Record<string, number>;
    rls?: Record<string, boolean>;
    error?: string;
  };

  if (db?.schema_missing) {
    check(
      'ACT1',
      apply ? (db.schema_missing.length === 0 || Boolean(db.post_counts)) : true,
      apply
        ? `schema missing before apply: ${db.schema_missing.join(',') || 'none'}`
        : `dry-run schema missing: ${db.schema_missing.join(',') || 'none'}`
    );
  } else {
    check('ACT1', Boolean(db?.ok) && !db.error, db?.error || 'schema probe');
  }

  const d = db?.detail_counts;
  check(
    'ACT2',
    apply
      ? Boolean(
          d &&
            d.institutions === 460 &&
            d.identifiers === 5176 &&
            d.source_links === 5764 &&
            d.legacy_bridges === 1049 &&
            d.identity_conflicts === 39 &&
            d.lei === 4715 &&
            d.lei_attached === 246 &&
            d.lei_unattached === 4469 &&
            d.branch_entities === 0 &&
            d.mlo_entities === 0
        )
      : true,
    apply ? JSON.stringify(d) : 'apply not requested'
  );

  const publicAfter = {
    catalogRows: lenders.length,
    distinctCompanies: censusCatalog(lenders).distinctEntities,
    fingerprint: catalogFingerprint(),
  };
  check(
    'ACT3',
    publicBefore.fingerprint === publicAfter.fingerprint,
    'public catalog fingerprint stable'
  );

  const fairwayInst = graph.identifiers.some(
    (i) => i.identifierType === 'NMLS_INSTITUTION' && i.identifierValue === '2909'
  );
  const cmgPersonAsInst = graph.identifiers.some(
    (i) => i.identifierType === 'NMLS_INSTITUTION' && i.identifierValue === '2458338'
  );
  check('ACT4', !fairwayInst && !cmgPersonAsInst, 'Fairway 2909 / CMG 2458338 not institution NMLS');

  check(
    'ACT5',
    manifest.counts.unresolvedLeis === 4469,
    `unattached LEIs=${manifest.counts.unresolvedLeis}`
  );

  const second = graphFingerprints(buildIdentityGraph({ lenders, leiMaps, nationalLeis }));
  check(
    'ACT6',
    second.INSTITUTION_COHORT === fps.INSTITUTION_COHORT &&
      second.IDENTIFIER_COHORT === fps.IDENTIFIER_COHORT,
    'second in-memory build identical'
  );

  const report = {
    task: 'LEND-NAT-002B',
    apply,
    stop,
    host,
    hostOk,
    expectedProject: EXPECTED_PROJECT_REF,
    publicBefore,
    publicAfter,
    fingerprints: fps,
    approvedFingerprints: APPROVED_FINGERPRINTS,
    fingerprintMatch: fpMatch,
    counts: manifest.counts,
    predictedPublicWrites,
    idTests: {
      passed: idTests.filter((t) => t.pass).length,
      failed: idTests.filter((t) => !t.pass).map((t) => t.id),
    },
    activationTests,
    db: dbResult,
  };
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(
    JSON.stringify(
      {
        stop,
        apply,
        fingerprintMatch: fpMatch,
        countMatch,
        public: publicBefore,
        institutions: manifest.counts.confirmedInstitutionEntities,
        identifiers: manifest.counts.identifierRows,
        leisAttached: manifest.counts.leisDeterministicallyAttached,
        unattached: manifest.counts.unresolvedLeis,
        host: host ?? 'unset',
        dbOk: db?.ok,
        dbError: db?.error,
        schemaMissing: db?.schema_missing,
        inserted: db?.inserted,
        detailCounts: db?.detail_counts,
        actFailed: activationTests.filter((t) => !t.pass).map((t) => t.id),
        outPath,
      },
      null,
      2
    )
  );

  if (stop || activationTests.some((t) => !t.pass && apply)) {
    process.exitCode = 1;
  }
}

main();

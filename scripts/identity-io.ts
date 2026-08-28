/** Shared LEND-NAT-002 file IO — scripts only, not imported by Next routes. */
import fs from 'fs';
import path from 'path';
import { normalizeLeiValue } from '../lib/identity/namespaces';
import type { LeiMapRow } from '../lib/identity/types';

export const REPO_ROOT = path.resolve(__dirname, '..');

export function splitCsvLine(line: string): string[] {
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

export function readCsv(file: string): Record<string, string>[] {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]!);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

export function loadLeiMaps(root = REPO_ROOT): LeiMapRow[] {
  const hmda = path.join(root, 'data', 'hmda');
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

export function loadNationalLeis(root = REPO_ROOT): string[] {
  const p = path.join(root, 'data', 'hmda', 'national', 'lei_mapping_candidates.csv');
  const leis = new Set<string>();
  for (const r of readCsv(p)) {
    const lei = normalizeLeiValue(r.lei || '');
    if (lei) leis.add(lei);
  }
  return [...leis];
}

export function loadEnvFile(filePath: string): void {
  const text = fs.readFileSync(filePath, 'utf8');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

export const APPROVED_FINGERPRINTS = {
  INSTITUTION_COHORT: 'a1b7ef0aa4645b1789f10363d6d8bf1256e03552f29ed75caf315b254aee871b',
  IDENTIFIER_COHORT: 'e1864332f5651e01501d382a92c5b6ca5db8efd1bd1faf33b4498c4b9b1d312d',
  SOURCE_LINK_COHORT: '9642454326325279279c20dfeb46980aeddd6087d29c895e9f64cc1dddb97fc8',
  LEGACY_BRIDGE_COHORT: '883890217b592d9ee663533ba41fa6460f83476b8f1b0fe1a8d4e4a8a2724e14',
} as const;

export const APPROVED_COUNTS = {
  institutions: 460,
  identifiers: 5176,
  nmlsInstitution: 460,
  nmlsBranch: 1,
  lei: 4715,
  sourceLinks: 5764,
  legacyBridges: 1049,
  identityConflicts: 39,
  leisAttached: 246,
  leisUnattached: 4469,
} as const;

export const EXPECTED_SUPABASE_HOST = 'arepfylnilkjmyduhwbz.supabase.co';
export const EXPECTED_PROJECT_REF = 'arepfylnilkjmyduhwbz';

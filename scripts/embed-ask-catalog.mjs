import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const out = {};
    const cells = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        inQ = !inQ;
        continue;
      }
      if (ch === ',' && !inQ) {
        cells.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    cells.push(cur);
    headers.forEach((h, i) => {
      out[h] = cells[i] ?? '';
    });
    return out;
  });
}

const dir = join(root, 'lib/ask-lender/generated');
mkdirSync(dir, { recursive: true });
const write = (name, rel) => {
  const rows = parseCsv(readFileSync(join(root, rel), 'utf8'));
  writeFileSync(join(dir, name), JSON.stringify(rows));
  console.log(name, rows.length);
};

write('state.csv.json', 'data/hmda/national/lender_state_summary.csv');
write('county.csv.json', 'data/hmda/by-state/FL/lender_activity_by_county.csv');
write('markets.csv.json', 'data/hmda/by-state/FL/county_market_summary.csv');
write('mappings.csv.json', 'data/hmda/florida/lei_to_nmls_mapping.csv');
writeFileSync(join(dir, 'gleif.json'), readFileSync(join(root, 'data/hmda/florida/_gleif_name_cache.json')));
console.log('gleif ok');

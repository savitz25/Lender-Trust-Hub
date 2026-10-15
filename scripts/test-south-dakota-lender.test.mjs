import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../app/south-dakota/page.tsx', import.meta.url), 'utf8');
const hmda = await readFile(new URL('../data/hmda/south-dakota/README.md', import.meta.url), 'utf8');
const bankData = JSON.parse(await readFile(new URL('../lib/fdic/data/south-dakota.json', import.meta.url), 'utf8'));

test('South Dakota lender route has canonical, indexable state metadata and regulator citations', () => {
  assert.match(page, /canonical: `\$\{SITE_URL\}\/south-dakota`/);
  assert.match(page, /robots: \{ index: true, follow: true \}/);
  assert.match(page, /Division of Banking mortgage-license classes and renewals/);
  assert.match(page, /NMLS Consumer Access/);
});

test('mortgage company, branch, MLO, other finance classes, and HMDA remain separate', () => {
  for (const phrase of ['Mortgage lender/servicer companies', 'Mortgage brokerage companies', 'Mortgage loan originators', 'Branches and locations', 'Nonresidential-only mortgage lenders', 'Money lenders are a separate']) {
    assert.ok(page.includes(phrase), `Missing population distinction: ${phrase}`);
  }
  assert.match(page, /NOT_ACQUIRED/);
  assert.match(page, /not licenses, branches, or MLO persons/);
  assert.match(hmda, /Market rows: \*\*19\*\*/);
  assert.match(hmda, /Lender[–-]market activity .*\*\*1280\*\*/);
  assert.match(hmda, /LEI state summaries: \*\*333\*\*/);
  assert.match(hmda, /High-confidence LEI.*mappings: \*\*119\*\*/);
});

test('retained FDIC observations are presented separately from current state mortgage licensing', () => {
  assert.equal(bankData.banks.length, 56);
  assert.equal(new Set(bankData.banks.map((bank) => bank.fdic_cert)).size, 56);
  assert.match(page, /56 South Dakota bank records with 56 distinct FDIC certificate IDs/);
  assert.match(page, /not a verified current Division of Banking charter roster/);
});

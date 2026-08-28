#!/usr/bin/env python3
"""FL-LEND-007 Phase 1: exactly 10/10/10, no national-181 slugs."""
from __future__ import annotations

import json
from pathlib import Path
import importlib.util
import psycopg2
from psycopg2.extras import RealDictCursor

ROOT = Path(r"C:\Users\makei\lender-trust-hub-ask-search-009")
spec = importlib.util.spec_from_file_location("g", ROOT / "scripts" / "fl-lend-006-generate.py")
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)

render = json.loads((ROOT / "docs" / "lend-nat-014-render-cohort.json").read_text(encoding="utf-8"))
index = json.loads((ROOT / "docs" / "lend-nat-014-indexing-cohort.json").read_text(encoding="utf-8"))
render_ids = {r["institution_id"] for r in render["rows"]}
render_slugs = {r["slug"] for r in render["rows"]}
index_ids = {r["institution_id"] for r in index["rows"]}

conn = psycopg2.connect(g.lender_dsn())
conn.set_session(readonly=True, autocommit=True)
cur = conn.cursor(cursor_factory=RealDictCursor)

SQL = """
select
  p.institution_id::text as institution_id,
  p.nmls_id,
  p.slug,
  p.profile->'identity'->>'canonical_name' as name,
  p.has_national_snapshot,
  p.confirmed_ofr_event_count as ofr,
  p.credential_count,
  p.profile->'floridaLicensing'->'classes' as classes,
  coalesce((p.profile->'servicerEvidence'->>'ofr_mld_servicer_yes_credentials')::int,0) as servicer,
  (p.profile->'identity'->>'stable_key') as stable_key
from lender_state_company_profiles p
where p.public_projection_status = 'internal_only'
  and p.nmls_id not in (
    select nmls_id from lender_state_licenses where institution_id is null
  )
order by p.nmls_id
"""
cur.execute(SQL)
all_rows = [dict(r) for r in cur.fetchall()]

def pack(r, cohort, kind):
    return {
        "cohort": cohort,
        "kind": kind,
        "institution_id": r["institution_id"],
        "nmls_id": r["nmls_id"],
        "slug": r["slug"],
        "name": r["name"],
        "stable_key": r["stable_key"],
        "has_national_snapshot": r["has_national_snapshot"],
        "ofr": r["ofr"],
        "credential_count": r["credential_count"],
        "classes": r["classes"],
        "servicer": r["servicer"],
    }

a, b, c = [], [], []
for r in all_rows:
    if r["institution_id"] in render_ids or r["slug"] in render_slugs or r["institution_id"] in index_ids:
        continue
    if r["has_national_snapshot"] and len(a) < 10:
        a.append(pack(r, "A", "NATIONAL_PLUS_FLORIDA"))
    elif (not r["has_national_snapshot"]) and r["ofr"] >= 1 and len(b) < 10:
        b.append(pack(r, "B", "FLORIDA_ONLY"))
    elif (not r["has_national_snapshot"]) and r["ofr"] == 0 and len(c) < 10:
        c.append(pack(r, "C", "FLORIDA_ONLY"))

assert len(a) == 10 and len(b) == 10 and len(c) == 10, (len(a), len(b), len(c))
rows = a + b + c
slugs = [r["slug"] for r in rows]
assert len(set(slugs)) == 30
assert not (set(slugs) & render_slugs)
assert all(r["ofr"] >= 1 for r in b)
assert all(r["ofr"] == 0 for r in c)
assert all(r["has_national_snapshot"] for r in a)
assert all(not r["has_national_snapshot"] for r in b + c)

out = {
    "task": "FL-LEND-007",
    "version": "fl-lend-007-phase1-v1",
    "selection": "nmls_id ascending, first 10 matching each stratum, excluding national render/index ids",
    "ranked": False,
    "count": 30,
    "cohort_a": 10,
    "cohort_b": 10,
    "cohort_c": 10,
    "robots_index": False,
    "sitemap": False,
    "search": False,
    "rows": rows,
}
path = ROOT / "docs" / "fl-lend-007-phase1-manifest.json"
path.write_text(json.dumps(out, indent=2), encoding="utf-8")
print(json.dumps({k: out[k] for k in out if k != "rows"}, indent=2))
print("A", [r["slug"] for r in a])
print("B", [r["slug"] for r in b])
print("C", [r["slug"] for r in c])

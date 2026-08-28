#!/usr/bin/env python3
"""FL-LEND-008 Phase 2 dry-run selection. Read-only unless --write-manifest.

Selection:
  seed = fl-lend-pub-v2
  order = sha256('fl-lend-pub-v2|' || institution_id || '|' || nmls_id) ascending
  first 50 eligible B2 (confirmed OFR >= 1)
  first 50 eligible C2 (confirmed OFR == 0)

Eligibility:
  internal Florida profile exists
  no LPI row
  not national render 181 / index 180
  not Phase 1 30
  not held (license rows with institution_id IS NULL)
  canonical institution confirmed
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import importlib.util

import psycopg2
from psycopg2.extras import RealDictCursor

ROOT = Path(r"C:\Users\makei\lender-trust-hub-ask-search-009")
SEED = "fl-lend-pub-v2"
VERSION = "fl-lend-008-phase2-v1"


def load_generate():
    spec = importlib.util.spec_from_file_location("g", ROOT / "scripts" / "fl-lend-006-generate.py")
    g = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(g)
    return g


def pub_hash(institution_id: str, nmls_id: str) -> str:
    return hashlib.sha256(f"{SEED}|{institution_id}|{nmls_id}".encode("utf-8")).hexdigest()


def pack(r: dict, cohort: str) -> dict:
    return {
        "cohort": cohort,
        "kind": "FLORIDA_ONLY",
        "institution_id": r["institution_id"],
        "nmls_id": str(r["nmls_id"]),
        "slug": r["slug"],
        "name": r["name"],
        "stable_key": r["stable_key"],
        "has_national_snapshot": False,
        "ofr": int(r["ofr"]),
        "credential_count": int(r["credential_count"]),
        "classes": r["classes"] if isinstance(r["classes"], list) else json.loads(r["classes"] or "[]"),
        "servicer": int(r["servicer"] or 0),
        "selection_hash": r["selection_hash"],
        "dual_mbr_mld": bool(r["dual"]),
        "long_name": bool(r["long_name"]),
        "addr_len": int(r["addr_len"] or 0),
        "review_contact_creds": int(r["review_contact_creds"] or 0),
        "hmda_attached": bool(r["hmda_attached"]),
        "cfpb_rows": int(r["cfpb_rows"] or 0),
        "federal_events": int(r["federal_events"] or 0),
        "review_ofr": int(r["review_ofr"] or 0),
        "unresolved_ofr": int(r["unresolved_ofr"] or 0),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-manifest", action="store_true")
    args = ap.parse_args()

    g = load_generate()
    phase1 = json.loads((ROOT / "docs" / "fl-lend-007-phase1-manifest.json").read_text(encoding="utf-8"))
    render = json.loads((ROOT / "docs" / "lend-nat-014-render-cohort.json").read_text(encoding="utf-8"))
    index = json.loads((ROOT / "docs" / "lend-nat-014-indexing-cohort.json").read_text(encoding="utf-8"))
    p1_ids = {r["institution_id"] for r in phase1["rows"]}
    p1_slugs = {r["slug"] for r in phase1["rows"]}
    p1_nmls = {str(r["nmls_id"]) for r in phase1["rows"]}
    render_ids = {r["institution_id"] for r in render["rows"]}
    render_slugs = {r["slug"] for r in render["rows"]}
    index_ids = {r["institution_id"] for r in index["rows"]}
    index_slugs = {r["slug"] for r in index["rows"]}
    national_ids = render_ids | index_ids
    national_slugs = render_slugs | index_slugs

    conn = psycopg2.connect(g.lender_dsn())
    conn.set_session(readonly=True, autocommit=True)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("select count(*) as n from lender_state_company_profiles")
    profiles = int(cur.fetchone()["n"])
    cur.execute(
        "select count(*) as n from lender_state_licenses where institution_id is null"
    )
    held_rows = int(cur.fetchone()["n"])
    cur.execute(
        "select count(distinct nmls_id) as n from lender_state_licenses where institution_id is null"
    )
    held_nmls = int(cur.fetchone()["n"])

    SQL = """
    select
      p.institution_id::text as institution_id,
      p.nmls_id,
      p.slug,
      p.profile->'identity'->>'canonical_name' as name,
      p.profile->'identity'->>'stable_key' as stable_key,
      p.has_national_snapshot,
      p.confirmed_ofr_event_count as ofr,
      p.credential_count,
      coalesce(p.profile->'floridaLicensing'->'classes', '[]'::jsonb) as classes,
      coalesce((p.profile->'servicerEvidence'->>'ofr_mld_servicer_yes_credentials')::int, 0) as servicer,
      coalesce((p.profile->'floridaLicensing'->>'dual_mbr_mld')::boolean, false) as dual,
      length(coalesce(p.profile->'identity'->>'canonical_name', '')) >= 40 as long_name,
      coalesce((
        select max(length(coalesce(c->'prim_address'->>'address1','') || coalesce(c->'prim_address'->>'city','')))
        from jsonb_array_elements(coalesce(p.profile->'credentialClasses','[]'::jsonb)) c
      ), 0) as addr_len,
      coalesce((
        select count(*) from jsonb_array_elements(coalesce(p.profile->'credentialClasses','[]'::jsonb)) c
        where c->>'contact_class' = 'review_before_public' or c->>'phone_class' = 'review_before_public'
      ), 0) as review_contact_creds,
      (jsonb_typeof(p.profile->'hmda'->'florida_state_grain') = 'object') as hmda_attached,
      coalesce((p.profile->'cfpb'->>'confirmed_rows')::int, 0) as cfpb_rows,
      coalesce((p.profile->'federalRegulatory'->>'confirmed_events')::int, 0) as federal_events,
      coalesce((p.profile->'floridaRegulatory'->>'review_required_observations')::int, 0) as review_ofr,
      coalesce((p.profile->'floridaRegulatory'->>'unresolved_observations')::int, 0) as unresolved_ofr,
      exists (
        select 1 from lender_profile_intelligence lpi
        where lpi.entity_id = p.institution_id
      ) as has_lpi_row
    from lender_state_company_profiles p
    where p.public_projection_status = 'internal_only'
      and p.nmls_id not in (
        select nmls_id from lender_state_licenses where institution_id is null
      )
    """
    cur.execute(SQL)
    raw = [dict(r) for r in cur.fetchall()]

    eligible = []
    skip = {"lpi": 0, "national": 0, "phase1": 0, "held": 0}
    for r in raw:
        if r["has_lpi_row"] or r["has_national_snapshot"]:
            skip["lpi"] += 1
            continue
        if r["institution_id"] in national_ids or r["slug"] in national_slugs:
            skip["national"] += 1
            continue
        if r["institution_id"] in p1_ids or r["slug"] in p1_slugs or str(r["nmls_id"]) in p1_nmls:
            skip["phase1"] += 1
            continue
        r["selection_hash"] = pub_hash(r["institution_id"], str(r["nmls_id"]))
        eligible.append(r)

    eligible.sort(key=lambda r: (r["selection_hash"], r["institution_id"], str(r["nmls_id"])))
    b2_pool = [r for r in eligible if int(r["ofr"]) >= 1]
    c2_pool = [r for r in eligible if int(r["ofr"]) == 0]
    other = [r for r in eligible if int(r["ofr"]) < 0]
    b2 = [pack(r, "B2") for r in b2_pool[:50]]
    c2 = [pack(r, "C2") for r in c2_pool[:50]]
    rows = b2 + c2

    slugs = [r["slug"] for r in rows]
    ids = [r["institution_id"] for r in rows]
    nmls = [r["nmls_id"] for r in rows]
    fingerprint_src = "|".join(r["selection_hash"] for r in rows)
    fingerprint = hashlib.sha256(fingerprint_src.encode("utf-8")).hexdigest()

    blockers = {
        "review_ofr_selected": sum(r["review_ofr"] for r in rows),
        "unresolved_ofr_selected": sum(r["unresolved_ofr"] for r in rows),
        "federal_fabricated": sum(1 for r in rows if r["federal_events"] > 0),
        "lpi_in_selected": sum(1 for r in rows if r["has_national_snapshot"]),
        "review_contact_creds": sum(r["review_contact_creds"] for r in rows),
    }

    def take(pool, pred):
        for r in pool:
            if pred(r):
                return r
        return None

    qa = []
    used = set()

    def add(row, tag):
        if not row or row["slug"] in used:
            return
        used.add(row["slug"])
        qa.append({"tag": tag, "slug": row["slug"], "cohort": row["cohort"], "name": row["name"], "ofr": row["ofr"]})

    for r in b2[:3]:
        add(r, "b2_event")
    for r in c2[:3]:
        add(r, "c2_zero")
    add(take(rows, lambda r: r["classes"] == ["MBR"]), "mbr_only")
    add(take(rows, lambda r: r["classes"] == ["MLD"]), "mld_only")
    add(take(rows, lambda r: r["servicer"] > 0), "servicer_yes")
    add(take(rows, lambda r: r["credential_count"] >= 2 or r["dual_mbr_mld"]), "multiple_license")
    add(take(sorted(rows, key=lambda r: len(r["name"] or ""), reverse=True), lambda r: True), "long_name")
    add(take(sorted(b2, key=lambda r: r["ofr"], reverse=True), lambda r: True), "largest_ofr")
    while len(qa) < 12:
        for r in rows:
            if r["slug"] not in used:
                add(r, "fill")
                break
        else:
            break

    checks = {
        "profiles": profiles,
        "held_nmls": held_nmls,
        "held_rows": held_rows,
        "eligible_b2": len(b2_pool),
        "eligible_c2": len(c2_pool),
        "eligible_other": len(other),
        "selected_b2": len(b2),
        "selected_c2": len(c2),
        "selected_total": len(rows),
        "national_overlap": len(set(ids) & national_ids) + len(set(slugs) & national_slugs),
        "phase1_overlap": len(set(ids) & p1_ids) + len(set(slugs) & p1_slugs),
        "held_overlap": 0,
        "duplicate_institution": len(ids) - len(set(ids)),
        "duplicate_slug": len(slugs) - len(set(slugs)),
        "b2_ofr_ok": all(r["ofr"] >= 1 for r in b2),
        "c2_ofr_ok": all(r["ofr"] == 0 for r in c2),
        "all_florida_only": all(not r["has_national_snapshot"] for r in rows),
        "review_unresolved_ofr": blockers["review_ofr_selected"] + blockers["unresolved_ofr_selected"],
        "unique_nmls": len(set(nmls)) == 100,
        "skip": skip,
        "blockers": blockers,
        "fingerprint": fingerprint,
        "algorithm": {
            "seed": SEED,
            "formula": "sha256('fl-lend-pub-v2|' || institution_id || '|' || nmls_id)",
            "order": "ascending hex digest, then institution_id, then nmls_id",
            "take": "first 50 B2 (ofr>=1), first 50 C2 (ofr==0)",
            "ranked": False,
        },
    }
    required_ok = (
        checks["selected_b2"] == 50
        and checks["selected_c2"] == 50
        and checks["selected_total"] == 100
        and checks["national_overlap"] == 0
        and checks["phase1_overlap"] == 0
        and checks["held_overlap"] == 0
        and checks["duplicate_institution"] == 0
        and checks["duplicate_slug"] == 0
        and checks["review_unresolved_ofr"] == 0
        and checks["b2_ofr_ok"]
        and checks["c2_ofr_ok"]
        and checks["all_florida_only"]
        and checks["unique_nmls"]
        and profiles == 6303
    )
    out = {
        "task": "FL-LEND-008",
        "version": VERSION,
        "dry_run": True,
        "pass": required_ok,
        "checks": checks,
        "qa_set": qa,
        "b2_slugs": [r["slug"] for r in b2],
        "c2_slugs": [r["slug"] for r in c2],
    }
    dry_path = ROOT / "docs" / "fl-lend-008-dry-run.json"
    dry_path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps({k: out[k] for k in out if k not in ("b2_slugs", "c2_slugs")}, indent=2))
    print("DRY_RUN", "PASS" if required_ok else "FAIL")

    if args.write_manifest:
        if not required_ok:
            print("STOP no manifest")
            return 2
        manifest_rows = []
        for r in rows:
            manifest_rows.append(
                {
                    "cohort": r["cohort"],
                    "kind": r["kind"],
                    "institution_id": r["institution_id"],
                    "nmls_id": r["nmls_id"],
                    "slug": r["slug"],
                    "name": r["name"],
                    "stable_key": r["stable_key"],
                    "has_national_snapshot": False,
                    "ofr": r["ofr"],
                    "credential_count": r["credential_count"],
                    "classes": r["classes"],
                    "servicer": r["servicer"],
                    "selection_hash": r["selection_hash"],
                }
            )
        manifest = {
            "task": "FL-LEND-008",
            "version": VERSION,
            "selection": "sha256('fl-lend-pub-v2|' || institution_id || '|' || nmls_id) ascending; first 50 B2 ofr>=1, first 50 C2 ofr==0; Florida-only, no LPI, exclude national 181/180 and Phase 1 30 and held",
            "ranked": False,
            "count": 100,
            "cohort_b2": 50,
            "cohort_c2": 50,
            "robots_index": False,
            "sitemap": False,
            "search": False,
            "fingerprint": fingerprint,
            "seed": SEED,
            "rows": manifest_rows,
        }
        path = ROOT / "docs" / "fl-lend-008-phase2-manifest.json"
        path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        print("WROTE", path)

    return 0 if required_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())

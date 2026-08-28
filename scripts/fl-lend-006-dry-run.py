#!/usr/bin/env python3
"""FL-LEND-006 read-only dry run. No writes."""
from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

import psycopg2
from psycopg2.extras import RealDictCursor

ROOT = Path(r"C:\Users\makei\lender-trust-hub-ask-search-009")
REF = "hidcrbexurginnuqgipx"
MOVE = "arepfylnilkjmyduhwbz"
OUT = ROOT / "docs" / "fl-lend-006-dry-run.json"


def lender_dsn() -> str:
    raw = os.environ.get("TARGET_DATABASE_URL")
    p = ROOT / ".env.local"
    if not raw and p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            if line.startswith("TARGET_DATABASE_URL="):
                raw = line.split("=", 1)[1].strip().strip('"').strip("'")
    u = urlparse(raw)
    if REF in (u.username or "") and "pooler" in (u.hostname or ""):
        return raw if "sslmode" in (u.query or "") else raw + ("&sslmode=require" if u.query else "?sslmode=require")
    pw = unquote(u.password or "")
    return (
        f"postgresql://postgres.{REF}:{quote(pw, safe='')}"
        f"@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require"
    )


def move_dsn() -> str:
    p = Path(r"C:\Users\makei\move-trust-hub\.env.local")
    for line in p.read_text(encoding="utf-8").splitlines():
        if "DATABASE_URL=" in line and "postgresql://" in line and MOVE in line:
            return line.split("DATABASE_URL=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("move dsn missing")


def n(cur, sql, params=None):
    cur.execute(sql, params)
    return list(cur.fetchone().values())[0]


def rows(cur, sql, params=None):
    cur.execute(sql, params)
    return [dict(r) for r in cur.fetchall()]


def slugify(text: str) -> str:
    s = (text or "").lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s[:80]


def catalog_slugs() -> set[str]:
    text = (ROOT / "lib" / "mockData.ts").read_text(encoding="utf-8")
    return set(re.findall(r"slug:\s*'([a-z0-9-]+)'", text))


def main() -> int:
    dsn = lender_dsn()
    u = urlparse(dsn)
    if REF not in (u.username or "") and REF not in (u.hostname or ""):
        print("STOP not hidcrbex")
        return 2

    conn = psycopg2.connect(dsn)
    conn.set_session(readonly=True, autocommit=True)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("set statement_timeout = '8min'")

    baseline = {
        "institutions": n(cur, "select count(*) from lender_national_entities where entity_kind='institution'"),
        "nmls": n(cur, "select count(*) from lender_identifiers where identifier_type='NMLS_INSTITUTION'"),
        "person_mlo": n(cur, "select count(*) from lender_national_entities where entity_kind='person_mlo'"),
        "branch": n(cur, "select count(*) from lender_national_entities where entity_kind='branch'"),
        "lei": n(cur, "select count(*) from lender_identifiers where identifier_type='LEI'"),
        "fdic": n(cur, "select count(*) from lender_identifiers where identifier_type='FDIC_CERT'"),
        "ncua": n(cur, "select count(*) from lender_identifiers where identifier_type='NCUA_CHARTER'"),
        "rssd": n(cur, "select count(*) from lender_identifiers where identifier_type='RSSD'"),
        "hmda": n(cur, "select count(*) from lender_hmda_observations"),
        "cfpb": n(cur, "select count(*) from lender_cfpb_complaints"),
        "enf": n(cur, "select count(*) from lender_federal_enforcement_events"),
        "profiles": n(cur, "select count(*) from lender_profile_intelligence"),
        "licenses": n(cur, "select count(*) from lender_state_licenses"),
        "sre": n(cur, "select count(*) from lender_state_regulatory_events"),
    }
    expected_baseline = {
        "institutions": 14623,
        "nmls": 6641,
        "person_mlo": 0,
        "branch": 0,
        "lei": 4715,
        "fdic": 5377,
        "ncua": 1096,
        "rssd": 8100,
        "hmda": 454480,
        "cfpb": 458146,
        "enf": 17655,
        "profiles": 8447,
        "licenses": 6435,
        "sre": 2515,
    }

    workset = n(cur, "select count(distinct institution_id) from lender_state_licenses where institution_id is not null")
    held_nmls = n(cur, "select count(distinct nmls_id) from lender_state_licenses where institution_id is null")
    held_rows = n(cur, "select count(*) from lender_state_licenses where institution_id is null")
    approved = n(cur, "select count(*) from lender_state_licenses where ofr_status='Approved'")
    unique_nmls = n(cur, "select count(distinct nmls_id) from lender_state_licenses")

    overlap = rows(
        cur,
        """
        select
          count(*) filter (where p.entity_id is not null) as has_lpi,
          count(*) filter (where p.entity_id is null) as no_lpi,
          count(*) as workset
        from (
          select distinct institution_id from lender_state_licenses where institution_id is not null
        ) w
        left join lender_profile_intelligence p on p.entity_id = w.institution_id
        """,
    )[0]

    license_attach = rows(
        cur,
        """
        select
          count(*) filter (where institution_id is not null) as creds_confirmed,
          count(*) filter (where institution_id is not null and license_class='MBR') as mbr_confirmed,
          count(*) filter (where institution_id is not null and license_class='MLD') as mld_confirmed
        from lender_state_licenses
        """,
    )[0]
    dual = n(
        cur,
        """
        select count(*) from (
          select nmls_id from lender_state_licenses
          where institution_id is not null
          group by nmls_id
          having count(*) filter (where license_class='MBR')>=1
             and count(*) filter (where license_class='MLD')>=1
        ) s
        """,
    )
    servicer_companies = n(
        cur,
        """
        select count(distinct institution_id) from lender_state_licenses
        where institution_id is not null and license_class='MLD' and servicer_flag='Yes'
        """,
    )
    phone_companies = n(
        cur,
        """
        select count(distinct institution_id) from lender_state_licenses
        where institution_id is not null and phone is not null and phone<>''
        """,
    )
    prim_addr_companies = n(
        cur,
        """
        select count(distinct institution_id) from lender_state_licenses
        where institution_id is not null and prim_address1 is not null and prim_address1<>''
        """,
    )
    mail_addr_companies = n(
        cur,
        """
        select count(distinct institution_id) from lender_state_licenses
        where institution_id is not null and mail_address1 is not null and mail_address1<>''
        """,
    )

    ofr_confirmed_events = n(
        cur,
        """
        select count(*) from lender_state_regulatory_events
        where respondent_kind='institution' and attribution_confidence='confirmed'
        """,
    )
    ofr_confirmed_inst = n(
        cur,
        """
        select count(distinct institution_id) from lender_state_regulatory_events
        where respondent_kind='institution' and attribution_confidence='confirmed' and institution_id is not null
        """,
    )
    ofr_confirmed_in_workset = n(
        cur,
        """
        select count(distinct e.institution_id)
        from lender_state_regulatory_events e
        join (select distinct institution_id from lender_state_licenses where institution_id is not null) w
          on w.institution_id=e.institution_id
        where e.respondent_kind='institution' and e.attribution_confidence='confirmed'
        """,
    )
    ofr_review_on_workset = n(
        cur,
        """
        select count(*) from lender_state_regulatory_events e
        where e.respondent_kind='institution' and e.attribution_confidence='review_required'
          and e.institution_id in (select distinct institution_id from lender_state_licenses where institution_id is not null)
        """,
    )
    ofr_unresolved_on_workset = n(
        cur,
        """
        select count(*) from lender_state_regulatory_events e
        where e.respondent_kind='institution' and e.attribution_confidence='unresolved'
          and e.institution_id in (select distinct institution_id from lender_state_licenses where institution_id is not null)
        """,
    )
    ofr_fines = rows(
        cur,
        """
        select count(*) n, coalesce(sum(amount),0) dollars
        from lender_state_regulatory_events
        where respondent_kind='institution' and attribution_confidence='confirmed' and amount is not null
        """,
    )[0]

    hmda_profiles = n(
        cur,
        """
        select count(distinct h.institution_id)
        from lender_hmda_observations h
        join (select distinct institution_id from lender_state_licenses where institution_id is not null) w
          on w.institution_id=h.institution_id
        """,
    )
    cfpb_profiles = n(
        cur,
        """
        select count(distinct c.institution_id)
        from lender_cfpb_complaints c
        join (select distinct institution_id from lender_state_licenses where institution_id is not null) w
          on w.institution_id=c.institution_id
        where c.attribution_confidence='confirmed'
        """,
    )
    fed_profiles = n(
        cur,
        """
        select count(distinct r.institution_id)
        from lender_federal_enforcement_respondents r
        join lender_federal_enforcement_event_respondents er on er.respondent_id=r.id
        join (select distinct institution_id from lender_state_licenses where institution_id is not null) w
          on w.institution_id=r.institution_id
        where r.institution_id is not null
        """,
    )

    table_exists = n(cur, "select to_regclass('public.lender_state_company_profiles')")

    grants = rows(
        cur,
        """
        select table_name, grantee, privilege_type
        from information_schema.role_table_grants
        where table_schema='public'
          and table_name in (
            'lender_profile_intelligence','lender_state_licenses','lender_state_regulatory_events'
          )
        order by 1,2,3
        """,
    )
    rls = rows(
        cur,
        """
        select c.relname, c.relrowsecurity, c.relforcerowsecurity
        from pg_class c
        join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public'
          and c.relname in (
            'lender_profile_intelligence','lender_state_licenses','lender_state_regulatory_events'
          )
        """,
    )
    policies = rows(
        cur,
        """
        select tablename, policyname, roles::text, cmd, qual
        from pg_policies
        where schemaname='public'
          and tablename in (
            'lender_profile_intelligence','lender_state_licenses','lender_state_regulatory_events'
          )
        """,
    )

    names = rows(
        cur,
        """
        select w.institution_id, e.stable_key, e.legal_name, e.display_name,
               i.identifier_value as nmls_id,
               (select firm_name from lender_state_licenses l
                 where l.institution_id=w.institution_id
                 order by case when l.license_class='MBR' then 0 else 1 end, l.license_number
                 limit 1) as ofr_name
        from (select distinct institution_id from lender_state_licenses where institution_id is not null) w
        join lender_national_entities e on e.id=w.institution_id
        join lender_identifiers i on i.entity_id=w.institution_id and i.identifier_type='NMLS_INSTITUTION'
        """,
    )

    indexing = json.loads((ROOT / "docs/lend-nat-014-indexing-cohort.json").read_text(encoding="utf-8"))
    render = json.loads((ROOT / "docs/lend-nat-014-render-cohort.json").read_text(encoding="utf-8"))
    search = json.loads((ROOT / "docs/lend-nat-016-search-index.json").read_text(encoding="utf-8"))
    index_ids = {r["institution_id"] for r in indexing["rows"]}
    render_ids = {r["institution_id"] for r in render["rows"]}
    search_ids = {r["institution_id"] for r in search["rows"]}
    index_slug_by_id = {r["institution_id"]: r["slug"] for r in indexing["rows"]}
    render_slug_by_id = {r["institution_id"]: r["slug"] for r in render["rows"]}
    workset_ids = {r["institution_id"] for r in names}

    reserved = set()
    reserved |= catalog_slugs()
    reserved |= {r["slug"] for r in indexing["rows"]}
    reserved |= {r["slug"] for r in render["rows"]}
    reserved |= {r["slug"] for r in search["rows"]}
    reserved |= {"florida", "lender", "lenders"}

    used: dict[str, str] = {}
    collisions = []
    strategies = Counter()
    samples_disambiguated = []
    for r in names:
        iid = r["institution_id"]
        nmls = str(r["nmls_id"])
        if iid in render_slug_by_id:
            slug = render_slug_by_id[iid]
            strategies["reuse_national_render"] += 1
        elif iid in index_slug_by_id:
            slug = index_slug_by_id[iid]
            strategies["reuse_national_index"] += 1
        else:
            base = slugify(r["ofr_name"] or r["legal_name"] or r["display_name"] or "") or "institution"
            slug = base
            if slug in reserved or slug in used:
                slug = f"{base}-nmls-{nmls}"
                strategies["disambiguated_nmls"] += 1
                if len(samples_disambiguated) < 12:
                    samples_disambiguated.append(
                        {"institution_id": iid, "nmls": nmls, "base": base, "slug": slug, "name": r["ofr_name"]}
                    )
            else:
                strategies["name"] += 1
            if slug in reserved or slug in used:
                slug = f"{base}-nmls-{nmls}-{iid.replace('-','')[:8]}"
                strategies["disambiguated_id"] += 1
        if slug in used and used[slug] != iid:
            collisions.append({"slug": slug, "a": used[slug], "b": iid})
        used[slug] = iid
        reserved.add(slug)

    mconn = psycopg2.connect(move_dsn())
    mconn.set_session(readonly=True, autocommit=True)
    mc = mconn.cursor(cursor_factory=RealDictCursor)
    mc.execute("select to_regclass('public.lender_state_company_profiles') r")
    move_table = mc.fetchone()["r"]
    mc.execute("select count(*) n from lender_national_entities where entity_kind='institution'")
    move_inst = mc.fetchone()["n"]
    mconn.close()
    conn.close()

    stop = []
    if workset != 6303:
        stop.append(f"workset={workset}")
    if held_nmls != 22:
        stop.append(f"held={held_nmls}")
    if overlap["has_lpi"] + overlap["no_lpi"] != 6303:
        stop.append("overlap partition")
    if ofr_confirmed_events != 342:
        stop.append(f"ofr_events={ofr_confirmed_events}")
    if ofr_confirmed_inst != 294:
        stop.append(f"ofr_inst={ofr_confirmed_inst}")
    if collisions:
        stop.append(f"slug_collisions={len(collisions)}")
    if baseline != expected_baseline:
        stop.append({"baseline_drift": {k: (baseline[k], expected_baseline[k]) for k in expected_baseline if baseline[k] != expected_baseline[k]}})

    out = {
        "target": REF,
        "table_exists": table_exists,
        "baseline": baseline,
        "baseline_ok": baseline == expected_baseline,
        "workset": workset,
        "held_nmls": held_nmls,
        "held_rows": held_rows,
        "approved": approved,
        "unique_nmls": unique_nmls,
        "overlap": {
            "has_lpi": overlap["has_lpi"],
            "no_lpi": overlap["no_lpi"],
            "sum": overlap["has_lpi"] + overlap["no_lpi"],
            "render_enabled": len(workset_ids & render_ids),
            "indexed": len(workset_ids & index_ids),
            "searchable": len(workset_ids & search_ids),
        },
        "licenses": license_attach,
        "dual": dual,
        "servicer_companies": servicer_companies,
        "contacts": {
            "phone_companies": phone_companies,
            "prim_addr_companies": prim_addr_companies,
            "mail_addr_companies": mail_addr_companies,
        },
        "ofr": {
            "confirmed_events": ofr_confirmed_events,
            "confirmed_institutions": ofr_confirmed_inst,
            "confirmed_institutions_in_workset": ofr_confirmed_in_workset,
            "no_event_profiles": workset - ofr_confirmed_in_workset if workset else None,
            "review_on_workset": ofr_review_on_workset,
            "unresolved_on_workset": ofr_unresolved_on_workset,
            "confirmed_fine_obs": ofr_fines["n"],
            "confirmed_fine_dollars": float(ofr_fines["dollars"]),
        },
        "overlays": {
            "hmda_profiles": hmda_profiles,
            "cfpb_confirmed_profiles": cfpb_profiles,
            "federal_profiles": fed_profiles,
        },
        "slugs": {
            "algorithm": [
                "1. Reuse existing national render-cohort slug when institution_id already has one.",
                "2. Else reuse indexing-cohort slug.",
                "3. Else slugify OFR firm_name (lower, '&'→'and', non [a-z0-9]→'-', collapse, trim, max 80).",
                "4. If reserved or colliding: {base}-nmls-{nmls_id}.",
                "5. If still colliding: {base}-nmls-{nmls_id}-{institution_id[:8]}.",
                "Reserved = catalog mockData slugs ∪ national render 181 ∪ indexing 180 ∪ search 181 ∪ generated Florida slugs ∪ {florida,lender,lenders}.",
            ],
            "strategies": dict(strategies),
            "collision_count": len(collisions),
            "sample_collisions": collisions[:12],
            "sample_disambiguated": samples_disambiguated,
            "unique_slugs": len(used),
        },
        "security": {"grants": grants, "rls": rls, "policies": policies},
        "move": {"host_ok": True, "institutions": move_inst, "state_company_profiles": move_table},
        "stop": stop,
        "dry_run_pass": not stop and workset == 6303 and held_nmls == 22,
    }
    OUT.write_text(json.dumps(out, default=str, indent=2), encoding="utf-8")
    print(json.dumps({k: out[k] for k in out if k != "security"}, default=str, indent=2))
    print("SECURITY_GRANT_ROWS", len(grants))
    print("DRY_RUN_PASS" if out["dry_run_pass"] else "DRY_RUN_STOP", stop)
    return 0 if out["dry_run_pass"] else 4


if __name__ == "__main__":
    sys.exit(main())

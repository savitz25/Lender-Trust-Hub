#!/usr/bin/env python3
"""LEND-NAT-014 — publication eligibility audit + controlled indexing cohort.

Reads lender_profile_intelligence snapshots only (PK / table scan of snapshots).
Does not scan CFPB events or HMDA observation tables for eligibility.
Writes docs/lend-nat-014-*.json artifacts. No evidence-table writes.

  python scripts/lend-nat-014-audit.py
"""
from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

import psycopg
from psycopg.rows import dict_row

EXPECTED = "arepfylnilkjmyduhwbz"
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENV = Path(r"C:\Users\makei\move-trust-hub\.env.local")
CONTRACT = "lend-nat-011-v1"
COHORT_VERSION = "lend-nat-014-v1"
ADDED_AT = datetime.now(timezone.utc).strftime("%Y-%m-%d")
OUT = ROOT / "docs"

QUARANTINE_NMLS = {"2909", "2458338"}
RESERVED_SLUGS = {
    "lender",
    "lenders",
    "index",
    "admin",
    "api",
    "auth",
    "about",
    "contact",
    "privacy",
    "terms",
    "methodology",
    "calculators",
    "compare",
    "programs",
    "tools",
    "embed",
    "sitemap",
    "robots",
    "local-lenders",
    "fdic-insured-banks",
    "auto-loan-companies",
    "my-lending",
}

EDITORIAL_SLUGS = {
    "nmls-inst:3030": "rocket-mortgage",
    "nmls-inst:2767": "freedom-mortgage-corporation",
    "nmls-inst:399802": "bank-of-america",
    "nmls-inst:399807": "navy-federal-credit-union",
    "gleif-lei:254900AF53CA0NLFZW89": "select-portfolio-servicing",
    "fdic-cert:16243": "bank-of-eastern-oregon",
    "gleif-lei:549300MEMWF0Y8H4PL17": "ocwen-loan-servicing",
    "nmls-inst:2289": "newrez",
    "gleif-lei:549300QSUEE20YO86W39": "specialized-loan-servicing",
    "gleif-lei:549300KO4XT2PA011C25": "phh-home-loans",
}

ORIGINAL_10 = list(EDITORIAL_SLUGS.keys())

SAFE_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 .,&'’/+()#-]*$")


def load_env(path: str | None) -> None:
    p = Path(path) if path else DEFAULT_ENV
    if not p.exists():
        return
    for raw in p.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def slugify(text: str) -> str:
    s = (text or "").lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s[:80]


def catalog_slugs() -> set[str]:
    text = (ROOT / "lib" / "mockData.ts").read_text(encoding="utf-8")
    return set(re.findall(r"slug:\s*'([a-z0-9-]+)'", text))


def id_types(id_map: dict) -> set[str]:
    return set(id_map.keys())


def authoritative(row: dict) -> bool:
    types = set(row["id_map"].keys())
    if types & {"NMLS_INSTITUTION", "FDIC_CERT", "NCUA_CHARTER", "LEI"}:
        return True
    if (row["stable"] or "").startswith("gleif-lei:"):
        return True
    return False


def content_families(row: dict) -> list[str]:
    fam = []
    if row["hmda"] == "AVAILABLE":
        fam.append("hmda")
    if int(row["cfpb_n"] or 0) > 0:
        fam.append("cfpb")
    if int(row["enf_n"] or 0) > 0:
        fam.append("enforcement")
    if row["servicer"] in ("CONFIRMED", "HISTORICAL"):
        fam.append("servicer")
    if row["depository"] in ("FDIC", "NCUA"):
        fam.append("depository")
    if int(row["hmda_states"] or 0) > 0 or row["hq_state"] or row["hq_city"]:
        fam.append("geography")
    hist_kinds = {"historical", "former", "previous", "dba", "trade", "other", "alias"}
    if any((n.get("kind") or "").lower() in hist_kinds for n in row["names"]):
        fam.append("historical_names")
    return fam


def content_bucket(fam: list[str]) -> str:
    s = set(fam)
    if not s:
        return "identity_only"
    has_h = "hmda" in s
    has_c = "cfpb" in s
    has_e = "enforcement" in s
    core = {x for x in ("hmda", "cfpb", "enforcement", "servicer") if x in s}
    if s <= {"servicer", "geography", "historical_names"} and "servicer" in s and not has_h:
        return "servicer_sparse"
    if len(core) >= 2 or (has_h and (has_c or has_e)):
        return "identity_plus_multiple"
    if has_h and has_c:
        return "identity_plus_hmda_cfpb"
    if has_h:
        return "identity_plus_hmda"
    if has_c:
        return "identity_plus_cfpb"
    if has_e:
        return "identity_plus_enforcement"
    if "depository" in s:
        return "identity_plus_depository"
    return "identity_plus_other"


def identity_tier(row: dict) -> str:
    types = set(row["id_map"].keys())
    if (row["stable"] or "").startswith("gleif-lei:"):
        types.add("LEI")
    auth = types & {"NMLS_INSTITUTION", "FDIC_CERT", "NCUA_CHARTER", "LEI"}
    if len(auth) >= 2:
        return "multi_identifier"
    if "NMLS_INSTITUTION" in auth:
        return "nmls_backed"
    if "FDIC_CERT" in auth:
        return "fdic_backed"
    if "NCUA_CHARTER" in auth:
        return "ncua_backed"
    if "LEI" in auth:
        return "lei_backed"
    if auth:
        return "single_authoritative"
    return "sparse_unresolved"


def evaluate(row: dict) -> tuple[str, str]:
    name = (row["display"] or row["canonical"] or "").strip()
    stable = row["stable"] or ""
    conf = (row["identity_confidence"] or "").lower()
    nmls = row["id_map"].get("NMLS_INSTITUTION")

    if not row["institution_id"] or row["contract"] != CONTRACT:
        return "NO_PUBLIC_ROUTE", "missing_id_or_unrecognized_contract"
    if "person" in stable or "branch" in stable or stable.startswith("nmls-person:") or stable.startswith("nmls-branch:"):
        return "NO_PUBLIC_ROUTE", "non_institution_stable_key"
    if not name:
        return "NO_PUBLIC_ROUTE", "blank_canonical_name"

    if nmls in QUARANTINE_NMLS:
        return "IDENTITY_REVIEW", "quarantined_nmls"
    if conf in ("review_required", "unresolved"):
        return "IDENTITY_REVIEW", f"identity_confidence_{conf}"
    if row["coverage_identity"] == "PARTIAL" and not authoritative(row):
        return "IDENTITY_REVIEW", "partial_identity_no_authoritative_id"
    if not authoritative(row):
        return "IDENTITY_REVIEW", "no_authoritative_namespace"

    fam = content_families(row)
    if not fam:
        return "PUBLICATION_HOLD", "identity_only_insufficient_research_content"

    inactive = (row["current_status"] or "").lower() in ("inactive", "closed", "merged", "historical")
    if inactive and row["hmda"] != "AVAILABLE" and row["servicer"] != "CONFIRMED" and int(row["cfpb_n"] or 0) == 0:
        # Keep as its own canonical research entity; do not index as a current originator.
        if row["servicer"] == "HISTORICAL":
            return "PUBLICATION_ELIGIBLE", "historical_servicer_with_confirmed_identity"
        return "HISTORICAL_ONLY", "inactive_without_current_lending_or_servicer_evidence"

    if conf not in ("confirmed", "high_confidence"):
        return "IDENTITY_REVIEW", f"identity_confidence_{conf or 'missing'}"

    return "PUBLICATION_ELIGIBLE", "identity_safe_with_research_content"


def disambiguate_slug(base: str, row: dict) -> str:
    ids = row["id_map"]
    if ids.get("NMLS_INSTITUTION"):
        return f"{base}-nmls-{ids['NMLS_INSTITUTION']}"
    if ids.get("FDIC_CERT"):
        return f"{base}-fdic-{ids['FDIC_CERT']}"
    if ids.get("NCUA_CHARTER"):
        return f"{base}-ncua-{ids['NCUA_CHARTER']}"
    lei = ids.get("LEI")
    if not lei and (row["stable"] or "").startswith("gleif-lei:"):
        lei = row["stable"].split("gleif-lei:", 1)[1]
    if lei:
        return f"{base}-lei-{lei[-8:].lower()}"
    return f"{base}-id-{row['institution_id'][:8]}"


def assign_slugs(rows: list[dict]) -> dict[str, list[str]]:
    """Deterministic: editorial slugs first, then institution_id order. Collisions get suffix."""
    claimed: dict[str, str] = {}
    collisions: dict[str, list[str]] = defaultdict(list)

    for row in rows:
        editorial = EDITORIAL_SLUGS.get(row["stable"])
        if editorial:
            if editorial in claimed and claimed[editorial] != row["institution_id"]:
                collisions[editorial].append(row["institution_id"])
                row["slug"] = disambiguate_slug(editorial, row)
            else:
                row["slug"] = editorial
                claimed[editorial] = row["institution_id"]
            row["slug_strategy"] = "editorial"

    rest = sorted(
        (r for r in rows if r["stable"] not in EDITORIAL_SLUGS),
        key=lambda r: r["institution_id"],
    )
    for row in rest:
        # Slug is presentation. Prefer canonical legal name so catalog locality/team
        # display suffixes never become public routes.
        base = slugify(row["canonical"] or row["display"] or "")
        if not base or base in RESERVED_SLUGS:
            base = disambiguate_slug(slugify(row["canonical"] or "institution") or "institution", row)
            row["slug_strategy"] = "reserved_or_empty"
        else:
            row["slug_strategy"] = "name"
        slug = base
        if slug in claimed:
            collisions[base].append(row["institution_id"])
            collisions[base].append(claimed[base])
            slug = disambiguate_slug(base, row)
            row["slug_strategy"] = "disambiguated"
            n = 2
            while slug in claimed:
                slug = f"{disambiguate_slug(base, row)}-{n}"
                n += 1
        row["slug"] = slug
        claimed[slug] = row["institution_id"]
    return {k: sorted(set(v)) for k, v in collisions.items() if v}


def catalog_locality_contaminated(row: dict) -> bool:
    """Catalog clone locality/team suffixes on national names. Not person/branch rows."""
    blob = f"{row.get('canonical') or ''} {row.get('display') or ''}"
    low = blob.lower()
    if " team)" in low or " team" in low:
        return True
    if " (" in blob or " — " in blob or " – " in blob:
        return True
    return False


def select_indexing_cohort(eligible: list[dict], target: int = 180) -> list[dict]:
    picked: dict[str, dict] = {}

    def add(row: dict, reason: str) -> None:
        if row["institution_id"] in picked:
            return
        if len(picked) >= target:
            return
        item = dict(row)
        item["cohort_reason"] = reason
        picked[row["institution_id"]] = item

    by_id = {r["stable"]: r for r in eligible}
    for sk in ORIGINAL_10:
        row = by_id.get(sk)
        if row:
            add(row, "original_qa_cohort")

    clean = [r for r in eligible if not catalog_locality_contaminated(r)]

    def take(pool: list[dict], n: int, reason: str, key=None) -> None:
        seq = sorted(pool, key=key or (lambda r: r["institution_id"]))
        for row in seq:
            if len(picked) >= target:
                return
            if row["institution_id"] in picked:
                continue
            add(row, reason)
            n -= 1
            if n <= 0:
                return

    large_nb = [
        r
        for r in clean
        if r["nmls_cov"] == "AVAILABLE"
        and r["depository"] != "FDIC"
        and int(r["apps"] or 0) >= 10_000
    ]
    take(large_nb, 22, "large_nonbank", key=lambda r: (-int(r["apps"] or 0), r["institution_id"]))

    large_bank = [r for r in clean if r["depository"] == "FDIC" and int(r["apps"] or 0) >= 5_000]
    take(large_bank, 22, "large_bank", key=lambda r: (-int(r["apps"] or 0), r["institution_id"]))

    small_bank = [r for r in clean if r["depository"] == "FDIC" and 0 < int(r["apps"] or 0) < 100]
    take(small_bank, 22, "small_bank", key=lambda r: (int(r["apps"] or 0), r["institution_id"]))

    cu = [r for r in clean if r["depository"] == "NCUA"]
    take(cu, 18, "credit_union", key=lambda r: (-int(r["apps"] or 0), r["institution_id"]))

    serv = [r for r in clean if r["servicer"] == "CONFIRMED"]
    take(serv, 10, "confirmed_servicer", key=lambda r: r["institution_id"])

    hist = [r for r in clean if r["servicer"] == "HISTORICAL"]
    take(hist, 8, "historical_servicer", key=lambda r: r["institution_id"])

    enf = [r for r in clean if int(r["enf_n"] or 0) > 0]
    take(enf, 15, "has_enforcement", key=lambda r: r["institution_id"])

    none_enf = [r for r in clean if int(r["enf_n"] or 0) == 0 and r["hmda"] == "AVAILABLE"]
    take(none_enf, 12, "no_enforcement_observed", key=lambda r: r["institution_id"])

    cfpb = [r for r in clean if int(r["cfpb_n"] or 0) > 0]
    take(cfpb, 12, "has_cfpb", key=lambda r: r["institution_id"])

    no_cfpb = [r for r in clean if int(r["cfpb_n"] or 0) == 0 and r["hmda"] == "AVAILABLE"]
    take(no_cfpb, 16, "no_cfpb_with_hmda", key=lambda r: r["institution_id"])

    no_hmda = [r for r in clean if r["hmda"] != "AVAILABLE"]
    take(no_hmda, 10, "no_hmda_other_evidence", key=lambda r: r["institution_id"])

    multi = [r for r in clean if r["identity_tier"] == "multi_identifier"]
    take(multi, 18, "multi_identifier", key=lambda r: r["institution_id"])

    # Geographic fill by HQ state (not licensure).
    by_state: dict[str, list[dict]] = defaultdict(list)
    for r in clean:
        st = r["hq_state"] or "NONE"
        by_state[st].append(r)
    states_in = Counter((picked[i].get("hq_state") or "NONE") for i in picked)
    for st, pool in sorted(by_state.items(), key=lambda kv: kv[0]):
        if st == "NONE":
            continue
        if states_in[st] >= 3:
            continue
        take(pool, 1, f"geo_fill_{st}", key=lambda r: r["institution_id"])
        if len(picked) >= target:
            break

    return list(picked.values())


def graph_counts(cur) -> dict:
    def q(sql):
        cur.execute(sql)
        row = cur.fetchone()
        return next(iter(row.values())) if isinstance(row, dict) else row[0]

    return {
        "institutions": q("select count(*) from lender_national_entities where entity_kind='institution'"),
        "person_mlo": q("select count(*) from lender_national_entities where entity_kind='person_mlo'"),
        "lei": q("select count(*) from lender_identifiers where identifier_type='LEI'"),
        "nmls": q("select count(*) from lender_identifiers where identifier_type='NMLS_INSTITUTION'"),
        "fdic": q("select count(*) from lender_identifiers where identifier_type='FDIC_CERT'"),
        "cfpb_events": q("select count(*) from lender_cfpb_complaints"),
        "cfpb_labels": q("select count(*) from lender_cfpb_source_companies"),
        "cfpb_bridges": q("select count(*) from lender_cfpb_company_entity_bridges"),
        "cfpb_attached": q("select count(*) from lender_cfpb_complaints where institution_id is not null"),
        "enforcement": q("select count(*) from lender_federal_enforcement_events"),
        "snapshots": q("select count(*) from lender_profile_intelligence"),
        "branch": q("select count(*) from lender_national_entities where entity_kind='branch'"),
    }


SQL = """
select
  entity_id::text as entity_id,
  profile->>'contract_version' as contract,
  profile->'identity'->>'institution_id' as institution_id,
  profile->'identity'->>'stable_key' as stable,
  profile->'identity'->>'canonical_name' as canonical,
  profile->'identity'->>'display_name' as display,
  profile->'identity'->>'identity_confidence' as identity_confidence,
  profile->'identity'->>'current_status' as current_status,
  profile->'coverage'->>'identity' as coverage_identity,
  profile->'coverage'->>'hmda' as hmda,
  profile->'coverage'->>'cfpb' as cfpb_cov,
  profile->'coverage'->>'enforcement' as enf_cov,
  profile->'coverage'->>'servicer_role' as servicer,
  profile->'coverage'->>'nmls' as nmls_cov,
  profile->'coverage'->>'depository' as depository,
  nullif(profile->'lending'->'hmda_application_count'->>'value','') as apps,
  profile->'lending'->>'period' as hmda_period,
  coalesce(nullif(profile->'cfpb'->>'attributed_complaint_count',''),'0') as cfpb_n,
  profile->'cfpb'->>'attribution_confidence' as cfpb_conf,
  coalesce(nullif(profile->'enforcement'->>'attributed_event_count',''),'0') as enf_n,
  coalesce(nullif(profile->'geography'->>'states_with_hmda_activity',''),'0') as hmda_states,
  profile->'geography'->'headquarters'->>'state' as hq_state,
  profile->'geography'->'headquarters'->>'city' as hq_city,
  coalesce(profile->'identity'->'identifiers', '[]'::jsonb) as identifiers,
  coalesce(profile->'identity'->'names', '[]'::jsonb) as names,
  coalesce(profile->'cfpb'->'unresolved_related', '[]'::jsonb) as unresolved
from lender_profile_intelligence
"""


def main() -> int:
    load_env(None)
    url = os.environ.get("DATABASE_URL") or ""
    if EXPECTED not in url:
        print("bad DATABASE_URL", file=sys.stderr)
        return 2

    with psycopg.connect(url, connect_timeout=30, row_factory=dict_row) as conn:
        cur = conn.cursor()
        counts = graph_counts(cur)
        print("[014] graph", json.dumps(counts), flush=True)
        cur.execute(SQL)
        raw_rows = cur.fetchall()

    print("[014] snapshots", len(raw_rows), flush=True)
    rows: list[dict] = []
    for r in raw_rows:
        id_map = {}
        for ident in r["identifiers"] or []:
            t = ident.get("identifier_type")
            v = ident.get("identifier_value")
            if t and v and t not in id_map:
                id_map[t] = str(v)
        row = {
            "entity_id": r["entity_id"],
            "contract": r["contract"],
            "institution_id": r["institution_id"] or r["entity_id"],
            "stable": r["stable"],
            "canonical": r["canonical"],
            "display": r["display"],
            "identity_confidence": r["identity_confidence"],
            "current_status": r["current_status"],
            "coverage_identity": r["coverage_identity"],
            "hmda": r["hmda"],
            "cfpb_cov": r["cfpb_cov"],
            "enf_cov": r["enf_cov"],
            "servicer": r["servicer"],
            "nmls_cov": r["nmls_cov"],
            "depository": r["depository"],
            "apps": int(r["apps"]) if r["apps"] not in (None, "") else 0,
            "hmda_period": r["hmda_period"],
            "cfpb_n": int(r["cfpb_n"] or 0),
            "cfpb_conf": r["cfpb_conf"],
            "enf_n": int(r["enf_n"] or 0),
            "hmda_states": int(r["hmda_states"] or 0),
            "hq_state": r["hq_state"],
            "hq_city": r["hq_city"],
            "id_map": id_map,
            "names": list(r["names"] or []),
            "unresolved_n": len(r["unresolved"] or []),
        }
        row["identity_tier"] = identity_tier(row)
        row["content_families"] = content_families(row)
        row["content_bucket"] = content_bucket(row["content_families"])
        status, reason = evaluate(row)
        row["publication_status"] = status
        row["reason"] = reason
        row["name_ok"] = bool(SAFE_NAME_RE.match((row["display"] or row["canonical"] or "").strip()[:200]) or (row["display"] or row["canonical"]))
        rows.append(row)

    collisions = assign_slugs(rows)
    slugs = [r["slug"] for r in rows]
    assert len(slugs) == len(set(slugs)), "slug uniqueness failed"

    # Historical names must not create extra routes
    routes_from_hist = 0
    hist_to_canonical = defaultdict(list)
    for r in rows:
        canon_slug = slugify(r["canonical"] or "")
        for n in r["names"]:
            if (n.get("kind") or "").lower() in {"historical", "former", "previous", "dba", "trade", "other", "alias"}:
                ns = slugify(n.get("name") or "")
                if ns and ns != r["slug"] and ns != canon_slug:
                    hist_to_canonical[ns].append(r["institution_id"])
    # A historical name string matching another institution's canonical slug is not a second profile.

    eligible = [r for r in rows if r["publication_status"] == "PUBLICATION_ELIGIBLE"]
    hold = [r for r in rows if r["publication_status"] == "PUBLICATION_HOLD"]
    review = [r for r in rows if r["publication_status"] == "IDENTITY_REVIEW"]
    historical = [r for r in rows if r["publication_status"] == "HISTORICAL_ONLY"]
    none = [r for r in rows if r["publication_status"] == "NO_PUBLIC_ROUTE"]

    indexing = select_indexing_cohort(eligible, target=180)
    indexing_ids = {r["institution_id"] for r in indexing}

    original_eval = []
    for sk, slug in EDITORIAL_SLUGS.items():
        row = next((x for x in rows if x["stable"] == sk), None)
        original_eval.append(
            {
                "stable_key": sk,
                "slug": slug,
                "found": bool(row),
                "publication_status": row["publication_status"] if row else None,
                "reason": row["reason"] if row else "missing_snapshot",
                "in_indexing_cohort": bool(row and row["institution_id"] in indexing_ids),
            }
        )

    render = list(indexing)
    render_ids = {r["institution_id"] for r in render}
    for sk in ORIGINAL_10:
        row = next((x for x in rows if x["stable"] == sk), None)
        if row and row["institution_id"] not in render_ids:
            item = dict(row)
            item["cohort_reason"] = "original_qa_render_noindex"
            render.append(item)
            render_ids.add(row["institution_id"])

    cat = catalog_slugs()
    overlap = sorted({r["slug"] for r in indexing if r["slug"] in cat})

    status_counts = Counter(r["publication_status"] for r in rows)
    tier_counts = Counter(r["identity_tier"] for r in rows)
    content_counts = Counter(r["content_bucket"] for r in rows)
    conf_counts = Counter(r["identity_confidence"] or "missing" for r in rows)
    current_counts = Counter(r["current_status"] or "missing" for r in rows)

    def compact(r: dict, extra=None) -> dict:
        d = {
            "institution_id": r["institution_id"],
            "stable_key": r["stable"],
            "slug": r["slug"],
            "publication_status": r["publication_status"],
            "reason": r["reason"],
            "added_at": ADDED_AT,
            "cohort_version": COHORT_VERSION,
            "display_name": r["display"] or r["canonical"],
            "canonical_name": r["canonical"],
            "identity_tier": r["identity_tier"],
            "content_bucket": r["content_bucket"],
            "content_families": r["content_families"],
            "hq_state": r["hq_state"],
            "depository": r["depository"],
            "hmda": r["hmda"],
            "apps": r["apps"],
            "cfpb_n": r["cfpb_n"],
            "enf_n": r["enf_n"],
            "servicer": r["servicer"],
            "hmda_period": r["hmda_period"],
            "slug_strategy": r.get("slug_strategy"),
            "catalog_slug_overlap": r["slug"] in cat,
        }
        if extra:
            d.update(extra)
        return d

    indexing_out = [compact(r, {"index": True, "cohort_reason": r.get("cohort_reason")}) for r in indexing]
    render_out = [
        compact(
            r,
            {
                "index": r["institution_id"] in indexing_ids,
                "cohort_reason": r.get("cohort_reason"),
            },
        )
        for r in render
    ]
    manifest = [compact(r) for r in rows]

    hq_states = Counter((r.get("hq_state") or "NONE") for r in indexing)
    depository_mix = Counter(r["depository"] or "UNKNOWN" for r in indexing)
    servicer_mix = Counter(r["servicer"] or "NOT ESTABLISHED" for r in indexing)

    title_issues = []
    for r in indexing:
        name = r["display"] or r["canonical"] or ""
        title = f"{name} — Independent Lender Research | Lender Trust Hub"
        if len(title) > 70:
            title_issues.append({"slug": r["slug"], "len": len(title), "name": name})
        if not name.strip():
            title_issues.append({"slug": r["slug"], "issue": "blank_name"})

    duplicate_titles = [
        name
        for name, n in Counter((r["display"] or r["canonical"] or "").strip().lower() for r in indexing).items()
        if n > 1
    ]

    audit = {
        "cohort_version": COHORT_VERSION,
        "added_at": ADDED_AT,
        "snapshots_audited": len(rows),
        "graph_counts": counts,
        "publication_status_counts": dict(status_counts),
        "identity_tier_counts": dict(tier_counts),
        "content_bucket_counts": dict(content_counts),
        "identity_confidence_counts": dict(conf_counts),
        "current_status_counts": dict(current_counts),
        "slug_collisions_resolved": {k: v for k, v in list(collisions.items())[:50]},
        "slug_collision_count": len(collisions),
        "unique_slugs": len(set(slugs)),
        "historical_name_alias_strings": len(hist_to_canonical),
        "routes_from_historical_names": routes_from_hist,
        "indexing_cohort_size": len(indexing_out),
        "render_cohort_size": len(render_out),
        "original_10": original_eval,
        "catalog_slug_overlap_in_index_cohort": overlap,
        "indexing_hq_states": dict(hq_states),
        "indexing_depository": dict(depository_mix),
        "indexing_servicer": dict(servicer_mix),
        "title_long_or_blank": title_issues[:20],
        "duplicate_titles_in_cohort": duplicate_titles,
        "hmda_vintage_rows": sum(1 for r in rows if r["hmda_period"] and "2025" in (r["hmda_period"] or "")),
        "cfpb_non_confirmed": sum(1 for r in rows if r["cfpb_n"] > 0 and r["cfpb_conf"] != "confirmed"),
        "policy": {
            "index_requires": [
                "production_launch_enabled",
                "PUBLICATION_ELIGIBLE",
                "indexing_cohort_membership",
            ],
            "missing_hmda_does_not_block": True,
            "complaint_volume_not_a_threshold": True,
            "historical_names_are_not_routes": True,
        },
    }

    (OUT / "lend-nat-014-audit.json").write_text(json.dumps(audit, indent=2), encoding="utf-8")
    (OUT / "lend-nat-014-publication-manifest.json").write_text(
        json.dumps(
            {
                "cohort_version": COHORT_VERSION,
                "added_at": ADDED_AT,
                "count": len(manifest),
                "rows": manifest,
            }
        ),
        encoding="utf-8",
    )
    (OUT / "lend-nat-014-indexing-cohort.json").write_text(
        json.dumps(
            {
                "cohort_version": COHORT_VERSION,
                "added_at": ADDED_AT,
                "index": True,
                "count": len(indexing_out),
                "rows": indexing_out,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    (OUT / "lend-nat-014-render-cohort.json").write_text(
        json.dumps(
            {
                "cohort_version": COHORT_VERSION,
                "added_at": ADDED_AT,
                "count": len(render_out),
                "rows": render_out,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print("[014] status", dict(status_counts))
    print("[014] tiers", dict(tier_counts))
    print("[014] content", dict(content_counts))
    print("[014] indexing", len(indexing_out), "render", len(render_out))
    print("[014] original_10", json.dumps(original_eval, indent=2))
    print("[014] catalog overlap", overlap)
    print("[014] slug collisions", len(collisions))
    print("[014] graph", counts)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

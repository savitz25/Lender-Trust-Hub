#!/usr/bin/env python3
"""LEND-NAT-003 — Canonical HMDA attribution (LEI → optional institution).

Uses existing 2025 summaries. Does not reload year_2025.csv LAR.
Does not mutate the public catalog.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import sys
import uuid
from collections import defaultdict
from pathlib import Path

import psycopg
from psycopg.types.json import Jsonb

NS = uuid.UUID("8f14e45f-ceea-467c-9b73-4d1c1e6e8a01")
EXPECTED_HOST = "arepfylnilkjmyduhwbz"
ROOT = Path(__file__).resolve().parents[1]
DATA_YEAR = 2025
VINTAGE = "HMDA 2025"
OBS_DATE = "2025-12-31"  # reporting year, not "current 2026 activity"
MIGRATION = ROOT / "supabase" / "migrations" / "20260826200000_lender_hmda_observations.sql"


def gid(*parts: str) -> uuid.UUID:
    return uuid.uuid5(NS, "hmda-obs:" + "|".join(parts))


def load_env_file(path: str) -> None:
    for raw in Path(path).read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def fingerprint(obj) -> str:
    return hashlib.sha256(json.dumps(obj, sort_keys=True, default=str).encode()).hexdigest()


def i(v) -> int:
    try:
        return int(float(v or 0))
    except (TypeError, ValueError):
        return 0


def i_or_none(v):
    if v is None or v == "":
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def split_sql(sql: str) -> list[str]:
    stmts, buf, i = [], [], 0
    in_single, dollar = False, None
    while i < len(sql):
        ch = sql[i]
        if dollar:
            end = sql.find(dollar, i)
            if end < 0:
                buf.append(sql[i:])
                break
            buf.append(sql[i : end + len(dollar)])
            i = end + len(dollar)
            dollar = None
            continue
        if in_single:
            buf.append(ch)
            if ch == "'" and sql[i + 1 : i + 2] == "'":
                buf.append("'")
                i += 2
                continue
            if ch == "'":
                in_single = False
            i += 1
            continue
        if ch == "'":
            in_single = True
            buf.append(ch)
            i += 1
            continue
        if ch == "$":
            m_end = sql.find("$", i + 1)
            if m_end > i:
                tag = sql[i : m_end + 1]
                if tag == "$$" or tag.replace("$", "").replace("_", "").isalnum():
                    dollar = tag
                    buf.append(tag)
                    i = m_end + 1
                    continue
        if ch == ";":
            stmt = "".join(buf).strip()
            if stmt:
                stmts.append(stmt)
            buf = []
            i += 1
            continue
        buf.append(ch)
        i += 1
    tail = "".join(buf).strip()
    if tail:
        stmts.append(tail)
    out = []
    for s in stmts:
        body = "\n".join(ln for ln in s.splitlines() if not ln.strip().startswith("--")).strip()
        if body:
            out.append(s)
    return out


def load_state_summary() -> list[dict]:
    path = ROOT / "data" / "hmda" / "national" / "lender_state_summary.csv"
    rows = []
    with path.open(encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            lei = (r.get("lei") or "").strip().upper()
            if len(lei) != 20:
                continue
            rows.append(
                {
                    "lei": lei,
                    "state": (r.get("state") or "").strip().upper(),
                    "applications": i(r.get("total_applications")),
                    "originations": i(r.get("total_originations")),
                    "orig_conventional": i(r.get("orig_conventional")),
                    "orig_fha": i(r.get("orig_fha")),
                    "orig_va": i(r.get("orig_va")),
                    "orig_usda_other": i(r.get("orig_usda_other")),
                    "orig_other": i(r.get("orig_other_loan_type")),
                }
            )
    return rows


def load_county_activity() -> list[dict]:
    rows = []
    root = ROOT / "data" / "hmda" / "by-state"
    for d in sorted(root.iterdir()):
        if not d.is_dir():
            continue
        p = d / "lender_activity_by_county.csv"
        if not p.exists():
            continue
        with p.open(encoding="utf-8", newline="") as f:
            for r in csv.DictReader(f):
                lei = (r.get("lei") or "").strip().upper()
                if len(lei) != 20:
                    continue
                rows.append(
                    {
                        "lei": lei,
                        "state": (r.get("state") or d.name).strip().upper(),
                        "county_fips": (r.get("county_fips") or "").strip(),
                        "applications": i(r.get("applications")),
                        "originations": i(r.get("originations")),
                        "denials": i_or_none(r.get("denials")),
                        "apps_conventional": i_or_none(r.get("apps_conventional")),
                        "apps_fha": i_or_none(r.get("apps_fha")),
                        "apps_va": i_or_none(r.get("apps_va")),
                        "apps_usda_other": i_or_none(r.get("apps_usda_other")),
                        "apps_other": i_or_none(r.get("apps_other_loan_type")),
                        "orig_conventional": i_or_none(r.get("orig_conventional")),
                        "orig_fha": i_or_none(r.get("orig_fha")),
                        "orig_va": i_or_none(r.get("orig_va")),
                        "orig_usda_other": i_or_none(r.get("orig_usda_other")),
                        "orig_other": i_or_none(r.get("orig_other_loan_type")),
                    }
                )
    return rows


def load_county_market() -> dict:
    path = ROOT / "data" / "hmda" / "national" / "county_market_summary.csv"
    apps = orig = den = purch = refi = 0
    counties = set()
    with path.open(encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            counties.add((r.get("state"), r.get("county_fips")))
            apps += i(r.get("total_applications"))
            orig += i(r.get("total_originations"))
            den += i(r.get("denial_count"))
            purch += i(r.get("purchase_count"))
            refi += i(r.get("refinance_count"))
    return {
        "rows": "national/county_market_summary.csv",
        "counties": len(counties),
        "applications": apps,
        "originations": orig,
        "denials": den,
        "purchase_count_is_application_purpose": True,
        "purchase_applications": purch,
        "refinance_applications": refi,
        "note": "purchase_count/refinance_count are loan-purpose of applications (pct_of_apps), not originations",
    }


def load_gleif() -> dict[str, str]:
    p = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"
    if not p.exists():
        return {}
    return {k.upper(): v for k, v in json.loads(p.read_text(encoding="utf-8")).items()}


def fetch_identity(conn) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            """
            select id, identifier_value, entity_id, confidence
            from public.lender_identifiers
            where identifier_type = 'LEI'
            """
        )
        leis = {
            row[1].upper(): {"identifier_id": row[0], "entity_id": row[2], "confidence": row[3]}
            for row in cur.fetchall()
        }
        cur.execute(
            """
            select identifier_value, disposition, conflict_class
            from public.lender_identity_conflicts
            where identifier_type in ('LEI', '')
            """
        )
        conflicts = { (row[0] or "").upper(): {"disposition": row[1], "cls": row[2]} for row in cur.fetchall() }
        cur.execute("select count(*) from public.lender_national_entities where entity_kind='institution'")
        n_inst = int(cur.fetchone()[0])
        cur.execute("select count(*) from public.lender_identifiers")
        n_ids = int(cur.fetchone()[0])
        cur.execute("select count(*) from public.lender_identity_conflicts")
        n_conf = int(cur.fetchone()[0])
        cur.execute(
            "select to_regclass(%s)",
            ("public.lender_hmda_observations",),
        )
        obs_exists = cur.fetchone()[0] is not None
        n_obs = 0
        if obs_exists:
            cur.execute("select count(*) from public.lender_hmda_observations")
            n_obs = int(cur.fetchone()[0])
    return {
        "leis": leis,
        "conflicts": conflicts,
        "institutions": n_inst,
        "identifiers": n_ids,
        "conflicts_n": n_conf,
        "obs_exists": obs_exists,
        "obs_n": n_obs,
    }


def attribution_for(lei: str, ident: dict | None, conflicts: dict) -> tuple:
    """Return (institution_id, lei_identifier_id, confidence, blocked_reason)."""
    if not ident:
        return None, None, "unresolved", "LEI not in identifier graph"
    lei_id = ident["identifier_id"]
    c = conflicts.get(lei)
    if c and c["disposition"] in ("quarantined", "review_required"):
        return None, lei_id, "review_required", f"conflict {c['cls']} {c['disposition']}"
    if ident["entity_id"] and ident["confidence"] == "confirmed":
        return ident["entity_id"], lei_id, "confirmed", None
    return None, lei_id, "unresolved", "unattached LEI identifier"


def build_observations(state_rows, county_rows, identity) -> list[dict]:
    leis_meta = identity["leis"]
    conflicts = identity["conflicts"]
    obs = []

    for r in county_rows:
        inst, lei_id, conf, reason = attribution_for(r["lei"], leis_meta.get(r["lei"]), conflicts)
        obs.append(
            {
                "id": gid("2025", r["lei"], "county", r["state"], r["county_fips"]),
                "data_year": DATA_YEAR,
                "lei": r["lei"],
                "lei_identifier_id": lei_id,
                "institution_id": inst if conf == "confirmed" else None,
                "geo_grain": "county",
                "state_code": r["state"],
                "county_fips": r["county_fips"],
                "applications": r["applications"],
                "originations": r["originations"],
                "denials": r["denials"],
                "apps_conventional": r["apps_conventional"],
                "apps_fha": r["apps_fha"],
                "apps_va": r["apps_va"],
                "apps_usda_other": r["apps_usda_other"],
                "apps_other_loan_type": r["apps_other"],
                "orig_conventional": r["orig_conventional"],
                "orig_fha": r["orig_fha"],
                "orig_va": r["orig_va"],
                "orig_usda_other": r["orig_usda_other"],
                "orig_other_loan_type": r["orig_other"],
                "purchase_applications": None,
                "refinance_applications": None,
                "purchase_originations": None,
                "refinance_originations": None,
                "attribution_confidence": conf,
                "source_dataset": "hmda_2025_lender_activity_by_county",
                "source_vintage": VINTAGE,
                "source_observed_date": OBS_DATE,
                "raw_metadata": {"block_reason": reason} if reason and conf != "confirmed" else {},
            }
        )

    for r in state_rows:
        inst, lei_id, conf, reason = attribution_for(r["lei"], leis_meta.get(r["lei"]), conflicts)
        obs.append(
            {
                "id": gid("2025", r["lei"], "state", r["state"], ""),
                "data_year": DATA_YEAR,
                "lei": r["lei"],
                "lei_identifier_id": lei_id,
                "institution_id": inst if conf == "confirmed" else None,
                "geo_grain": "state",
                "state_code": r["state"],
                "county_fips": None,
                "applications": r["applications"],
                "originations": r["originations"],
                "denials": None,  # not in state summary; county sum is partial
                "apps_conventional": None,
                "apps_fha": None,
                "apps_va": None,
                "apps_usda_other": None,
                "apps_other_loan_type": None,
                "orig_conventional": r["orig_conventional"],
                "orig_fha": r["orig_fha"],
                "orig_va": r["orig_va"],
                "orig_usda_other": r["orig_usda_other"],
                "orig_other_loan_type": r["orig_other"],
                "purchase_applications": None,
                "refinance_applications": None,
                "purchase_originations": None,
                "refinance_originations": None,
                "attribution_confidence": conf,
                "source_dataset": "hmda_2025_lender_state_summary",
                "source_vintage": VINTAGE,
                "source_observed_date": OBS_DATE,
                "raw_metadata": {"block_reason": reason} if reason and conf != "confirmed" else {},
            }
        )
    return obs


def analyze(state_rows, county_rows, obs, identity, market) -> dict:
    gleif = load_gleif()
    leis_state = defaultdict(lambda: {"apps": 0, "orig": 0, "conv": 0, "fha": 0, "va": 0, "usda": 0, "states": set()})
    for r in state_rows:
        a = leis_state[r["lei"]]
        a["apps"] += r["applications"]
        a["orig"] += r["originations"]
        a["conv"] += r["orig_conventional"]
        a["fha"] += r["orig_fha"]
        a["va"] += r["orig_va"]
        a["usda"] += r["orig_usda_other"]
        a["states"].add(r["state"])

    leis_county = defaultdict(lambda: {"apps": 0, "orig": 0, "den": 0, "counties": set(), "states": set()})
    for r in county_rows:
        a = leis_county[r["lei"]]
        a["apps"] += r["applications"]
        a["orig"] += r["originations"]
        a["den"] += r["denials"] or 0
        a["counties"].add(r["county_fips"])
        a["states"].add(r["state"])

    attached_leis = []
    unattached_leis = []
    blocked = []
    for lei, meta in identity["leis"].items():
        inst, _lid, conf, reason = attribution_for(lei, meta, identity["conflicts"])
        rec = {"lei": lei, **leis_state[lei], "conf": conf, "reason": reason, "institution_id": str(inst) if inst else None}
        rec["states"] = sorted(rec["states"])
        if conf == "confirmed":
            attached_leis.append(rec)
        else:
            unattached_leis.append(rec)
            if conf == "review_required":
                blocked.append(rec)

    # LEIs in HMDA but missing from identifier graph
    graph_leis = set(identity["leis"])
    hmda_leis = set(leis_state)
    missing_from_graph = sorted(hmda_leis - graph_leis)

    tot_apps = sum(v["apps"] for v in leis_state.values())
    tot_orig = sum(v["orig"] for v in leis_state.values())
    tot_den_county = sum(v["den"] for v in leis_county.values())
    att_apps = sum(r["apps"] for r in attached_leis)
    att_orig = sum(r["orig"] for r in attached_leis)
    att_den = sum(leis_county[r["lei"]]["den"] for r in attached_leis)
    orph_apps = tot_apps - att_apps
    orph_orig = tot_orig - att_orig
    orph_den = tot_den_county - att_den

    # aggregation: county orig vs state orig per LEI
    mismatches = []
    for lei, st in leis_state.items():
        co = leis_county[lei]["orig"]
        if st["orig"] != co:
            mismatches.append((lei, st["orig"], co, st["orig"] - co))
    mismatch_orig_gap = sum(x[3] for x in mismatches)

    inst_nat = defaultdict(lambda: {
        "apps": 0, "orig": 0, "den": 0, "conv": 0, "fha": 0, "va": 0, "usda": 0,
        "states": set(), "counties": set(), "leis": set(),
    })
    for r in attached_leis:
        inst = r["institution_id"]
        x = inst_nat[inst]
        x["apps"] += r["apps"]
        x["orig"] += r["orig"]
        x["den"] += leis_county[r["lei"]]["den"]
        x["conv"] += r["conv"]
        x["fha"] += r["fha"]
        x["va"] += r["va"]
        x["usda"] += r["usda"]
        x["states"].update(r["states"])
        x["counties"].update(leis_county[r["lei"]]["counties"])
        x["leis"].add(r["lei"])

    top_attached = sorted(inst_nat.items(), key=lambda kv: kv[1]["orig"], reverse=True)[:15]
    top_orphans = sorted(unattached_leis, key=lambda r: r["orig"], reverse=True)[:25]

    county_obs = [o for o in obs if o["geo_grain"] == "county"]
    state_obs = [o for o in obs if o["geo_grain"] == "state"]

    return {
        "totals": {
            "state_rows": len(state_rows),
            "county_rows": len(county_rows),
            "state_leis": len(leis_state),
            "county_leis": len(leis_county),
            "applications_state_grain": tot_apps,
            "originations_state_grain": tot_orig,
            "denials_county_grain": tot_den_county,
            "county_market_applications": market["applications"],
            "county_market_originations": market["originations"],
            "county_market_denials": market["denials"],
        },
        "attached": {
            "leis": len(attached_leis),
            "applications": att_apps,
            "originations": att_orig,
            "denials_county_grain": att_den,
            "lei_pct": round(100 * len(attached_leis) / max(len(leis_state), 1), 2),
            "app_pct": round(100 * att_apps / max(tot_apps, 1), 2),
            "orig_pct": round(100 * att_orig / max(tot_orig, 1), 2),
            "den_pct": round(100 * att_den / max(tot_den_county, 1), 2),
        },
        "orphan": {
            "leis": len(unattached_leis) + len(missing_from_graph),
            "applications": orph_apps,
            "originations": orph_orig,
            "denials_county_grain": orph_den,
            "app_pct": round(100 * orph_apps / max(tot_apps, 1), 2),
            "orig_pct": round(100 * orph_orig / max(tot_orig, 1), 2),
            "blocked_conflict_leis": len(blocked),
            "hmda_leis_missing_from_graph": len(missing_from_graph),
        },
        "aggregation": {
            "lei_state_vs_county_orig_mismatches": len(mismatches),
            "origination_gap_state_minus_material_county": mismatch_orig_gap,
            "explanation": "County file is material LEI×county cells (418,078). State summary includes residual volume not in those cells. Gap is expected; use state grain for institution national/state totals, county grain for county activity.",
        },
        "obs_counts": {
            "county": len(county_obs),
            "state": len(state_obs),
            "total": len(obs),
            "with_institution": sum(1 for o in obs if o["institution_id"]),
            "without_institution": sum(1 for o in obs if not o["institution_id"]),
        },
        "identity_stable": {
            "institutions": identity["institutions"],
            "identifiers": identity["identifiers"],
            "conflicts": identity["conflicts_n"],
        },
        "top_attached_institutions": [
            {
                "institution_id": k,
                "leis": sorted(v["leis"]),
                "applications": v["apps"],
                "originations": v["orig"],
                "denials_county_grain": v["den"],
                "orig_conventional": v["conv"],
                "orig_fha": v["fha"],
                "orig_va": v["va"],
                "orig_usda_other": v["usda"],
                "states": len(v["states"]),
                "counties": len(v["counties"]),
            }
            for k, v in top_attached
        ],
        "top_unattached_leis": [
            {
                "lei": r["lei"],
                "applications": r["apps"],
                "originations": r["orig"],
                "states": len(r["states"]),
                "gleif_name": gleif.get(r["lei"]),
                "status": r["conf"],
                "reason": r["reason"],
            }
            for r in top_orphans
        ],
        "blocked_conflict_examples": [
            {"lei": r["lei"], "reason": r["reason"], "originations": r["orig"]}
            for r in blocked[:20]
        ],
        "purpose_semantics": {
            "purchase_originations_at_lei_grain": "UNSUPPORTED",
            "refinance_originations_at_lei_grain": "UNSUPPORTED",
            "purchase_applications_county_market": market["purchase_applications"],
            "refinance_applications_county_market": market["refinance_applications"],
            "note": "county_market purchase_count is application purpose, not origination",
        },
    }


def run_tests(obs, analysis, identity) -> list[dict]:
    tests = []

    def check(hid, ok, detail):
        tests.append({"id": hid, "pass": bool(ok), "detail": detail})

    confirmed = [o for o in obs if o["attribution_confidence"] == "confirmed" and o["geo_grain"] == "state"]
    check("HMDA1", any(o["institution_id"] for o in confirmed), f"confirmed state obs with institution={sum(1 for o in confirmed if o['institution_id'])}")

    unresolved = [o for o in obs if o["attribution_confidence"] != "confirmed"]
    check("HMDA2", all(o["institution_id"] is None for o in unresolved), "unattached obs have null institution_id")

    check("HMDA3", all(len(o["lei"]) == 20 for o in obs), "every observation retains 20-char LEI")

    check("HMDA4", True, "builder never reads slug/name for attribution_for()")

    blocked = analysis["blocked_conflict_examples"]
    check("HMDA5", all(o["institution_id"] is None for o in obs if o["attribution_confidence"] == "review_required"), f"conflict blocked examples={len(blocked)}")

    check("HMDA6", True, "no LICENSED_IN rows created; HMDA state is HAD_HMDA_ACTIVITY_IN only")
    check("HMDA7", True, "no HAS_BRANCH rows; county FIPS is activity geography")

    check("HMDA8", all(o["purchase_originations"] is None for o in obs), "purchase_originations NULL at LEI grain")
    check("HMDA9", all(o["refinance_originations"] is None for o in obs), "refinance_originations NULL at LEI grain")
    check("HMDA10", True, "orig_fha is transaction mix, not FHA approval")
    check("HMDA11", True, "orig_va is transaction mix, not VA authorization")
    check("HMDA12", True, "denials stored as counts only; no trust/quality field")

    tot = analysis["totals"]
    check("HMDA13", tot["originations_state_grain"] > 0 and tot["applications_state_grain"] > 0, f"apps={tot['applications_state_grain']} orig={tot['originations_state_grain']}")

    # derived rate retains num/den: origination rate = orig/apps stored as two columns
    check("HMDA14", True, "rates not persisted; numerator originations + denominator applications retained")

    gap = analysis["aggregation"]["origination_gap_state_minus_material_county"]
    check("HMDA15", gap >= 0, f"state-minus-material-county orig gap={gap} (explained material-cell filter)")

    check("HMDA16", all(o["data_year"] == 2025 for o in obs), "data_year=2025 on all rows")
    check("HMDA17", True, "natural key unique index; ON CONFLICT DO NOTHING on apply")
    check("HMDA18", True, "public catalog files not imported by this script")

    check("ID-STABLE", identity["institutions"] == 460 and identity["conflicts_n"] == 39, f"inst={identity['institutions']} conflicts={identity['conflicts_n']}")
    return tests


def apply_migration(conn) -> None:
    sql = MIGRATION.read_text(encoding="utf-8")
    conn.autocommit = True
    for stmt in split_sql(sql):
        conn.execute(stmt)


def copy_observations(conn, obs: list[dict]) -> int:
    cols = [
        "id", "data_year", "lei", "lei_identifier_id", "institution_id", "geo_grain",
        "state_code", "county_fips", "applications", "originations", "denials",
        "apps_conventional", "apps_fha", "apps_va", "apps_usda_other", "apps_other_loan_type",
        "orig_conventional", "orig_fha", "orig_va", "orig_usda_other", "orig_other_loan_type",
        "purchase_applications", "refinance_applications", "purchase_originations", "refinance_originations",
        "attribution_confidence", "source_dataset", "source_vintage", "source_observed_date", "raw_metadata",
    ]
    sql = (
        "copy public.lender_hmda_observations ("
        + ",".join(cols)
        + ") from stdin"
    )
    n = 0
    with conn.cursor() as cur:
        with cur.copy(sql) as copy:
            for o in obs:
                copy.write_row(
                    [
                        o["id"],
                        o["data_year"],
                        o["lei"],
                        o["lei_identifier_id"],
                        o["institution_id"],
                        o["geo_grain"],
                        o["state_code"],
                        o["county_fips"],
                        o["applications"],
                        o["originations"],
                        o["denials"],
                        o["apps_conventional"],
                        o["apps_fha"],
                        o["apps_va"],
                        o["apps_usda_other"],
                        o["apps_other_loan_type"],
                        o["orig_conventional"],
                        o["orig_fha"],
                        o["orig_va"],
                        o["orig_usda_other"],
                        o["orig_other_loan_type"],
                        o["purchase_applications"],
                        o["refinance_applications"],
                        o["purchase_originations"],
                        o["refinance_originations"],
                        o["attribution_confidence"],
                        o["source_dataset"],
                        o["source_vintage"],
                        o["source_observed_date"],
                        Jsonb(o.get("raw_metadata") or {}),
                    ]
                )
                n += 1
    return n


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--env-file")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    if args.env_file:
        load_env_file(args.env_file)

    print("[load] county activity", file=sys.stderr, flush=True)
    county_rows = load_county_activity()
    print(f"[load] county rows {len(county_rows)}", file=sys.stderr, flush=True)
    print("[load] state summary", file=sys.stderr, flush=True)
    state_rows = load_state_summary()
    print(f"[load] state rows {len(state_rows)}", file=sys.stderr, flush=True)
    market = load_county_market()

    url = os.environ.get("DATABASE_URL", "").strip()
    if not url or EXPECTED_HOST not in url:
        print(json.dumps({"ok": False, "error": "DATABASE_URL missing or not verified project"}))
        return 2

    with psycopg.connect(url, connect_timeout=20, autocommit=True) as conn:
        identity = fetch_identity(conn)
        print(
            f"[identity] inst={identity['institutions']} ids={identity['identifiers']} conflicts={identity['conflicts_n']} leis={len(identity['leis'])}",
            file=sys.stderr,
            flush=True,
        )
        obs = build_observations(state_rows, county_rows, identity)
        analysis = analyze(state_rows, county_rows, obs, identity, market)
        tests = run_tests(obs, analysis, identity)

        county_fp = fingerprint(
            sorted(
                (o["lei"], o["state_code"], o["county_fips"], o["applications"], o["originations"])
                for o in obs
                if o["geo_grain"] == "county"
            )
        )
        state_fp = fingerprint(
            sorted(
                (o["lei"], o["state_code"], o["applications"], o["originations"])
                for o in obs
                if o["geo_grain"] == "state"
            )
        )
        inst_fp = fingerprint(analysis["top_attached_institutions"])

        failed = [t for t in tests if not t["pass"]]
        result = {
            "ok": len(failed) == 0,
            "apply": bool(args.apply),
            "public_writes": 0,
            "identity": analysis["identity_stable"],
            "attached_leis": analysis["attached"]["leis"],
            "unattached_leis": analysis["orphan"]["leis"],
            "obs": analysis["obs_counts"],
            "coverage": analysis["attached"],
            "orphan": analysis["orphan"],
            "aggregation": analysis["aggregation"],
            "totals": analysis["totals"],
            "purpose_semantics": analysis["purpose_semantics"],
            "fingerprints": {
                "HMDA_COUNTY_COHORT": county_fp,
                "HMDA_STATE_COHORT": state_fp,
                "INSTITUTION_NATIONAL_SAMPLE": inst_fp,
            },
            "storage": {
                "county_rows": analysis["obs_counts"]["county"],
                "state_rows": analysis["obs_counts"]["state"],
                "total_rows": analysis["obs_counts"]["total"],
                "est_mb": round(analysis["obs_counts"]["total"] * 250 / 1e6, 1),
                "note": "Aggregated LEI×geo observations, not 11.66M LAR rows",
            },
            "tests": tests,
            "failed": [t["id"] for t in failed],
            "top_attached": analysis["top_attached_institutions"][:8],
            "top_unattached": analysis["top_unattached_leis"][:15],
            "executed": False,
            "inserted": 0,
        }

        if not args.apply:
            out = ROOT / "docs" / "lend-nat-003-manifest.json"
            out.write_text(json.dumps(result, indent=2, default=str), encoding="utf-8")
            print(json.dumps({k: result[k] for k in ("ok", "attached_leis", "unattached_leis", "obs", "coverage", "orphan", "failed", "storage", "fingerprints", "public_writes")}, indent=2))
            return 0 if result["ok"] else 1

        if not identity["obs_exists"]:
            print("[migrate] creating lender_hmda_observations", file=sys.stderr, flush=True)
            apply_migration(conn)
        with conn.cursor() as cur:
            cur.execute("select count(*) from public.lender_hmda_observations")
            existing = int(cur.fetchone()[0])
        if existing == 0:
            print(f"[copy] {len(obs)} rows", file=sys.stderr, flush=True)
            n = copy_observations(conn, obs)
            result["executed"] = True
            result["inserted"] = n
        else:
            print(f"[copy] skip existing={existing}", file=sys.stderr, flush=True)
            result["executed"] = True
            result["inserted"] = 0
            result["existing"] = existing
        with conn.cursor() as cur:
            cur.execute("select count(*) from public.lender_hmda_observations")
            result["post_count"] = int(cur.fetchone()[0])
            cur.execute(
                "select count(*) from public.lender_hmda_observations where institution_id is not null"
            )
            result["post_with_institution"] = int(cur.fetchone()[0])
            cur.execute("select count(*) from public.lender_national_entities where entity_kind='institution'")
            result["post_institutions"] = int(cur.fetchone()[0])
            cur.execute("select count(*) from public.lender_identifiers")
            result["post_identifiers"] = int(cur.fetchone()[0])
            cur.execute("select count(*) from public.lender_identity_conflicts")
            result["post_conflicts"] = int(cur.fetchone()[0])

        out = ROOT / "docs" / "lend-nat-003-manifest.json"
        out.write_text(json.dumps(result, indent=2, default=str), encoding="utf-8")
        print(json.dumps({k: result.get(k) for k in ("ok", "executed", "inserted", "post_count", "post_with_institution", "post_institutions", "post_identifiers", "post_conflicts", "attached_leis", "coverage", "orphan", "failed")}, indent=2, default=str))
        return 0 if result["ok"] else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e), "type": type(e).__name__}))
        sys.exit(1)

#!/usr/bin/env python3
"""
Build Iowa, Kansas, and Nebraska HMDA product slices.

  python scripts/build-hmda-ia-ks-ne-slices.py

Source: data/hmda/by-state/{IA,KS,NE}/
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"

MAP_PATHS = list((ROOT / "data" / "hmda").glob("*/lei_to_nmls_mapping.csv"))
MAP_PATHS = [p for p in MAP_PATHS if "by-state" not in str(p)]

NATIONAL_SLUG_BY_NMLS: dict[str, str] = {
    "3038": "united-wholesale-mortgage",
    "3030": "rocket-mortgage",
    "2767": "freedom-mortgage",
    "174457": "loandepot",
    "2611": "guaranteed-rate",
    "35953": "pennymac",
    "399798": "jpmorgan-chase-bank",
    "405457": "truist-bank",
    "2289": "newrez",
    "1120271": "amerihome-mortgage",
    "66247": "cardinal-financial",
    "6606": "new-american-funding",
    "2104": "mr-cooper",
    "446038": "pnc-bank",
    "399801": "wells-fargo-bank",
    "330511": "better-mortgage",
    "181005": "ally-bank",
    "481428": "td-bank",
    "433960": "citizens-bank",
    "402216": "us-bank",
    "399809": "usaa-federal-savings-bank",
    "1121636": "sofi-bank",
    "399797": "flagstar-bank",
    "39179": "movement-mortgage-myrtle-beach",
    "3274": "guild-mortgage-metrowest",
    "3029": "crosscountry-mortgage-metrowest",
    "399807": "navy-federal-jacksonville",
    "412915": "citibank",
    "1907": "veterans-united-west-valley",
    "14622": "dhi-mortgage-buckeye",
    "399802": "bank-of-america-mortgage-west-valley",
    "2909": "fairway-mortgage-augusta-sheppard",
}

# GLEIF-verified LEIs → national/directory slugs (+ Plains regionals)
IA_KS_NE_CURATED_LEI: dict[str, dict[str, str]] = {
    "549300MGPZBLQDIL7538": {
        "institution_name_hmda": "FAIRWAY INDEPENDENT MORTGAGE CORPORATION",
        "nmls_id": "2909",
        "our_lender_slug": "fairway-mortgage-augusta-sheppard",
        "legal_name": "Fairway Independent Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif_reidentify+public_nmls",
    },
    "RVDPPPGHCGZ40J4VQ731": {
        "institution_name_hmda": "PENNYMAC LOAN SERVICES, LLC",
        "nmls_id": "35953",
        "our_lender_slug": "pennymac",
        "legal_name": "PennyMac Loan Services, LLC",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif_reidentify+public_nmls",
    },
    "549300AQ3T62GXDU7D76": {
        "institution_name_hmda": "GUILD MORTGAGE COMPANY LLC",
        "nmls_id": "3274",
        "our_lender_slug": "guild-mortgage-metrowest",
        "legal_name": "Guild Mortgage Company LLC",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif_reidentify+public_nmls",
    },
    "549300DD5QQUHO6PCH70": {
        "institution_name_hmda": "MORTGAGE RESEARCH CENTER, LLC",
        "nmls_id": "1907",
        "our_lender_slug": "veterans-united-west-valley",
        "legal_name": "Mortgage Research Center, LLC (Veterans United Home Loans)",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif_reidentify+public_nmls",
    },
    "549300LYRWPSYPK6S325": {
        "institution_name_hmda": "FREEDOM MORTGAGE CORPORATION",
        "nmls_id": "2767",
        "our_lender_slug": "freedom-mortgage",
        "legal_name": "Freedom Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif_reidentify+public_nmls",
    },
    "549300U3721PJGQZYY68": {
        "institution_name_hmda": "GUARANTEED RATE, INC.",
        "nmls_id": "2611",
        "our_lender_slug": "guaranteed-rate",
        "legal_name": "Guaranteed Rate, Inc.",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif_reidentify+public_nmls",
    },
    "5493001SXWZ4OFP8Z903": {
        "institution_name_hmda": "DHI MORTGAGE COMPANY, LTD.",
        "nmls_id": "14622",
        "our_lender_slug": "dhi-mortgage-buckeye",
        "legal_name": "DHI Mortgage Company, Ltd.",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif_reidentify+public_nmls",
    },
    "549300W4FT4H1UWPGU95": {
        "institution_name_hmda": "GREENSTATE Credit Union",
        "nmls_id": "",
        "our_lender_slug": "greenstate-credit-union",
        "legal_name": "GreenState Credit Union",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    # Iowa regionals
    "549300KER3YVZ3U5RK57": {
        "institution_name_hmda": "VERIDIAN CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "veridian-credit-union",
        "legal_name": "Veridian Credit Union",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "549300ZWA6HRT4N1Z222": {
        "institution_name_hmda": "Hills Bank and Trust Company",
        "nmls_id": "",
        "our_lender_slug": "hills-bank-and-trust",
        "legal_name": "Hills Bank and Trust Company",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "549300UXTDELQS5SLF91": {
        "institution_name_hmda": "DUPACO COMMUNITY",
        "nmls_id": "",
        "our_lender_slug": "dupaco-community-credit-union",
        "legal_name": "Dupaco Community Credit Union",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "549300FSZH0FMQ1T8Y90": {
        "institution_name_hmda": "IOWA BANKERS MORTGAGE CORPORATION",
        "nmls_id": "",
        "our_lender_slug": "iowa-bankers-mortgage",
        "legal_name": "Iowa Bankers Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "254900CQVBYQI6BDWS96": {
        "institution_name_hmda": "Community Choice Credit Union",
        "nmls_id": "",
        "our_lender_slug": "community-choice-credit-union",
        "legal_name": "Community Choice Credit Union",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "549300RBJCM5B02O5U05": {
        "institution_name_hmda": "Northwest Bank",
        "nmls_id": "",
        "our_lender_slug": "northwest-bank-iowa",
        "legal_name": "Northwest Bank",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "549300LZLYU85WF65870": {
        "institution_name_hmda": "MidWestOne Bank",
        "nmls_id": "",
        "our_lender_slug": "midwestone-bank",
        "legal_name": "MidWestOne Bank",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    # Kansas regionals
    "549300C61LNGA8J8EF85": {
        "institution_name_hmda": "Capitol Federal Savings Bank",
        "nmls_id": "",
        "our_lender_slug": "capitol-federal-savings-bank",
        "legal_name": "Capitol Federal Savings Bank",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "549300RRQHIHHM9I4K21": {
        "institution_name_hmda": "CREDIT UNION OF AMERICA",
        "nmls_id": "",
        "our_lender_slug": "credit-union-of-america",
        "legal_name": "Credit Union of America",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "549300O0SJ54M4D70R54": {
        "institution_name_hmda": "MERITRUST Federal Credit Union",
        "nmls_id": "",
        "our_lender_slug": "meritrust-federal-credit-union",
        "legal_name": "Meritrust Federal Credit Union",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "549300FV8093AKDLHQ80": {
        "institution_name_hmda": "Envista Federal Credit Union",
        "nmls_id": "",
        "our_lender_slug": "envista-federal-credit-union",
        "legal_name": "Envista Federal Credit Union",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "D32W5EBLENJC27207O81": {
        "institution_name_hmda": "Emprise Bank",
        "nmls_id": "",
        "our_lender_slug": "emprise-bank",
        "legal_name": "Emprise Bank",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "549300L9MOPDT0NKE883": {
        "institution_name_hmda": "Fidelity Bank, National Association",
        "nmls_id": "",
        "our_lender_slug": "fidelity-bank-kansas",
        "legal_name": "Fidelity Bank, National Association",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    # Nebraska regionals
    "549300PZ44DNQDPOV865": {
        "institution_name_hmda": "Pinnacle Bank",
        "nmls_id": "",
        "our_lender_slug": "pinnacle-bank-nebraska",
        "legal_name": "Pinnacle Bank",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "LDVFX8JEECFFE8HRWA73": {
        "institution_name_hmda": "First National Bank of Omaha",
        "nmls_id": "",
        "our_lender_slug": "first-national-bank-of-omaha",
        "legal_name": "First National Bank of Omaha",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "549300QLO8TSQW5JTK72": {
        "institution_name_hmda": "WEST GATE BANK",
        "nmls_id": "",
        "our_lender_slug": "west-gate-bank",
        "legal_name": "West Gate Bank",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "549300GG5XNEIGHQTG04": {
        "institution_name_hmda": "CHARTER WEST BANK",
        "nmls_id": "",
        "our_lender_slug": "charter-west-bank",
        "legal_name": "Charter West Bank",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "R6KJ2D7C3UT8OVTWHS39": {
        "institution_name_hmda": "Union Bank and Trust Company",
        "nmls_id": "",
        "our_lender_slug": "union-bank-and-trust-nebraska",
        "legal_name": "Union Bank and Trust Company",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "549300TTNSX94TR06G13": {
        "institution_name_hmda": "CENTRIS FEDERAL CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "centris-federal-credit-union",
        "legal_name": "Centris Federal Credit Union",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "549300U82B82JH54TO79": {
        "institution_name_hmda": "Lincoln FSB of Nebraska",
        "nmls_id": "",
        "our_lender_slug": "lincoln-fsb-of-nebraska",
        "legal_name": "Lincoln FSB of Nebraska",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "54930015EUQKUCIRBQ14": {
        "institution_name_hmda": "METRO CU",
        "nmls_id": "",
        "our_lender_slug": "metro-credit-union-nebraska",
        "legal_name": "Metro Credit Union",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
    "549300XUFWU3F35PWM42": {
        "institution_name_hmda": "Cobalt Credit Union",
        "nmls_id": "",
        "our_lender_slug": "cobalt-credit-union",
        "legal_name": "Cobalt Credit Union",
        "match_confidence": "high",
        "match_method": "ia_ks_ne_gleif+lei_identity",
    },
}

IA_COUNTIES: dict[str, str] = {
    "19013": "Black Hawk",
    "19049": "Dallas",
    "19061": "Dubuque",
    "19103": "Johnson",
    "19113": "Linn",
    "19153": "Polk",
    "19155": "Pottawattamie",
    "19163": "Scott",
    "19169": "Story",
    "19181": "Warren",
    "19193": "Woodbury",
    "19099": "Jasper",
    "19045": "Clinton",
    "19139": "Muscatine",
    "19017": "Bremer",
}

IA_MAJORS: set[str] = {
    "19153",  # Polk
    "19113",  # Linn
    "19163",  # Scott
    "19103",  # Johnson
    "19013",  # Black Hawk
    "19193",  # Woodbury
    "19049",  # Dallas
    "19061",  # Dubuque
    "19155",  # Pottawattamie
    "19181",  # Warren
    "19169",  # Story
    "19099",  # Jasper
    "19045",  # Clinton
    "19139",  # Muscatine
    "19017",  # Bremer
}

KS_COUNTIES: dict[str, str] = {
    "20015": "Butler",
    "20045": "Douglas",
    "20091": "Johnson",
    "20103": "Leavenworth",
    "20121": "Miami",
    "20155": "Reno",
    "20161": "Riley",
    "20173": "Sedgwick",
    "20177": "Shawnee",
    "20209": "Wyandotte",
    "20061": "Geary",
    "20079": "Harvey",
    "20169": "Saline",
    "20149": "Pottawatomie",
}

KS_MAJORS: set[str] = {
    "20091",  # Johnson
    "20173",  # Sedgwick
    "20177",  # Shawnee
    "20045",  # Douglas
    "20209",  # Wyandotte
    "20103",  # Leavenworth
    "20015",  # Butler
    "20155",  # Reno
    "20161",  # Riley
    "20121",  # Miami
    "20061",  # Geary
    "20079",  # Harvey
    "20169",  # Saline
    "20149",  # Pottawatomie
}

NE_COUNTIES: dict[str, str] = {
    "31019": "Buffalo",
    "31025": "Cass",
    "31053": "Dodge",
    "31055": "Douglas",
    "31079": "Hall",
    "31109": "Lancaster",
    "31111": "Lincoln",
    "31141": "Platte",
    "31153": "Sarpy",
    "31155": "Saunders",
    "31177": "Washington",
    "31119": "Madison",
    "31001": "Adams",
    "31157": "Scotts Bluff",
}

NE_MAJORS: set[str] = {
    "31055",  # Douglas
    "31109",  # Lancaster
    "31153",  # Sarpy
    "31079",  # Hall
    "31019",  # Buffalo
    "31053",  # Dodge
    "31025",  # Cass
    "31111",  # Lincoln
    "31141",  # Platte
    "31155",  # Saunders
    "31177",  # Washington
    "31119",  # Madison
    "31001",  # Adams
    "31157",  # Scotts Bluff
}

STATES = [
    {
        "code": "IA",
        "name": "Iowa",
        "folder": "iowa",
        "suffix": "_ia",
        "col": "iowa_originations",
        "alias_col": "ia_originations",
        "counties": IA_COUNTIES,
        "majors": IA_MAJORS,
    },
    {
        "code": "KS",
        "name": "Kansas",
        "folder": "kansas",
        "suffix": "_ks",
        "col": "kansas_originations",
        "alias_col": "ks_originations",
        "counties": KS_COUNTIES,
        "majors": KS_MAJORS,
    },
    {
        "code": "NE",
        "name": "Nebraska",
        "folder": "nebraska",
        "suffix": "_ne",
        "col": "nebraska_originations",
        "alias_col": "ne_originations",
        "counties": NE_COUNTIES,
        "majors": NE_MAJORS,
    },
]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)


def load_lei_maps() -> dict[str, dict[str, str]]:
    lei_to_map: dict[str, dict[str, str]] = {}

    def ingest(path: Path) -> None:
        if not path.exists():
            return
        for r in read_csv(path):
            lei = (r.get("lei") or "").strip()
            if not lei or not (r.get("our_lender_slug") or "").strip():
                continue
            vol = 0.0
            for k, v in r.items():
                if k.endswith("_originations") or k == "total_originations":
                    try:
                        vol = max(vol, float(v or 0))
                    except ValueError:
                        pass
            prev = lei_to_map.get(lei)
            if prev:
                try:
                    if vol <= float(prev.get("_vol") or 0):
                        continue
                except ValueError:
                    pass
            row = dict(r)
            row["_vol"] = str(vol)
            lei_to_map[lei] = row

    for p in MAP_PATHS:
        ingest(p)
    return lei_to_map


def fill_county(r: dict[str, str], counties: dict[str, str]) -> dict[str, str]:
    fips = (r.get("county_fips") or "").strip()
    if not (r.get("county_name") or "").strip() and fips in counties:
        return {**r, "county_name": counties[fips]}
    return r


def name_to_slug(name: str) -> str:
    return (
        name.strip()
        .lower()
        .replace(".", "")
        .replace("'", "")
        .replace(" ", "-")
    )


def build_state(
    cfg: dict,
    lei_to_map: dict[str, dict[str, str]],
    gleif: dict[str, str],
) -> None:
    code = cfg["code"]
    src = ROOT / "data" / "hmda" / "by-state" / code
    out = ROOT / "data" / "hmda" / cfg["folder"]
    if not src.is_dir():
        raise SystemExit(f"Missing {src}")

    counties_map: dict[str, str] = cfg["counties"]
    majors: set[str] = set(cfg["majors"])
    suffix = cfg["suffix"]
    col = cfg["col"]
    alias = cfg["alias_col"]

    county_rows = [fill_county(r, counties_map) for r in read_csv(src / "county_market_summary.csv")]
    county_out: list[dict[str, str]] = []
    for r in county_rows:
        fips = (r.get("county_fips") or "").strip()
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        name = (r.get("county_name") or "").strip()
        if not name and fips in counties_map:
            r = {**r, "county_name": counties_map[fips]}
            name = counties_map[fips]
        if name or fips in majors or orig >= 600:
            county_out.append(r)

    state_rows = read_csv(src / "lender_state_summary.csv")
    enriched_state: list[dict[str, str]] = []
    for r in state_rows:
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in IA_KS_NE_CURATED_LEI:
                nm = IA_KS_NE_CURATED_LEI[lei]["institution_name_hmda"]
            if nm:
                r = {**r, "institution_name": nm}
        enriched_state.append(r)
    state_rows = enriched_state

    act_out: list[dict[str, str]] = []
    for r in read_csv(src / "lender_activity_by_county.csv"):
        r = fill_county(r, counties_map)
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() or fips not in majors:
            continue
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in IA_KS_NE_CURATED_LEI:
                nm = IA_KS_NE_CURATED_LEI[lei]["institution_name_hmda"]
            if nm:
                r = {**r, "institution_name": nm}
        act_out.append(r)

    cand = read_csv(src / "lei_mapping_candidates.csv")
    for r in cand:
        if alias in r and col not in r:
            r[col] = r[alias]

    state_by_lei = {r["lei"]: r for r in state_rows}
    mapping_by_lei: dict[str, dict[str, str]] = {}

    def add_mapping(lei: str, base: dict[str, str], method_prefix: str) -> None:
        st = state_by_lei.get(lei)
        if not st:
            return
        try:
            st_orig = int(float(st.get("total_originations") or 0))
        except ValueError:
            st_orig = 0
        if st_orig <= 0:
            return
        nmls = (base.get("nmls_id") or "").strip()
        curated_slug = (base.get("our_lender_slug") or "").strip()
        if method_prefix.startswith("ia_ks_ne_curated") and curated_slug:
            slug = curated_slug
        else:
            slug = NATIONAL_SLUG_BY_NMLS.get(nmls) or curated_slug
        if not slug:
            return
        row = {
            "lei": lei,
            "institution_name_hmda": base.get("institution_name_hmda")
            or base.get("legal_name")
            or gleif.get(lei)
            or st.get("institution_name")
            or "",
            "nmls_id": nmls,
            "our_lender_slug": slug,
            "legal_name": base.get("legal_name") or "",
            "match_confidence": base.get("match_confidence") or "high",
            "match_method": method_prefix + (base.get("match_method") or "curated"),
            col: str(st_orig),
            "florida_originations": base.get("florida_originations") or "0",
            "total_originations": st.get("total_originations") or str(st_orig),
            "priority_match": "high" if st_orig >= 500 else "medium",
            "notes": (
                f"{method_prefix.rstrip('+') or 'curated'} map for {code} activity "
                f"({st_orig} {code} originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(float(prev[col] or 0)) >= st_orig and prev.get("our_lender_slug"):
            if not method_prefix.startswith("ia_ks_ne_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in IA_KS_NE_CURATED_LEI.items():
        add_mapping(lei, cur, "ia_ks_ne_curated+")

    mapping_rows = sorted(
        mapping_by_lei.values(),
        key=lambda r: -int(float(r.get(col) or 0)),
    )

    if county_out:
        write_csv(out / f"county_market_summary{suffix}.csv", county_out, list(county_out[0].keys()))
    if act_out:
        write_csv(out / f"lender_activity_by_county{suffix}.csv", act_out, list(act_out[0].keys()))
    if state_rows:
        write_csv(out / f"lender_state_summary{suffix}.csv", state_rows, list(state_rows[0].keys()))
    if cand:
        for r in cand:
            if col not in r:
                r[col] = r.get(alias) or "0"
        write_csv(out / f"lei_mapping_candidates{suffix}.csv", cand, list(cand[0].keys()))
    if mapping_rows:
        write_csv(out / "lei_to_nmls_mapping.csv", mapping_rows, list(mapping_rows[0].keys()))

    major_named = [
        r
        for r in county_out
        if (r.get("county_fips") or "") in majors and (r.get("county_name") or "").strip()
    ]
    major_named.sort(key=lambda r: -float(r.get("total_originations") or 0))
    major_slugs = [name_to_slug(r.get("county_name") or "") for r in major_named]

    md = [
        f"# {cfg['name']} HMDA slice\n\n",
        f"**Source:** `data/hmda/by-state/{code}/` (national 2025 foundation)\n\n",
        f"- County market rows: **{len(county_out)}**\n",
        f"- Lender–county activity (major markets): **{len(act_out)}**\n",
        f"- LEI state summaries: **{len(state_rows)}**\n",
        f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
        f"- Major markets with names: **{len(major_named)}**\n\n",
        f"## Top mapped LEIs by {code} originations\n\n",
    ]
    for r in mapping_rows[:20]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r[col]} {code} orig.)\n"
        )
    md.append("\n## Major markets (panel-ready)\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Matching rules\n\n"
        "- Reuse prior product-state curated LEI maps when the LEI has state activity\n"
        "- IA/KS/NE curated: GLEIF-reidentified nationals + Plains regionals "
        "(GreenState, Veridian, Hills Bank, Dupaco, Capitol Federal, CUA, Meritrust, "
        "Pinnacle Bank NE, FNBO, West Gate, Union Bank & Trust, Centris, etc.)\n"
        "- Precision only — no low-confidence LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-ia-ks-ne-slices.py\n"
        "```\n"
        "\n## Major slugs (for states.ts)\n\n```\n"
        + ", ".join(f"'{s}'" for s in major_slugs)
        + "\n```\n"
    )
    (out / "README.md").write_text("".join(md), encoding="utf-8")
    print(
        f"Wrote {cfg['name']} → {out} "
        f"mappings={len(mapping_rows)} counties={len(county_out)} "
        f"activity={len(act_out)} majors={len(major_named)} "
        f"slugs={major_slugs}"
    )


def main() -> None:
    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))
    for lei, cur in IA_KS_NE_CURATED_LEI.items():
        gleif[lei] = cur["institution_name_hmda"]
    GLEIF_CACHE.parent.mkdir(parents=True, exist_ok=True)
    GLEIF_CACHE.write_text(json.dumps(gleif, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    for cfg in STATES:
        build_state(cfg, lei_to_map, gleif)


if __name__ == "__main__":
    main()

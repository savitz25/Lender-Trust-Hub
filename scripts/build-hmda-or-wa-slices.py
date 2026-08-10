#!/usr/bin/env python3
"""
Build Oregon and Washington HMDA product slices.

  python scripts/build-hmda-or-wa-slices.py

Source: data/hmda/by-state/{OR,WA}/
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
    "381076": "mt-bank",
    "2184": "embrace-home-loans",
    "2893": "nfm-lending",
    "338923": "anniemac-home-mortgage",
    "75164": "prosperity-home-mortgage",
    "1124061": "lower",
    "1127": "nvr-mortgage",
    "1921": "primelending-columbus",
    "2909": "fairway-mortgage-augusta-sheppard",
    "1168": "amerisave",
    "467341": "regions-bank",
    "480004": "synovus-bank",
    "1820": "cmg-home-loans-dennis-vo",
    "2458338": "cmg-home-loans-dennis-vo",
    "1850": "american-pacific-mortgage-inland-empire",
    "75243": "prmg",
    "401052": "bmo-bank",
    "1025894": "mutual-of-omaha-mortgage",
    "237341": "american-financial-network",
    "459308": "old-national-bank",
    "402436": "huntington-national-bank",
    "3113": "academy-mortgage",
    "1907": "veterans-united-west-valley",
    "1058": "lennar-mortgage-queen-creek",
    "449042": "wintrust-mortgage",
    "2925": "eagle-home-mortgage",
    "14622": "dhi-mortgage-buckeye",
    "399802": "bank-of-america-mortgage-west-valley",
}

# GLEIF-verified LEIs → national/directory slugs (+ PNW regionals)
OR_WA_CURATED_LEI: dict[str, dict[str, str]] = {
    "549300MGPZBLQDIL7538": {
        "institution_name_hmda": "FAIRWAY INDEPENDENT MORTGAGE CORPORATION",
        "nmls_id": "2909",
        "our_lender_slug": "fairway-mortgage-augusta-sheppard",
        "legal_name": "Fairway Independent Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "or_wa_gleif_reidentify+public_nmls",
    },
    "RVDPPPGHCGZ40J4VQ731": {
        "institution_name_hmda": "PENNYMAC LOAN SERVICES, LLC",
        "nmls_id": "35953",
        "our_lender_slug": "pennymac",
        "legal_name": "PennyMac Loan Services, LLC",
        "match_confidence": "high",
        "match_method": "or_wa_gleif_reidentify+public_nmls",
    },
    "549300AQ3T62GXDU7D76": {
        "institution_name_hmda": "GUILD MORTGAGE COMPANY LLC",
        "nmls_id": "3274",
        "our_lender_slug": "guild-mortgage-metrowest",
        "legal_name": "Guild Mortgage Company LLC",
        "match_confidence": "high",
        "match_method": "or_wa_gleif_reidentify+public_nmls",
    },
    "549300DD5QQUHO6PCH70": {
        "institution_name_hmda": "MORTGAGE RESEARCH CENTER, LLC",
        "nmls_id": "1907",
        "our_lender_slug": "veterans-united-west-valley",
        "legal_name": "Mortgage Research Center, LLC (Veterans United Home Loans)",
        "match_confidence": "high",
        "match_method": "or_wa_gleif_reidentify+public_nmls",
    },
    "549300LYRWPSYPK6S325": {
        "institution_name_hmda": "FREEDOM MORTGAGE CORPORATION",
        "nmls_id": "2767",
        "our_lender_slug": "freedom-mortgage",
        "legal_name": "Freedom Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "or_wa_gleif_reidentify+public_nmls",
    },
    "549300VZVN841I2ILS84": {
        "institution_name_hmda": "CROSSCOUNTRY MORTGAGE, LLC",
        "nmls_id": "3029",
        "our_lender_slug": "crosscountry-mortgage-metrowest",
        "legal_name": "CrossCountry Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "or_wa_gleif_reidentify+public_nmls",
    },
    "549300AG64NHILB7ZP05": {
        "institution_name_hmda": "LOANDEPOT.COM, LLC",
        "nmls_id": "174457",
        "our_lender_slug": "loandepot",
        "legal_name": "loanDepot.com, LLC",
        "match_confidence": "high",
        "match_method": "or_wa_gleif_reidentify+public_nmls",
    },
    "B4TYDEB6GKMZO031MB27": {
        "institution_name_hmda": "Bank of America, National Association",
        "nmls_id": "399802",
        "our_lender_slug": "bank-of-america-mortgage-west-valley",
        "legal_name": "Bank of America, National Association",
        "match_confidence": "high",
        "match_method": "or_wa_gleif_reidentify+public_nmls",
    },
    "549300U3721PJGQZYY68": {
        "institution_name_hmda": "GUARANTEED RATE, INC.",
        "nmls_id": "2611",
        "our_lender_slug": "guaranteed-rate",
        "legal_name": "Guaranteed Rate, Inc.",
        "match_confidence": "high",
        "match_method": "or_wa_gleif_reidentify+public_nmls",
    },
    "549300DD4R4SYK5RAQ92": {
        "institution_name_hmda": "MOVEMENT MORTGAGE, LLC",
        "nmls_id": "39179",
        "our_lender_slug": "movement-mortgage-myrtle-beach",
        "legal_name": "Movement Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "or_wa_gleif_reidentify+public_nmls",
    },
    "5493001SXWZ4OFP8Z903": {
        "institution_name_hmda": "DHI MORTGAGE COMPANY, LTD.",
        "nmls_id": "14622",
        "our_lender_slug": "dhi-mortgage-buckeye",
        "legal_name": "DHI Mortgage Company, Ltd.",
        "match_confidence": "high",
        "match_method": "or_wa_gleif_reidentify+public_nmls",
    },
    "549300LBCBNR1OT00651": {
        "institution_name_hmda": "NATIONSTAR MORTGAGE LLC",
        "nmls_id": "2104",
        "our_lender_slug": "mr-cooper",
        "legal_name": "Nationstar Mortgage LLC (Mr. Cooper)",
        "match_confidence": "high",
        "match_method": "or_wa_gleif_reidentify+public_nmls",
    },
    # PNW regionals (LEI identity)
    "2549008LK3474E9U2888": {
        "institution_name_hmda": "ONPOINT COMMUNITY CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "onpoint-community-credit-union",
        "legal_name": "OnPoint Community Credit Union",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
    "IFQSIUC9AGQV2NE8CN25": {
        "institution_name_hmda": "Columbia Bank",
        "nmls_id": "",
        "our_lender_slug": "columbia-bank-pnw",
        "legal_name": "Columbia Bank",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
    "549300HH0V8LECLNPQ26": {
        "institution_name_hmda": "ROGUE",
        "nmls_id": "",
        "our_lender_slug": "rogue-credit-union",
        "legal_name": "Rogue Credit Union",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
    "549300IEP77RKJ87Z176": {
        "institution_name_hmda": "OREGON COMMUNITY",
        "nmls_id": "",
        "our_lender_slug": "oregon-community-credit-union",
        "legal_name": "Oregon Community Credit Union",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
    "549300Q02LGIN9AXKP98": {
        "institution_name_hmda": "FIRST TECHNOLOGY FEDERAL CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "first-tech-federal-credit-union",
        "legal_name": "First Technology Federal Credit Union",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
    "5493003WLEYGXGNTI654": {
        "institution_name_hmda": "SELCO COMMUNITY",
        "nmls_id": "",
        "our_lender_slug": "selco-community-credit-union",
        "legal_name": "SELCO Community Credit Union",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
    "254900Z8J5L9POS71X51": {
        "institution_name_hmda": "Oregon State Credit Union",
        "nmls_id": "",
        "our_lender_slug": "oregon-state-credit-union",
        "legal_name": "Oregon State Credit Union",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
    "5493008JECR4UE0WVR04": {
        "institution_name_hmda": "MORTGAGE EXPRESS, LLC",
        "nmls_id": "",
        "our_lender_slug": "mortgage-express",
        "legal_name": "Mortgage Express, LLC",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
    "549300KM40FP4MSQU941": {
        "institution_name_hmda": "Boeing Employees Credit Union",
        "nmls_id": "",
        "our_lender_slug": "boeing-employees-credit-union",
        "legal_name": "Boeing Employees Credit Union (BECU)",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
    "54930060G4MDPWHISD89": {
        "institution_name_hmda": "EVERGREEN MONEYSOURCE MORTGAGE COMPANY",
        "nmls_id": "",
        "our_lender_slug": "evergreen-moneysource-mortgage",
        "legal_name": "Evergreen MoneySource Mortgage Company",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
    "5493000FWM3I2HHQY149": {
        "institution_name_hmda": "WASHINGTON STATE EMPLOYEES CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "washington-state-employees-credit-union",
        "legal_name": "Washington State Employees Credit Union (WSECU)",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
    "5493001B4U37VT2ML818": {
        "institution_name_hmda": "GESA CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "gesa-credit-union",
        "legal_name": "Gesa Credit Union",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
    "549300TUSRLWD8ETNR90": {
        "institution_name_hmda": "SPOKANE TEACHERS",
        "nmls_id": "",
        "our_lender_slug": "spokane-teachers-credit-union",
        "legal_name": "Spokane Teachers Credit Union",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
    "WE0I402RW25AU38DTI13": {
        "institution_name_hmda": "Banner Bank",
        "nmls_id": "",
        "our_lender_slug": "banner-bank",
        "legal_name": "Banner Bank",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
    "5493003T5D4N1CM46J77": {
        "institution_name_hmda": "1st Security Bank of Washington",
        "nmls_id": "",
        "our_lender_slug": "first-security-bank-washington",
        "legal_name": "1st Security Bank of Washington",
        "match_confidence": "high",
        "match_method": "or_wa_gleif+lei_identity",
    },
}

OR_COUNTIES: dict[str, str] = {
    "41003": "Benton",
    "41005": "Clackamas",
    "41007": "Clatsop",
    "41009": "Columbia",
    "41011": "Coos",
    "41013": "Crook",
    "41017": "Deschutes",
    "41019": "Douglas",
    "41029": "Jackson",
    "41033": "Josephine",
    "41035": "Klamath",
    "41039": "Lane",
    "41041": "Lincoln",
    "41043": "Linn",
    "41047": "Marion",
    "41051": "Multnomah",
    "41053": "Polk",
    "41059": "Umatilla",
    "41067": "Washington",
    "41071": "Yamhill",
}

OR_MAJORS: set[str] = {
    "41051",  # Multnomah
    "41067",  # Washington
    "41005",  # Clackamas
    "41039",  # Lane
    "41047",  # Marion
    "41017",  # Deschutes
    "41029",  # Jackson
    "41043",  # Linn
    "41071",  # Yamhill
    "41019",  # Douglas
    "41053",  # Polk
    "41033",  # Josephine
    "41059",  # Umatilla
    "41035",  # Klamath
    "41003",  # Benton
    "41011",  # Coos
    "41041",  # Lincoln
    "41009",  # Columbia
}

WA_COUNTIES: dict[str, str] = {
    "53005": "Benton",
    "53007": "Chelan",
    "53009": "Clallam",
    "53011": "Clark",
    "53015": "Cowlitz",
    "53021": "Franklin",
    "53025": "Grant",
    "53027": "Grays Harbor",
    "53029": "Island",
    "53033": "King",
    "53035": "Kitsap",
    "53041": "Lewis",
    "53045": "Mason",
    "53053": "Pierce",
    "53057": "Skagit",
    "53061": "Snohomish",
    "53063": "Spokane",
    "53067": "Thurston",
    "53073": "Whatcom",
    "53077": "Yakima",
}

WA_MAJORS: set[str] = {
    "53033",  # King
    "53053",  # Pierce
    "53061",  # Snohomish
    "53063",  # Spokane
    "53011",  # Clark
    "53067",  # Thurston
    "53035",  # Kitsap
    "53073",  # Whatcom
    "53005",  # Benton
    "53077",  # Yakima
    "53015",  # Cowlitz
    "53057",  # Skagit
    "53029",  # Island
    "53041",  # Lewis
    "53045",  # Mason
    "53025",  # Grant
    "53027",  # Grays Harbor
    "53021",  # Franklin
}

STATES = [
    {
        "code": "OR",
        "name": "Oregon",
        "folder": "oregon",
        "suffix": "_or",
        "col": "oregon_originations",
        "alias_col": "or_originations",
        "counties": OR_COUNTIES,
        "majors": OR_MAJORS,
    },
    {
        "code": "WA",
        "name": "Washington",
        "folder": "washington",
        "suffix": "_wa",
        "col": "washington_originations",
        "alias_col": "wa_originations",
        "counties": WA_COUNTIES,
        "majors": WA_MAJORS,
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
        if name or fips in majors or orig >= 800:
            county_out.append(r)

    state_rows = read_csv(src / "lender_state_summary.csv")
    enriched_state: list[dict[str, str]] = []
    for r in state_rows:
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in OR_WA_CURATED_LEI:
                nm = OR_WA_CURATED_LEI[lei]["institution_name_hmda"]
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
            if not nm and lei in OR_WA_CURATED_LEI:
                nm = OR_WA_CURATED_LEI[lei]["institution_name_hmda"]
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
        if method_prefix.startswith("or_wa_curated") and curated_slug:
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
            if not method_prefix.startswith("or_wa_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in OR_WA_CURATED_LEI.items():
        add_mapping(lei, cur, "or_wa_curated+")

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
        "- OR/WA curated: GLEIF-reidentified nationals + PNW regionals "
        "(OnPoint, BECU, Columbia Bank, Banner Bank, WSECU, Gesa, Spokane Teachers CU, "
        "Rogue CU, First Tech, SELCO, Oregon State CU, Evergreen MoneySource, etc.)\n"
        "- Precision only — no low-confidence LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-or-wa-slices.py\n"
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
    for lei, cur in OR_WA_CURATED_LEI.items():
        gleif[lei] = cur["institution_name_hmda"]
    gleif.update(
        {
            "549300L44U62O7WHRR78": "FIRST COMMUNITY",
            "5493008VVXQIDO1EZ460": "SUMMIT FUNDING, INC.",
            "549300CDLJDN8ENOT455": "MARION AND POLK SCHOOLS CREDIT UNION",
            "549300QKL5FUBZ8LSF50": "NATIONS DIRECT MORTGAGE, LLC",
        }
    )
    GLEIF_CACHE.parent.mkdir(parents=True, exist_ok=True)
    GLEIF_CACHE.write_text(json.dumps(gleif, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    for cfg in STATES:
        build_state(cfg, lei_to_map, gleif)


if __name__ == "__main__":
    main()

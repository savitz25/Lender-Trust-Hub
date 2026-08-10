#!/usr/bin/env python3
"""
Build Idaho, Montana, and Wyoming HMDA product slices.

  python scripts/build-hmda-id-mt-wy-slices.py

Source: data/hmda/by-state/{ID,MT,WY}/
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
    "2289": "newrez",
    "1120271": "amerihome-mortgage",
    "6606": "new-american-funding",
    "2104": "mr-cooper",
    "402216": "us-bank",
    "39179": "movement-mortgage-myrtle-beach",
    "3274": "guild-mortgage-metrowest",
    "3029": "crosscountry-mortgage-metrowest",
    "1907": "veterans-united-west-valley",
    "2909": "fairway-mortgage-augusta-sheppard",
    "1124061": "lower",
    "1850": "american-pacific-mortgage-inland-empire",
}

# GLEIF-verified LEIs → national/directory slugs (+ Mountain West regionals)
ID_MT_WY_CURATED_LEI: dict[str, dict[str, str]] = {
    "549300MGPZBLQDIL7538": {
        "institution_name_hmda": "FAIRWAY INDEPENDENT MORTGAGE CORPORATION",
        "nmls_id": "2909",
        "our_lender_slug": "fairway-mortgage-augusta-sheppard",
        "legal_name": "Fairway Independent Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif_reidentify+public_nmls",
    },
    "RVDPPPGHCGZ40J4VQ731": {
        "institution_name_hmda": "PENNYMAC LOAN SERVICES, LLC",
        "nmls_id": "35953",
        "our_lender_slug": "pennymac",
        "legal_name": "PennyMac Loan Services, LLC",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif_reidentify+public_nmls",
    },
    "549300AQ3T62GXDU7D76": {
        "institution_name_hmda": "GUILD MORTGAGE COMPANY LLC",
        "nmls_id": "3274",
        "our_lender_slug": "guild-mortgage-metrowest",
        "legal_name": "Guild Mortgage Company LLC",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif_reidentify+public_nmls",
    },
    "549300DD5QQUHO6PCH70": {
        "institution_name_hmda": "MORTGAGE RESEARCH CENTER, LLC",
        "nmls_id": "1907",
        "our_lender_slug": "veterans-united-west-valley",
        "legal_name": "Mortgage Research Center, LLC (Veterans United Home Loans)",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif_reidentify+public_nmls",
    },
    "549300LYRWPSYPK6S325": {
        "institution_name_hmda": "FREEDOM MORTGAGE CORPORATION",
        "nmls_id": "2767",
        "our_lender_slug": "freedom-mortgage",
        "legal_name": "Freedom Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif_reidentify+public_nmls",
    },
    "549300VZVN841I2ILS84": {
        "institution_name_hmda": "CROSSCOUNTRY MORTGAGE, LLC",
        "nmls_id": "3029",
        "our_lender_slug": "crosscountry-mortgage-metrowest",
        "legal_name": "CrossCountry Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif_reidentify+public_nmls",
    },
    "549300U3721PJGQZYY68": {
        "institution_name_hmda": "GUARANTEED RATE, INC.",
        "nmls_id": "2611",
        "our_lender_slug": "guaranteed-rate",
        "legal_name": "Guaranteed Rate, Inc.",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif_reidentify+public_nmls",
    },
    "549300DD4R4SYK5RAQ92": {
        "institution_name_hmda": "MOVEMENT MORTGAGE, LLC",
        "nmls_id": "39179",
        "our_lender_slug": "movement-mortgage-myrtle-beach",
        "legal_name": "Movement Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif_reidentify+public_nmls",
    },
    "549300AG64NHILB7ZP05": {
        "institution_name_hmda": "LOANDEPOT.COM, LLC",
        "nmls_id": "174457",
        "our_lender_slug": "loandepot",
        "legal_name": "loanDepot.com, LLC",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif_reidentify+public_nmls",
    },
    "5493006S869XKIESMV41": {
        "institution_name_hmda": "Mountain America Federal Credit Union",
        "nmls_id": "",
        "our_lender_slug": "mountain-america-federal-credit-union",
        "legal_name": "Mountain America Federal Credit Union",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    "54930060G4MDPWHISD89": {
        "institution_name_hmda": "EVERGREEN MONEYSOURCE MORTGAGE COMPANY",
        "nmls_id": "",
        "our_lender_slug": "evergreen-moneysource-mortgage",
        "legal_name": "Evergreen MoneySource Mortgage Company",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    # Idaho regionals
    "5493001PXRJMPLXPG540": {
        "institution_name_hmda": "IDAHO CENTRAL CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "idaho-central-credit-union",
        "legal_name": "Idaho Central Credit Union",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    "549300B4IYL7TZT8FA34": {
        "institution_name_hmda": "PREMIER MORTGAGE RESOURCES, L.L.C.",
        "nmls_id": "",
        "our_lender_slug": "premier-mortgage-resources",
        "legal_name": "Premier Mortgage Resources, L.L.C.",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    "5493006LGHJCBICSE610": {
        "institution_name_hmda": "WESTMARK Credit Union",
        "nmls_id": "",
        "our_lender_slug": "westmark-credit-union",
        "legal_name": "Westmark Credit Union",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    "254900SUM1U8US3D2Z03": {
        "institution_name_hmda": "First Federal Savings Bank of Twin Falls",
        "nmls_id": "",
        "our_lender_slug": "first-federal-savings-bank-twin-falls",
        "legal_name": "First Federal Savings Bank of Twin Falls",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    "254900LX8DA8FRHUUD51": {
        "institution_name_hmda": "Potlatch No. 1 Financial Credit Union",
        "nmls_id": "",
        "our_lender_slug": "potlatch-no-1-financial-credit-union",
        "legal_name": "Potlatch No. 1 Financial Credit Union",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    # Shared Mountain West
    "549300ESRQ6OLBB56N04": {
        "institution_name_hmda": "Glacier Bank",
        "nmls_id": "",
        "our_lender_slug": "glacier-bank",
        "legal_name": "Glacier Bank",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    "549300RFSMIRUODUVW59": {
        "institution_name_hmda": "First Interstate Bank",
        "nmls_id": "",
        "our_lender_slug": "first-interstate-bank",
        "legal_name": "First Interstate Bank",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    # Montana regionals
    "549300FVJ3IB88LTR841": {
        "institution_name_hmda": "Stockman Bank of Montana",
        "nmls_id": "",
        "our_lender_slug": "stockman-bank-of-montana",
        "legal_name": "Stockman Bank of Montana",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    "5493007ZF78YQRSXQG49": {
        "institution_name_hmda": "OPPORTUNITY BANK OF MONTANA",
        "nmls_id": "",
        "our_lender_slug": "opportunity-bank-of-montana",
        "legal_name": "Opportunity Bank of Montana",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    "54930043A47GB1KNJQ31": {
        "institution_name_hmda": "Altana Federal Credit Union",
        "nmls_id": "",
        "our_lender_slug": "altana-federal-credit-union",
        "legal_name": "Altana Federal Credit Union",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    # Wyoming regionals
    "549300R5DOGZK0VWYL76": {
        "institution_name_hmda": "Jonah Bank of Wyoming",
        "nmls_id": "",
        "our_lender_slug": "jonah-bank-of-wyoming",
        "legal_name": "Jonah Bank of Wyoming",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    "549300J5YB46ZKVUNF26": {
        "institution_name_hmda": "UNIWYO FEDERAL CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "uniwyo-federal-credit-union",
        "legal_name": "UniWyo Federal Credit Union",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    "5493007KYI3BO5LTXF79": {
        "institution_name_hmda": "Meridian Trust Federal Credit Union",
        "nmls_id": "",
        "our_lender_slug": "meridian-trust-federal-credit-union",
        "legal_name": "Meridian Trust Federal Credit Union",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    "5493004JDNBZNOT8PR69": {
        "institution_name_hmda": "WYHY",
        "nmls_id": "",
        "our_lender_slug": "wyhy-federal-credit-union",
        "legal_name": "Wyoming Community Federal Credit Union (WYHY)",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    "549300QG83M0EX7VC434": {
        "institution_name_hmda": "Pinnacle Bank - Wyoming",
        "nmls_id": "",
        "our_lender_slug": "pinnacle-bank-wyoming",
        "legal_name": "Pinnacle Bank - Wyoming",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
    "254900XZCT60J2G3HK85": {
        "institution_name_hmda": "Blue Federal Credit Union",
        "nmls_id": "",
        "our_lender_slug": "blue-federal-credit-union",
        "legal_name": "Blue Federal Credit Union",
        "match_confidence": "high",
        "match_method": "id_mt_wy_gleif+lei_identity",
    },
}

ID_COUNTIES: dict[str, str] = {
    "16001": "Ada",
    "16005": "Bannock",
    "16011": "Bingham",
    "16013": "Blaine",
    "16017": "Bonner",
    "16019": "Bonneville",
    "16027": "Canyon",
    "16039": "Elmore",
    "16051": "Jefferson",
    "16055": "Kootenai",
    "16057": "Latah",
    "16065": "Madison",
    "16069": "Nez Perce",
    "16075": "Payette",
    "16083": "Twin Falls",
    "16085": "Valley",
}

ID_MAJORS: set[str] = {
    "16001",  # Ada
    "16027",  # Canyon
    "16055",  # Kootenai
    "16019",  # Bonneville
    "16083",  # Twin Falls
    "16005",  # Bannock
    "16017",  # Bonner
    "16011",  # Bingham
    "16069",  # Nez Perce
    "16051",  # Jefferson
    "16039",  # Elmore
    "16075",  # Payette
    "16057",  # Latah
    "16065",  # Madison
}

MT_COUNTIES: dict[str, str] = {
    "30013": "Cascade",
    "30029": "Flathead",
    "30031": "Gallatin",
    "30047": "Lake",
    "30049": "Lewis and Clark",
    "30053": "Lincoln",
    "30063": "Missoula",
    "30081": "Ravalli",
    "30093": "Silver Bow",
    "30111": "Yellowstone",
}

MT_MAJORS: set[str] = {
    "30111",  # Yellowstone
    "30031",  # Gallatin
    "30029",  # Flathead
    "30063",  # Missoula
    "30013",  # Cascade
    "30049",  # Lewis and Clark
    "30081",  # Ravalli
    "30093",  # Silver Bow
    "30047",  # Lake
    "30053",  # Lincoln
}

WY_COUNTIES: dict[str, str] = {
    "56001": "Albany",
    "56005": "Campbell",
    "56013": "Fremont",
    "56021": "Laramie",
    "56023": "Lincoln",
    "56025": "Natrona",
    "56029": "Park",
    "56033": "Sheridan",
    "56037": "Sweetwater",
    "56039": "Teton",
    "56041": "Uinta",
}

WY_MAJORS: set[str] = {
    "56021",  # Laramie
    "56025",  # Natrona
    "56005",  # Campbell
    "56037",  # Sweetwater
    "56001",  # Albany
    "56033",  # Sheridan
    "56029",  # Park
    "56013",  # Fremont
    "56023",  # Lincoln
    "56039",  # Teton
    "56041",  # Uinta
}

STATES = [
    {
        "code": "ID",
        "name": "Idaho",
        "folder": "idaho",
        "suffix": "_id",
        "col": "idaho_originations",
        "alias_col": "id_originations",
        "counties": ID_COUNTIES,
        "majors": ID_MAJORS,
    },
    {
        "code": "MT",
        "name": "Montana",
        "folder": "montana",
        "suffix": "_mt",
        "col": "montana_originations",
        "alias_col": "mt_originations",
        "counties": MT_COUNTIES,
        "majors": MT_MAJORS,
    },
    {
        "code": "WY",
        "name": "Wyoming",
        "folder": "wyoming",
        "suffix": "_wy",
        "col": "wyoming_originations",
        "alias_col": "wy_originations",
        "counties": WY_COUNTIES,
        "majors": WY_MAJORS,
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
        if name or fips in majors or orig >= 400:
            county_out.append(r)

    state_rows = read_csv(src / "lender_state_summary.csv")
    enriched_state: list[dict[str, str]] = []
    for r in state_rows:
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in ID_MT_WY_CURATED_LEI:
                nm = ID_MT_WY_CURATED_LEI[lei]["institution_name_hmda"]
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
            if not nm and lei in ID_MT_WY_CURATED_LEI:
                nm = ID_MT_WY_CURATED_LEI[lei]["institution_name_hmda"]
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
        if method_prefix.startswith("id_mt_wy_curated") and curated_slug:
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
            "priority_match": "high" if st_orig >= 400 else "medium",
            "notes": (
                f"{method_prefix.rstrip('+') or 'curated'} map for {code} activity "
                f"({st_orig} {code} originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(float(prev[col] or 0)) >= st_orig and prev.get("our_lender_slug"):
            if not method_prefix.startswith("id_mt_wy_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in ID_MT_WY_CURATED_LEI.items():
        add_mapping(lei, cur, "id_mt_wy_curated+")

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
        "- ID/MT/WY curated: GLEIF-reidentified nationals + Mountain West regionals "
        "(Idaho Central CU, Glacier Bank, First Interstate, Stockman Bank, "
        "Opportunity Bank of Montana, Jonah Bank, UniWyo FCU, etc.)\n"
        "- Precision only — no low-confidence LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-id-mt-wy-slices.py\n"
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
    for lei, cur in ID_MT_WY_CURATED_LEI.items():
        gleif[lei] = cur["institution_name_hmda"]
    GLEIF_CACHE.parent.mkdir(parents=True, exist_ok=True)
    GLEIF_CACHE.write_text(json.dumps(gleif, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    for cfg in STATES:
        build_state(cfg, lei_to_map, gleif)


if __name__ == "__main__":
    main()

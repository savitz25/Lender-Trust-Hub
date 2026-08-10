#!/usr/bin/env python3
"""
Build Missouri and Kentucky HMDA product slices.

  python scripts/build-hmda-mo-ky-slices.py

Source: data/hmda/by-state/{MO,KY}/
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
    "619717": "first-financial-bank-ohio",
    "446859": "german-american-bank",
    "518136": "liberty-federal-credit-union",
    "1561": "silverton-mortgage-myrtle-beach",
    "399802": "bank-of-america-mortgage-west-valley",
}

# GLEIF-verified LEIs → existing national/directory slugs (+ a few MO/KY regionals)
MO_KY_CURATED_LEI: dict[str, dict[str, str]] = {
    "549300MGPZBLQDIL7538": {
        "institution_name_hmda": "FAIRWAY INDEPENDENT MORTGAGE CORPORATION",
        "nmls_id": "2909",
        "our_lender_slug": "fairway-mortgage-augusta-sheppard",
        "legal_name": "Fairway Independent Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif_reidentify+public_nmls",
    },
    "RVDPPPGHCGZ40J4VQ731": {
        "institution_name_hmda": "PENNYMAC LOAN SERVICES, LLC",
        "nmls_id": "35953",
        "our_lender_slug": "pennymac",
        "legal_name": "PennyMac Loan Services, LLC",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif_reidentify+public_nmls",
    },
    "549300AQ3T62GXDU7D76": {
        "institution_name_hmda": "GUILD MORTGAGE COMPANY LLC",
        "nmls_id": "3274",
        "our_lender_slug": "guild-mortgage-metrowest",
        "legal_name": "Guild Mortgage Company LLC",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif_reidentify+public_nmls",
    },
    "549300DD5QQUHO6PCH70": {
        "institution_name_hmda": "MORTGAGE RESEARCH CENTER, LLC",
        "nmls_id": "1907",
        "our_lender_slug": "veterans-united-west-valley",
        "legal_name": "Mortgage Research Center, LLC (Veterans United Home Loans)",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif_reidentify+public_nmls",
    },
    "549300LYRWPSYPK6S325": {
        "institution_name_hmda": "FREEDOM MORTGAGE CORPORATION",
        "nmls_id": "2767",
        "our_lender_slug": "freedom-mortgage",
        "legal_name": "Freedom Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif_reidentify+public_nmls",
    },
    "549300VZVN841I2ILS84": {
        "institution_name_hmda": "CROSSCOUNTRY MORTGAGE, LLC",
        "nmls_id": "3029",
        "our_lender_slug": "crosscountry-mortgage-metrowest",
        "legal_name": "CrossCountry Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif_reidentify+public_nmls",
    },
    "549300AG64NHILB7ZP05": {
        "institution_name_hmda": "LOANDEPOT.COM, LLC",
        "nmls_id": "174457",
        "our_lender_slug": "loandepot",
        "legal_name": "loanDepot.com, LLC",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif_reidentify+public_nmls",
    },
    "B4TYDEB6GKMZO031MB27": {
        "institution_name_hmda": "Bank of America, National Association",
        "nmls_id": "399802",
        "our_lender_slug": "bank-of-america-mortgage-west-valley",
        "legal_name": "Bank of America, National Association",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif_reidentify+public_nmls",
    },
    "549300LBCBNR1OT00651": {
        "institution_name_hmda": "NATIONSTAR MORTGAGE LLC",
        "nmls_id": "2104",
        "our_lender_slug": "mr-cooper",
        "legal_name": "Nationstar Mortgage LLC (Mr. Cooper)",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif_reidentify+public_nmls",
    },
    "549300LXKO1O7CSK5J52": {
        "institution_name_hmda": "FLAT BRANCH MORTGAGE, INC.",
        "nmls_id": "",
        "our_lender_slug": "flat-branch-mortgage",
        "legal_name": "Flat Branch Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif+lei_identity",
    },
    "QFROUN1UWUYU0DVIWD51": {
        "institution_name_hmda": "Eagle Home Mortgage, LLC",
        "nmls_id": "2925",
        "our_lender_slug": "eagle-home-mortgage",
        "legal_name": "Eagle Home Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif+public_nmls",
    },
    "5493002JDOI3GTNVUD76": {
        "institution_name_hmda": "German American Bank",
        "nmls_id": "446859",
        "our_lender_slug": "german-american-bank",
        "legal_name": "German American Bank",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif+public_nmls",
    },
    "54930072OCHTUJOZQB56": {
        "institution_name_hmda": "Liberty Credit Union",
        "nmls_id": "518136",
        "our_lender_slug": "liberty-federal-credit-union",
        "legal_name": "Liberty Federal Credit Union",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif+public_nmls",
    },
    # High-volume MO/KY regionals (LEI identity; directory rows identity-first)
    "549300UF3FPC7U6RFC59": {
        "institution_name_hmda": "The Central Trust Bank",
        "nmls_id": "",
        "our_lender_slug": "central-trust-bank",
        "legal_name": "The Central Trust Bank",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif+lei_identity",
    },
    "5493002QRULT2T40BH09": {
        "institution_name_hmda": "COMMUNITYAMERICA FEDERAL CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "communityamerica-federal-credit-union",
        "legal_name": "CommunityAmerica Federal Credit Union",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif+lei_identity",
    },
    "549300ZZME37MXI1EF14": {
        "institution_name_hmda": "DAS ACQUISITION COMPANY, LLC",
        "nmls_id": "",
        "our_lender_slug": "das-acquisition-company",
        "legal_name": "DAS Acquisition Company, LLC",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif+lei_identity",
    },
    "7DMUJTL9FFTVIAG9H788": {
        "institution_name_hmda": "Commerce Bank",
        "nmls_id": "",
        "our_lender_slug": "commerce-bank",
        "legal_name": "Commerce Bank",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif+lei_identity",
    },
    "COINQMNIM6RBU631DD85": {
        "institution_name_hmda": "Arvest Bank",
        "nmls_id": "",
        "our_lender_slug": "arvest-bank",
        "legal_name": "Arvest Bank",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif+lei_identity",
    },
    "549300QR0KFPEDZPEI42": {
        "institution_name_hmda": "STOCKTON MORTGAGE CORPORATION",
        "nmls_id": "",
        "our_lender_slug": "stockton-mortgage",
        "legal_name": "Stockton Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif+lei_identity",
    },
    "254900MQ4O1DX3N88207": {
        "institution_name_hmda": "Community Trust Bank, Inc.",
        "nmls_id": "",
        "our_lender_slug": "community-trust-bank",
        "legal_name": "Community Trust Bank, Inc.",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif+lei_identity",
    },
    "4LJGQ9KJ9S0CP4B1FY29": {
        "institution_name_hmda": "Stock Yards Bank & Trust Company",
        "nmls_id": "",
        "our_lender_slug": "stock-yards-bank-trust",
        "legal_name": "Stock Yards Bank & Trust Company",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif+lei_identity",
    },
    "549300CUF3Q2PQGM9256": {
        "institution_name_hmda": "COMMONWEALTH FEDERAL CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "commonwealth-federal-credit-union",
        "legal_name": "Commonwealth Federal Credit Union",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif+lei_identity",
    },
    "X6T32LKEPUT8LQMW6755": {
        "institution_name_hmda": "Republic Bank & Trust Company",
        "nmls_id": "",
        "our_lender_slug": "republic-bank-trust-kentucky",
        "legal_name": "Republic Bank & Trust Company",
        "match_confidence": "high",
        "match_method": "mo_ky_gleif+lei_identity",
    },
}

MO_COUNTIES: dict[str, str] = {
    "29019": "Boone",
    "29021": "Buchanan",
    "29029": "Camden",
    "29031": "Cape Girardeau",
    "29037": "Cass",
    "29043": "Christian",
    "29047": "Clay",
    "29051": "Cole",
    "29071": "Franklin",
    "29077": "Greene",
    "29095": "Jackson",
    "29097": "Jasper",
    "29099": "Jefferson",
    "29113": "Lincoln",
    "29165": "Platte",
    "29183": "St. Charles",
    "29189": "St. Louis",
    "29510": "St. Louis City",
}

MO_MAJORS: set[str] = {
    "29189",  # St. Louis County
    "29095",  # Jackson
    "29183",  # St. Charles
    "29077",  # Greene
    "29047",  # Clay
    "29099",  # Jefferson
    "29510",  # St. Louis City
    "29019",  # Boone
    "29037",  # Cass
    "29097",  # Jasper
    "29043",  # Christian
    "29165",  # Platte
    "29071",  # Franklin
    "29051",  # Cole
    "29021",  # Buchanan
    "29031",  # Cape Girardeau
    "29113",  # Lincoln
    "29029",  # Camden
}

KY_COUNTIES: dict[str, str] = {
    "21015": "Boone",
    "21029": "Bullitt",
    "21037": "Campbell",
    "21047": "Christian",
    "21059": "Daviess",
    "21067": "Fayette",
    "21073": "Franklin",
    "21093": "Hardin",
    "21111": "Jefferson",
    "21113": "Jessamine",
    "21117": "Kenton",
    "21145": "McCracken",
    "21151": "Madison",
    "21179": "Nelson",
    "21185": "Oldham",
    "21209": "Scott",
    "21211": "Shelby",
    "21227": "Warren",
}

KY_MAJORS: set[str] = {
    "21111",  # Jefferson
    "21067",  # Fayette
    "21117",  # Kenton
    "21015",  # Boone
    "21227",  # Warren
    "21093",  # Hardin
    "21037",  # Campbell
    "21029",  # Bullitt
    "21151",  # Madison
    "21059",  # Daviess
    "21185",  # Oldham
    "21209",  # Scott
    "21113",  # Jessamine
    "21211",  # Shelby
    "21047",  # Christian
    "21145",  # McCracken
    "21073",  # Franklin
    "21179",  # Nelson
}

STATES = [
    {
        "code": "MO",
        "name": "Missouri",
        "folder": "missouri",
        "suffix": "_mo",
        "col": "missouri_originations",
        "alias_col": "mo_originations",
        "counties": MO_COUNTIES,
        "majors": MO_MAJORS,
    },
    {
        "code": "KY",
        "name": "Kentucky",
        "folder": "kentucky",
        "suffix": "_ky",
        "col": "kentucky_originations",
        "alias_col": "ky_originations",
        "counties": KY_COUNTIES,
        "majors": KY_MAJORS,
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
            if not nm and lei in MO_KY_CURATED_LEI:
                nm = MO_KY_CURATED_LEI[lei]["institution_name_hmda"]
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
            if not nm and lei in MO_KY_CURATED_LEI:
                nm = MO_KY_CURATED_LEI[lei]["institution_name_hmda"]
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
        if method_prefix.startswith("mo_ky_curated") and curated_slug:
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
            if not method_prefix.startswith("mo_ky_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in MO_KY_CURATED_LEI.items():
        add_mapping(lei, cur, "mo_ky_curated+")

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
        "- MO/KY curated: GLEIF-reidentified nationals + high-volume regionals "
        "(Flat Branch, Central Trust, CommunityAmerica, DAS Acquisition, Commerce Bank, "
        "Arvest, Stockton Mortgage, Community Trust Bank, Stock Yards, Commonwealth FCU, "
        "Republic Bank & Trust KY)\n"
        "- Precision only — no low-confidence LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-mo-ky-slices.py\n"
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
    for lei, cur in MO_KY_CURATED_LEI.items():
        gleif[lei] = cur["institution_name_hmda"]
    gleif.update(
        {
            "549300T67186NPGCHI50": "FIRST COMMUNITY",
            "549300F04B6FGYBJY412": "First State Community Bank",
            "549300NB3SBC1KHAWB92": "GERSHMAN INVESTMENT CORP.",
            "549300V5YG1VXZAU5G02": "UNIVERSITY OF KENTUCKY",
            "549300OHIEQGELZVJP60": "L & N Federal Credit Union",
            "254900LEJ4HP6RMWD374": "ABOUND FEDERAL CREDIT UNION",
        }
    )
    GLEIF_CACHE.parent.mkdir(parents=True, exist_ok=True)
    GLEIF_CACHE.write_text(json.dumps(gleif, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    for cfg in STATES:
        build_state(cfg, lei_to_map, gleif)


if __name__ == "__main__":
    main()

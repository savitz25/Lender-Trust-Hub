#!/usr/bin/env python3
"""
Build Alabama and Louisiana HMDA product slices.

  python scripts/build-hmda-al-la-slices.py

Source: data/hmda/by-state/{AL,LA}/
Does not modify Oregon / Washington or other product-state slices.
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
    "1820": "cmg-home-loans-dennis-vo",
    "2458338": "cmg-home-loans-dennis-vo",
    "75243": "prmg",
    "1124061": "lower",
    "1921": "primelending-columbus",
    "2909": "fairway-mortgage-augusta-sheppard",
    "1168": "amerisave",
    "1907": "veterans-united-west-valley",
    "1058": "lennar-mortgage-queen-creek",
    "1025894": "mutual-of-omaha-mortgage",
    "467341": "regions-bank",
    "480004": "synovus-bank",
    "402436": "cadence-bank",
    "405456": "first-horizon-bank",
    "14622": "dhi-mortgage-buckeye",
    "2143": "benchmark-mortgage",
    # AL / LA curated
    "403363": "redstone-federal-credit-union",
    "449605": "trustmark-bank",
    "403456": "americas-first-federal-credit-union",
    "402669": "renasant-bank",
    "405629": "river-bank-and-trust",
    "410580": "max-credit-union",
    "556357": "servisfirst-bank",
    "454781": "hancock-whitney-bank",
    "64997": "gmfs-mortgage",
    "120308": "dsld-mortgage",
    "70345": "eustis-mortgage",
    "70876": "assurance-financial",
    "488639": "fidelity-bank-louisiana",
    "409483": "efcu-financial",
}

AL_LA_CURATED_LEI: dict[str, dict[str, str]] = {
    # ── National LEI re-identify ─────────────────────────────────────────────
    "549300HW662MN1WU8550": {
        "institution_name_hmda": "United Wholesale Mortgage, LLC",
        "nmls_id": "3038",
        "our_lender_slug": "united-wholesale-mortgage",
        "legal_name": "United Wholesale Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "549300FGXN1K3HLB1R50": {
        "institution_name_hmda": "Rocket Mortgage, LLC",
        "nmls_id": "3030",
        "our_lender_slug": "rocket-mortgage",
        "legal_name": "Rocket Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "EQTWLK1G7ODGC2MGLV11": {
        "institution_name_hmda": "Regions Bank",
        "nmls_id": "467341",
        "our_lender_slug": "regions-bank",
        "legal_name": "Regions Bank",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "549300AQ3T62GXDU7D76": {
        "institution_name_hmda": "GUILD MORTGAGE COMPANY LLC",
        "nmls_id": "3274",
        "our_lender_slug": "guild-mortgage-metrowest",
        "legal_name": "Guild Mortgage Company LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "549300VZVN841I2ILS84": {
        "institution_name_hmda": "CROSSCOUNTRY MORTGAGE, LLC",
        "nmls_id": "3029",
        "our_lender_slug": "crosscountry-mortgage-metrowest",
        "legal_name": "CrossCountry Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "549300LYRWPSYPK6S325": {
        "institution_name_hmda": "FREEDOM MORTGAGE CORPORATION",
        "nmls_id": "2767",
        "our_lender_slug": "freedom-mortgage",
        "legal_name": "Freedom Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "549300AG64NHILB7ZP05": {
        "institution_name_hmda": "LOANDEPOT.COM, LLC",
        "nmls_id": "174457",
        "our_lender_slug": "loandepot",
        "legal_name": "loanDepot.com, LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "RVDPPPGHCGZ40J4VQ731": {
        "institution_name_hmda": "PENNYMAC LOAN SERVICES, LLC",
        "nmls_id": "35953",
        "our_lender_slug": "pennymac",
        "legal_name": "PennyMac Loan Services, LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "549300H3IZO24NSOO931": {
        "institution_name_hmda": "LENNAR MORTGAGE, LLC",
        "nmls_id": "1058",
        "our_lender_slug": "lennar-mortgage-queen-creek",
        "legal_name": "Lennar Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "5493001SXWZ4OFP8Z903": {
        "institution_name_hmda": "DHI MORTGAGE COMPANY, LTD.",
        "nmls_id": "14622",
        "our_lender_slug": "dhi-mortgage-buckeye",
        "legal_name": "DHI Mortgage Company, Ltd.",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+directory_slug",
    },
    "549300LBCBNR1OT00651": {
        "institution_name_hmda": "NATIONSTAR MORTGAGE LLC",
        "nmls_id": "2104",
        "our_lender_slug": "mr-cooper",
        "legal_name": "Nationstar Mortgage LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "549300MGPZBLQDIL7538": {
        "institution_name_hmda": "FAIRWAY INDEPENDENT MORTGAGE CORPORATION",
        "nmls_id": "2909",
        "our_lender_slug": "fairway-mortgage-augusta-sheppard",
        "legal_name": "Fairway Independent Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "549300DD5QQUHO6PCH70": {
        "institution_name_hmda": "MORTGAGE RESEARCH CENTER, LLC",
        "nmls_id": "1907",
        "our_lender_slug": "veterans-united-west-valley",
        "legal_name": "Mortgage Research Center, LLC (Veterans United Home Loans)",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "549300FNXYY540N23N64": {
        "institution_name_hmda": "Newrez LLC",
        "nmls_id": "2289",
        "our_lender_slug": "newrez",
        "legal_name": "Newrez LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "549300E2UX99HKDBR481": {
        "institution_name_hmda": "NEW AMERICAN FUNDING, LLC",
        "nmls_id": "6606",
        "our_lender_slug": "new-american-funding",
        "legal_name": "New American Funding, LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "549300DD4R4SYK5RAQ92": {
        "institution_name_hmda": "MOVEMENT MORTGAGE, LLC",
        "nmls_id": "39179",
        "our_lender_slug": "movement-mortgage-myrtle-beach",
        "legal_name": "Movement Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "5493003GQDUH26DNNH17": {
        "institution_name_hmda": "Navy Federal Credit Union",
        "nmls_id": "399807",
        "our_lender_slug": "navy-federal-jacksonville",
        "legal_name": "Navy Federal Credit Union",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "7H6GLXDRUGQFU57RNE97": {
        "institution_name_hmda": "JPMorgan Chase Bank, National Association",
        "nmls_id": "399798",
        "our_lender_slug": "jpmorgan-chase-bank",
        "legal_name": "JPMorgan Chase Bank, National Association",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "Q7C315HKI8VX0SSKBS64": {
        "institution_name_hmda": "Cadence Bank",
        "nmls_id": "402436",
        "our_lender_slug": "cadence-bank",
        "legal_name": "Cadence Bank",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "DX0JX77PRMOELF7VG772": {
        "institution_name_hmda": "Synovus Bank",
        "nmls_id": "480004",
        "our_lender_slug": "synovus-bank",
        "legal_name": "Synovus Bank",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "AD6GFRVSDT01YPT1CS68": {
        "institution_name_hmda": "PNC Bank, National Association",
        "nmls_id": "446038",
        "our_lender_slug": "pnc-bank",
        "legal_name": "PNC Bank, National Association",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "8I3UVGYULPJQIP7FQV10": {
        "institution_name_hmda": "SouthState Bank, National Association",
        "nmls_id": "",
        "our_lender_slug": "southstate-bank",
        "legal_name": "SouthState Bank, National Association",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+directory_slug",
    },
    "COOWI3L2W9TPYR3WJX37": {
        "institution_name_hmda": "First Horizon Bank",
        "nmls_id": "405456",
        "our_lender_slug": "first-horizon-bank",
        "legal_name": "First Horizon Bank",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "549300GKFNPRWNS0GF29": {
        "institution_name_hmda": "AmeriHome Mortgage Company, LLC",
        "nmls_id": "1120271",
        "our_lender_slug": "amerihome-mortgage",
        "legal_name": "AmeriHome Mortgage Company, LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "5493001GDRY0EL7VG372": {
        "institution_name_hmda": "ARK-LA-TEX FINANCIAL SERVICES, LLC.",
        "nmls_id": "2143",
        "our_lender_slug": "benchmark-mortgage",
        "legal_name": "Ark-La-Tex Financial Services, LLC dba Benchmark Mortgage",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    "54930021WPEXNHYZUL09": {
        "institution_name_hmda": "PLANET HOME LENDING, LLC",
        "nmls_id": "",
        "our_lender_slug": "planet-home-lending",
        "legal_name": "Planet Home Lending, LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+directory_slug",
    },
    "549300RN01LBYR8ZVX74": {
        "institution_name_hmda": "LOWER, LLC",
        "nmls_id": "1124061",
        "our_lender_slug": "lower",
        "legal_name": "Lower, LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif_reidentify+public_nmls",
    },
    # ── Alabama regionals ────────────────────────────────────────────────────
    "549300G6RZM5T8NQJW74": {
        "institution_name_hmda": "REDSTONE FEDERAL CREDIT UNION",
        "nmls_id": "403363",
        "our_lender_slug": "redstone-federal-credit-union",
        "legal_name": "Redstone Federal Credit Union",
        "match_confidence": "high",
        "match_method": "al_la_gleif+public_nmls",
    },
    "01J4SO3XTWZF4PP38209": {
        "institution_name_hmda": "Trustmark Bank",
        "nmls_id": "449605",
        "our_lender_slug": "trustmark-bank",
        "legal_name": "Trustmark National Bank",
        "match_confidence": "high",
        "match_method": "al_la_gleif+public_nmls",
    },
    "549300ERL4SV8MDO3P56": {
        "institution_name_hmda": "AMERICA'S FIRST",
        "nmls_id": "403456",
        "our_lender_slug": "americas-first-federal-credit-union",
        "legal_name": "America's First Federal Credit Union",
        "match_confidence": "high",
        "match_method": "al_la_gleif+public_nmls",
    },
    "5493002RF1ERFA2XR050": {
        "institution_name_hmda": "Renasant Bank",
        "nmls_id": "402669",
        "our_lender_slug": "renasant-bank",
        "legal_name": "Renasant Bank",
        "match_confidence": "high",
        "match_method": "al_la_gleif+public_nmls",
    },
    "5493006HAFES1LQ18W28": {
        "institution_name_hmda": "River Bank & Trust",
        "nmls_id": "405629",
        "our_lender_slug": "river-bank-and-trust",
        "legal_name": "River Bank & Trust",
        "match_confidence": "high",
        "match_method": "al_la_gleif+public_nmls",
    },
    "549300B8JSCK4ZNVX087": {
        "institution_name_hmda": "MAX Credit Union",
        "nmls_id": "410580",
        "our_lender_slug": "max-credit-union",
        "legal_name": "MAX Credit Union",
        "match_confidence": "high",
        "match_method": "al_la_gleif+public_nmls",
    },
    "549300XSS1CPK8G7B851": {
        "institution_name_hmda": "ServisFirst Bank",
        "nmls_id": "556357",
        "our_lender_slug": "servisfirst-bank",
        "legal_name": "ServisFirst Bank",
        "match_confidence": "high",
        "match_method": "al_la_gleif+public_nmls",
    },
    # ── Louisiana regionals ──────────────────────────────────────────────────
    "NSGZD26XPW2CUM2JKU70": {
        "institution_name_hmda": "HANCOCK WHITNEY BANK",
        "nmls_id": "454781",
        "our_lender_slug": "hancock-whitney-bank",
        "legal_name": "Hancock Whitney Bank",
        "match_confidence": "high",
        "match_method": "al_la_gleif+public_nmls",
    },
    "549300MCPCNPQAOB4032": {
        "institution_name_hmda": "GMFS LLC",
        "nmls_id": "64997",
        "our_lender_slug": "gmfs-mortgage",
        "legal_name": "GMFS LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif+public_nmls",
    },
    "5493001F7QT2YW3K8D98": {
        "institution_name_hmda": "DSLD MORTGAGE, LLC",
        "nmls_id": "120308",
        "our_lender_slug": "dsld-mortgage",
        "legal_name": "DSLD Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "al_la_gleif+public_nmls",
    },
    "549300DG3IV05V4C4E03": {
        "institution_name_hmda": "EUSTIS MORTGAGE CORPORATION",
        "nmls_id": "70345",
        "our_lender_slug": "eustis-mortgage",
        "legal_name": "Eustis Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "al_la_gleif+public_nmls",
    },
    "254900ZX1UPIG2E7TH11": {
        "institution_name_hmda": "ASSURANCE FINANCIAL GROUP, L.L.C.",
        "nmls_id": "70876",
        "our_lender_slug": "assurance-financial",
        "legal_name": "Assurance Financial Group, L.L.C.",
        "match_confidence": "high",
        "match_method": "al_la_gleif+public_nmls",
    },
    "549300LE3ZOZXUS7W648": {
        "institution_name_hmda": "FIDELITY BANK",
        "nmls_id": "488639",
        "our_lender_slug": "fidelity-bank-louisiana",
        "legal_name": "Fidelity Bank (Louisiana)",
        "match_confidence": "high",
        "match_method": "al_la_gleif+public_nmls",
    },
    "549300U18MOAH5F95P15": {
        "institution_name_hmda": "EFCU FINANCIAL",
        "nmls_id": "409483",
        "our_lender_slug": "efcu-financial",
        "legal_name": "EFCU Financial Federal Credit Union",
        "match_confidence": "high",
        "match_method": "al_la_gleif+public_nmls",
    },
}

# Alabama FIPS → county name (majors + secondary volume band)
AL_COUNTIES: dict[str, str] = {
    "01001": "Autauga",
    "01003": "Baldwin",
    "01015": "Calhoun",
    "01031": "Coffee",
    "01033": "Colbert",
    "01043": "Cullman",
    "01045": "Dale",
    "01049": "DeKalb",
    "01051": "Elmore",
    "01055": "Etowah",
    "01069": "Houston",
    "01071": "Jackson",
    "01073": "Jefferson",
    "01077": "Lauderdale",
    "01081": "Lee",
    "01083": "Limestone",
    "01089": "Madison",
    "01095": "Marshall",
    "01097": "Mobile",
    "01101": "Montgomery",
    "01103": "Morgan",
    "01115": "St. Clair",
    "01117": "Shelby",
    "01121": "Talladega",
    "01125": "Tuscaloosa",
    "01127": "Walker",
}

AL_MAJORS: set[str] = {
    "01073",  # Jefferson
    "01089",  # Madison
    "01003",  # Baldwin
    "01097",  # Mobile
    "01117",  # Shelby
    "01081",  # Lee
    "01125",  # Tuscaloosa
    "01101",  # Montgomery
    "01083",  # Limestone
    "01103",  # Morgan
    "01115",  # St. Clair
    "01069",  # Houston
    "01051",  # Elmore
    "01077",  # Lauderdale
    "01095",  # Marshall
    "01015",  # Calhoun
    "01055",  # Etowah
    "01043",  # Cullman
    "01001",  # Autauga
    "01031",  # Coffee
}

# Louisiana FIPS → parish name
LA_COUNTIES: dict[str, str] = {
    "22001": "Acadia",
    "22005": "Ascension",
    "22015": "Bossier",
    "22017": "Caddo",
    "22019": "Calcasieu",
    "22033": "East Baton Rouge",
    "22045": "Iberia",
    "22047": "Iberville",
    "22051": "Jefferson",
    "22055": "Lafayette",
    "22057": "Lafourche",
    "22063": "Livingston",
    "22071": "Orleans",
    "22073": "Ouachita",
    "22079": "Rapides",
    "22087": "St. Bernard",
    "22089": "St. Charles",
    "22095": "St. John the Baptist",
    "22097": "St. Landry",
    "22099": "St. Martin",
    "22103": "St. Tammany",
    "22105": "Tangipahoa",
    "22109": "Terrebonne",
    "22113": "Vermilion",
    "22117": "Washington",
    "22121": "West Baton Rouge",
}

LA_MAJORS: set[str] = {
    "22033",  # East Baton Rouge
    "22103",  # St. Tammany
    "22051",  # Jefferson
    "22055",  # Lafayette
    "22071",  # Orleans
    "22017",  # Caddo
    "22063",  # Livingston
    "22019",  # Calcasieu
    "22005",  # Ascension
    "22015",  # Bossier
    "22073",  # Ouachita
    "22105",  # Tangipahoa
    "22079",  # Rapides
    "22109",  # Terrebonne
    "22057",  # Lafourche
    "22097",  # St. Landry
    "22089",  # St. Charles
    "22113",  # Vermilion
}

STATES = [
    {
        "code": "AL",
        "name": "Alabama",
        "folder": "alabama",
        "suffix": "_al",
        "col": "alabama_originations",
        "alias_col": "al_originations",
        "counties": AL_COUNTIES,
        "majors": AL_MAJORS,
    },
    {
        "code": "LA",
        "name": "Louisiana",
        "folder": "louisiana",
        "suffix": "_la",
        "col": "louisiana_originations",
        "alias_col": "la_originations",
        "counties": LA_COUNTIES,
        "majors": LA_MAJORS,
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
        if name or fips in majors or orig >= 700:
            county_out.append(r)

    state_rows = read_csv(src / "lender_state_summary.csv")
    enriched_state: list[dict[str, str]] = []
    for r in state_rows:
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in AL_LA_CURATED_LEI:
                nm = AL_LA_CURATED_LEI[lei]["institution_name_hmda"]
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
            if not nm and lei in AL_LA_CURATED_LEI:
                nm = AL_LA_CURATED_LEI[lei]["institution_name_hmda"]
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
        if method_prefix.startswith("al_la_curated") and curated_slug:
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
            if not method_prefix.startswith("al_la_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in AL_LA_CURATED_LEI.items():
        add_mapping(lei, cur, "al_la_curated+")

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

    unit = "parishes" if code == "LA" else "counties"
    md = [
        f"# {cfg['name']} HMDA slice\n\n",
        f"**Source:** `data/hmda/by-state/{code}/` (national 2025 foundation)\n\n",
        f"- County/parish market rows: **{len(county_out)}**\n",
        f"- Lender–{unit[:-1]} activity (major markets): **{len(act_out)}**\n",
        f"- LEI state summaries: **{len(state_rows)}**\n",
        f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
        f"- Major markets with names: **{len(major_named)}**\n\n",
        f"## Top mapped LEIs by {code} originations\n\n",
    ]
    for r in mapping_rows[:25]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r[col]} {code} orig.)\n"
        )
    md.append(f"\n## Major markets (panel-ready {unit})\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Matching rules\n\n"
        "- Reuse prior product-state curated LEI maps when the LEI has activity in this state\n"
        "- AL curated: Redstone FCU, Trustmark, America's First FCU, Renasant, River Bank & Trust, "
        "MAX CU, ServisFirst\n"
        "- LA curated: Hancock Whitney, GMFS, DSLD Mortgage, Eustis, Assurance Financial, "
        "Fidelity Bank (LA), EFCU Financial\n"
        "- National LEI re-identify for UWM, Rocket, Regions, Guild, CrossCountry, Freedom, etc.\n"
        "- Precision over coverage — no fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-al-la-slices.py\n"
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
    for lei, cur in AL_LA_CURATED_LEI.items():
        gleif.setdefault(lei, cur["institution_name_hmda"])
    if GLEIF_CACHE.exists():
        GLEIF_CACHE.write_text(json.dumps(gleif, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    for cfg in STATES:
        build_state(cfg, lei_to_map, gleif)


if __name__ == "__main__":
    main()

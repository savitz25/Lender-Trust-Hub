#!/usr/bin/env python3
"""
Build Wisconsin and Minnesota HMDA product slices.

  python scripts/build-hmda-wi-mn-slices.py

Source: data/hmda/by-state/{WI,MN}/
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
    "401043": "landmark-credit-union",
    "523134": "trustone-financial-credit-union",
}

# GLEIF-verified LEI identities → existing national/directory slugs.
# Regional WI/MN CUs without directory profiles intentionally omitted.
WI_MN_CURATED_LEI: dict[str, dict[str, str]] = {
    "549300MGPZBLQDIL7538": {
        "institution_name_hmda": "FAIRWAY INDEPENDENT MORTGAGE CORPORATION",
        "nmls_id": "2909",
        "our_lender_slug": "fairway-mortgage-augusta-sheppard",
        "legal_name": "Fairway Independent Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "wi_mn_gleif_reidentify+public_nmls",
    },
    "RVDPPPGHCGZ40J4VQ731": {
        "institution_name_hmda": "PENNYMAC LOAN SERVICES, LLC",
        "nmls_id": "35953",
        "our_lender_slug": "pennymac",
        "legal_name": "PennyMac Loan Services, LLC",
        "match_confidence": "high",
        "match_method": "wi_mn_gleif_reidentify+public_nmls",
    },
    "549300U3721PJGQZYY68": {
        "institution_name_hmda": "GUARANTEED RATE, INC.",
        "nmls_id": "2611",
        "our_lender_slug": "guaranteed-rate",
        "legal_name": "Guaranteed Rate, Inc.",
        "match_confidence": "high",
        "match_method": "wi_mn_gleif_reidentify+public_nmls",
    },
    "549300AG64NHILB7ZP05": {
        "institution_name_hmda": "LOANDEPOT.COM, LLC",
        "nmls_id": "174457",
        "our_lender_slug": "loandepot",
        "legal_name": "loanDepot.com, LLC",
        "match_confidence": "high",
        "match_method": "wi_mn_gleif_reidentify+public_nmls",
    },
    "549300VZVN841I2ILS84": {
        "institution_name_hmda": "CROSSCOUNTRY MORTGAGE, LLC",
        "nmls_id": "3029",
        "our_lender_slug": "crosscountry-mortgage-metrowest",
        "legal_name": "CrossCountry Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "wi_mn_gleif_reidentify+public_nmls",
    },
    "549300AQ3T62GXDU7D76": {
        "institution_name_hmda": "GUILD MORTGAGE COMPANY LLC",
        "nmls_id": "3274",
        "our_lender_slug": "guild-mortgage-metrowest",
        "legal_name": "Guild Mortgage Company LLC",
        "match_confidence": "high",
        "match_method": "wi_mn_gleif_reidentify+public_nmls",
    },
    "549300DD5QQUHO6PCH70": {
        "institution_name_hmda": "MORTGAGE RESEARCH CENTER, LLC",
        "nmls_id": "1907",
        "our_lender_slug": "veterans-united-west-valley",
        "legal_name": "Mortgage Research Center, LLC (Veterans United Home Loans)",
        "match_confidence": "high",
        "match_method": "wi_mn_gleif_reidentify+public_nmls",
    },
    "549300H3IZO24NSOO931": {
        "institution_name_hmda": "LENNAR MORTGAGE, LLC",
        "nmls_id": "1058",
        "our_lender_slug": "lennar-mortgage-queen-creek",
        "legal_name": "Lennar Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "wi_mn_gleif_reidentify+public_nmls",
    },
    "549300LBCBNR1OT00651": {
        "institution_name_hmda": "NATIONSTAR MORTGAGE LLC",
        "nmls_id": "2104",
        "our_lender_slug": "mr-cooper",
        "legal_name": "Nationstar Mortgage LLC (Mr. Cooper)",
        "match_confidence": "high",
        "match_method": "wi_mn_gleif_reidentify+public_nmls",
    },
    "549300LYRWPSYPK6S325": {
        "institution_name_hmda": "FREEDOM MORTGAGE CORPORATION",
        "nmls_id": "2767",
        "our_lender_slug": "freedom-mortgage",
        "legal_name": "Freedom Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "wi_mn_gleif_reidentify+public_nmls",
    },
    "2WHM8VNJH63UN14OL754": {
        "institution_name_hmda": "The Huntington National Bank",
        "nmls_id": "402436",
        "our_lender_slug": "huntington-national-bank",
        "legal_name": "The Huntington National Bank",
        "match_confidence": "high",
        "match_method": "wi_mn_gleif+public_nmls",
    },
    "549300AT7EB9FJAF0E61": {
        "institution_name_hmda": "Old National Bank",
        "nmls_id": "459308",
        "our_lender_slug": "old-national-bank",
        "legal_name": "Old National Bank",
        "match_confidence": "high",
        "match_method": "wi_mn_gleif+public_nmls",
    },
    "3Y4U8VZURTYWI1W2K376": {
        "institution_name_hmda": "BMO Bank National Association",
        "nmls_id": "401052",
        "our_lender_slug": "bmo-bank",
        "legal_name": "BMO Bank National Association",
        "match_confidence": "high",
        "match_method": "wi_mn_gleif+public_nmls",
    },
    "549300XWUSRVVOHPRY47": {
        "institution_name_hmda": "Academy Mortgage Corporation",
        "nmls_id": "3113",
        "our_lender_slug": "academy-mortgage",
        "legal_name": "Academy Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "wi_mn_gleif+public_nmls",
    },
    "C398JSK21YCXWM603F55": {
        "institution_name_hmda": "Barrington Bank & Trust Company, National Association",
        "nmls_id": "449042",
        "our_lender_slug": "wintrust-mortgage",
        "legal_name": "Barrington Bank & Trust / Wintrust Mortgage",
        "match_confidence": "high",
        "match_method": "wi_mn_reuse_wintrust_family+public_nmls",
    },
    # ── Deepen: high-volume WI / MN regionals (LEI identity; NMLS only when verified) ─
    "254900NTAC4H10MGSU23": {
        "institution_name_hmda": "Summit Credit Union",
        "nmls_id": "",
        "our_lender_slug": "summit-credit-union",
        "legal_name": "Summit Credit Union",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "254900CN1DD55MJDFH69": {
        "institution_name_hmda": "University Of Wisconsin Credit Union",
        "nmls_id": "",
        "our_lender_slug": "university-of-wisconsin-credit-union",
        "legal_name": "UW Credit Union",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "549300KY533JFETOYG46": {
        "institution_name_hmda": "Landmark Credit Union",
        "nmls_id": "401043",
        "our_lender_slug": "landmark-credit-union",
        "legal_name": "Landmark Credit Union",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+public_nmls",
    },
    "ZF85QS7OXKPBG52R7N18": {
        "institution_name_hmda": "Associated Bank, National Association",
        "nmls_id": "",
        "our_lender_slug": "associated-bank",
        "legal_name": "Associated Bank, National Association",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "254900CIEUZUO7CHPG88": {
        "institution_name_hmda": "COVANTAGE CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "covantage-credit-union",
        "legal_name": "CoVantage Credit Union",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "254900Q5026VQBAVI394": {
        "institution_name_hmda": "Community First Credit Union",
        "nmls_id": "",
        "our_lender_slug": "community-first-credit-union-wi",
        "legal_name": "Community First Credit Union (Appleton, WI)",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "549300FS35FQXZRU4Z45": {
        "institution_name_hmda": "EDUCATORS CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "educators-credit-union",
        "legal_name": "Educators Credit Union",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "IWRZQFYIRJ0IMURZBB68": {
        "institution_name_hmda": "Johnson Bank",
        "nmls_id": "",
        "our_lender_slug": "johnson-bank",
        "legal_name": "Johnson Bank",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "549300OZ550X4QD5PC74": {
        "institution_name_hmda": "Royal Credit Union",
        "nmls_id": "",
        "our_lender_slug": "royal-credit-union",
        "legal_name": "Royal Credit Union",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "549300FUMS21JPQM1N03": {
        "institution_name_hmda": "FOX COMMUNITIES CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "fox-communities-credit-union",
        "legal_name": "Fox Communities Credit Union",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "38CFVD4YYFWD1FV7IM34": {
        "institution_name_hmda": "Nicolet National Bank",
        "nmls_id": "",
        "our_lender_slug": "nicolet-national-bank",
        "legal_name": "Nicolet National Bank",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "549300VEZ43KYEWR3610": {
        "institution_name_hmda": "CAPITAL Credit Union",
        "nmls_id": "",
        "our_lender_slug": "capital-credit-union-wi",
        "legal_name": "Capital Credit Union (Wisconsin)",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "549300BRLQAIJ1LJA253": {
        "institution_name_hmda": "Bank First, N.A.",
        "nmls_id": "",
        "our_lender_slug": "bank-first-na",
        "legal_name": "Bank First, N.A.",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "549300A0SVCQJPHVGV20": {
        "institution_name_hmda": "ALTRA Federal Credit Union",
        "nmls_id": "",
        "our_lender_slug": "altra-federal-credit-union",
        "legal_name": "Altra Federal Credit Union",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "254900X6OAHFW6BUT219": {
        "institution_name_hmda": "WESTCONSIN CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "westconsin-credit-union",
        "legal_name": "Westconsin Credit Union",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "549300WYBPIWKK6SQC06": {
        "institution_name_hmda": "Bell Bank",
        "nmls_id": "",
        "our_lender_slug": "bell-bank",
        "legal_name": "Bell Bank",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "549300LG07PXWSIMC813": {
        "institution_name_hmda": "TRUSTONE FINANCIAL CREDIT UNION",
        "nmls_id": "523134",
        "our_lender_slug": "trustone-financial-credit-union",
        "legal_name": "TruStone Financial Credit Union",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+public_nmls",
    },
    "549300NL3JN3ABDPH257": {
        "institution_name_hmda": "AFFINITY PLUS",
        "nmls_id": "",
        "our_lender_slug": "affinity-plus-federal-credit-union",
        "legal_name": "Affinity Plus Federal Credit Union",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "549300QDGMFASKEN7Z77": {
        "institution_name_hmda": "BLAZE CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "blaze-credit-union",
        "legal_name": "Blaze Credit Union",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "549300HVW3AI97UKTO72": {
        "institution_name_hmda": "Wings Financial Credit Union",
        "nmls_id": "",
        "our_lender_slug": "wings-financial-credit-union",
        "legal_name": "Wings Financial Credit Union",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
    "549300C4J510S9L1RF98": {
        "institution_name_hmda": "Alerus Financial, National Association",
        "nmls_id": "",
        "our_lender_slug": "alerus-financial",
        "legal_name": "Alerus Financial, National Association",
        "match_confidence": "high",
        "match_method": "wi_mn_deepen_gleif+lei_identity",
    },
}

# Wisconsin county FIPS → name (wave 1 + deepen)
WI_COUNTIES: dict[str, str] = {
    "55005": "Barron",
    "55009": "Brown",
    "55015": "Calumet",
    "55017": "Chippewa",
    "55021": "Columbia",
    "55025": "Dane",
    "55027": "Dodge",
    "55029": "Door",
    "55031": "Douglas",
    "55033": "Dunn",
    "55035": "Eau Claire",
    "55039": "Fond du Lac",
    "55045": "Green",
    "55055": "Jefferson",
    "55059": "Kenosha",
    "55063": "La Crosse",
    "55071": "Manitowoc",
    "55073": "Marathon",
    "55075": "Marinette",
    "55079": "Milwaukee",
    "55081": "Monroe",
    "55083": "Oconto",
    "55085": "Oneida",
    "55087": "Outagamie",
    "55089": "Ozaukee",
    "55093": "Pierce",
    "55095": "Polk",
    "55097": "Portage",
    "55101": "Racine",
    "55105": "Rock",
    "55109": "St. Croix",
    "55111": "Sauk",
    "55115": "Shawano",
    "55117": "Sheboygan",
    "55127": "Walworth",
    "55131": "Washington",
    "55133": "Waukesha",
    "55135": "Waupaca",
    "55139": "Winnebago",
    "55141": "Wood",
}

WI_MAJORS: set[str] = {
    # Wave 1
    "55079",  # Milwaukee
    "55025",  # Dane
    "55133",  # Waukesha
    "55009",  # Brown
    "55087",  # Outagamie
    "55101",  # Racine
    "55105",  # Rock
    "55139",  # Winnebago
    "55059",  # Kenosha
    "55131",  # Washington
    "55073",  # Marathon
    "55117",  # Sheboygan
    "55063",  # La Crosse
    "55127",  # Walworth
    "55109",  # St. Croix
    "55039",  # Fond du Lac
    "55089",  # Ozaukee
    "55035",  # Eau Claire
    "55027",  # Dodge
    "55071",  # Manitowoc
    # Deepen — next volume / regional
    "55055",  # Jefferson
    "55021",  # Columbia
    "55111",  # Sauk
    "55015",  # Calumet
    "55017",  # Chippewa
    "55141",  # Wood
    "55135",  # Waupaca
    "55095",  # Polk
    "55097",  # Portage
    "55083",  # Oconto
    "55005",  # Barron
    "55075",  # Marinette
    "55115",  # Shawano
    "55031",  # Douglas
    "55085",  # Oneida
    "55081",  # Monroe
    "55029",  # Door
    "55093",  # Pierce
    "55045",  # Green
    "55033",  # Dunn
}

MN_COUNTIES: dict[str, str] = {
    "27003": "Anoka",
    "27005": "Becker",
    "27009": "Benton",
    "27013": "Blue Earth",
    "27017": "Carlton",
    "27019": "Carver",
    "27021": "Cass",
    "27025": "Chisago",
    "27027": "Clay",
    "27035": "Crow Wing",
    "27037": "Dakota",
    "27041": "Douglas",
    "27049": "Goodhue",
    "27053": "Hennepin",
    "27059": "Isanti",
    "27061": "Itasca",
    "27067": "Kandiyohi",
    "27079": "Le Sueur",
    "27085": "McLeod",
    "27095": "Mille Lacs",
    "27099": "Mower",
    "27103": "Nicollet",
    "27109": "Olmsted",
    "27111": "Otter Tail",
    "27115": "Pine",
    "27123": "Ramsey",
    "27131": "Rice",
    "27137": "St. Louis",
    "27139": "Scott",
    "27141": "Sherburne",
    "27145": "Stearns",
    "27147": "Steele",
    "27163": "Washington",
    "27169": "Winona",
    "27171": "Wright",
    "27097": "Morrison",
}

MN_MAJORS: set[str] = {
    # Wave 1
    "27053",  # Hennepin
    "27037",  # Dakota
    "27123",  # Ramsey
    "27003",  # Anoka
    "27163",  # Washington
    "27171",  # Wright
    "27137",  # St. Louis
    "27139",  # Scott
    "27109",  # Olmsted
    "27145",  # Stearns
    "27019",  # Carver
    "27141",  # Sherburne
    "27035",  # Crow Wing
    "27025",  # Chisago
    "27027",  # Clay
    "27131",  # Rice
    "27013",  # Blue Earth
    "27111",  # Otter Tail
    "27059",  # Isanti
    "27169",  # Winona
    # Deepen — next volume / regional
    "27049",  # Goodhue
    "27061",  # Itasca
    "27017",  # Carlton
    "27009",  # Benton
    "27095",  # Mille Lacs
    "27041",  # Douglas
    "27085",  # McLeod
    "27021",  # Cass
    "27005",  # Becker
    "27099",  # Mower
    "27115",  # Pine
    "27067",  # Kandiyohi
    "27147",  # Steele
    "27079",  # Le Sueur
    "27097",  # Morrison
    "27103",  # Nicollet
}

STATES = [
    {
        "code": "WI",
        "name": "Wisconsin",
        "folder": "wisconsin",
        "suffix": "_wi",
        "col": "wisconsin_originations",
        "alias_col": "wi_originations",
        "counties": WI_COUNTIES,
        "majors": WI_MAJORS,
    },
    {
        "code": "MN",
        "name": "Minnesota",
        "folder": "minnesota",
        "suffix": "_mn",
        "col": "minnesota_originations",
        "alias_col": "mn_originations",
        "counties": MN_COUNTIES,
        "majors": MN_MAJORS,
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
            if not nm and lei in WI_MN_CURATED_LEI:
                nm = WI_MN_CURATED_LEI[lei]["institution_name_hmda"]
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
            if not nm and lei in WI_MN_CURATED_LEI:
                nm = WI_MN_CURATED_LEI[lei]["institution_name_hmda"]
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
        if method_prefix.startswith("wi_mn_curated") and curated_slug:
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
            if not method_prefix.startswith("wi_mn_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in WI_MN_CURATED_LEI.items():
        add_mapping(lei, cur, "wi_mn_curated+")

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
        "- WI/MN curated: GLEIF-reidentified nationals + deepen regionals "
        "(Summit CU, UWCU, Landmark, Associated Bank, Bell Bank, TruStone, Affinity Plus, "
        "Blaze, Wings, Johnson Bank, Nicolet, Royal CU, and other high-volume LEI identities)\n"
        "- NMLS filled only when verified (e.g. Landmark 401043, TruStone 523134); else LEI identity\n"
        "- Remaining unmapped regionals deferred when no high-confidence directory link\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-wi-mn-slices.py\n"
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
    for lei, cur in WI_MN_CURATED_LEI.items():
        gleif[lei] = cur["institution_name_hmda"]
    # High-volume regional names for panel readability (not mapped without directory)
    gleif.update(
        {
            "254900NTAC4H10MGSU23": "Summit Credit Union",
            "254900CN1DD55MJDFH69": "University Of Wisconsin Credit Union",
            "549300KY533JFETOYG46": "Landmark Credit Union",
            "ZF85QS7OXKPBG52R7N18": "Associated Bank, National Association",
            "254900CIEUZUO7CHPG88": "COVANTAGE CREDIT UNION",
            "254900Q5026VQBAVI394": "Community First Credit Union",
            "549300FS35FQXZRU4Z45": "EDUCATORS CREDIT UNION",
            "IWRZQFYIRJ0IMURZBB68": "Johnson Bank",
            "549300OZ550X4QD5PC74": "Royal Credit Union",
            "549300FUMS21JPQM1N03": "FOX COMMUNITIES CREDIT UNION",
            "38CFVD4YYFWD1FV7IM34": "Nicolet National Bank",
            "549300WYBPIWKK6SQC06": "Bell Bank",
            "549300LG07PXWSIMC813": "TRUSTONE FINANCIAL CREDIT UNION",
            "549300NL3JN3ABDPH257": "AFFINITY PLUS",
            "549300QDGMFASKEN7Z77": "BLAZE CREDIT UNION",
            "549300HVW3AI97UKTO72": "Wings Financial Credit Union",
        }
    )
    GLEIF_CACHE.parent.mkdir(parents=True, exist_ok=True)
    GLEIF_CACHE.write_text(json.dumps(gleif, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    for cfg in STATES:
        build_state(cfg, lei_to_map, gleif)


if __name__ == "__main__":
    main()

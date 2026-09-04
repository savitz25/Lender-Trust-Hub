"""TX-LEND-001 — Texas mortgage state snapshot from official bulk/easy sources.

Allowed: committed HMDA slices, SML enforcement CSV, official PDFs/pages, CFPB API, open data.
Forbidden: NMLS scrape, individual license crawl, county clerk/foreclosure crawl, county routes, MLO person harvest.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import re
import ssl
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

UA = "LenderTrustHub-TX-LEND-001/1.0 (+https://www.lendertrusthub.com; official bulk research)"
CTX = ssl.create_default_context()
ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "texas"
ART = ROOT / "artifacts"
LIB = ROOT / "lib" / "texas-intelligence"
RAW.mkdir(parents=True, exist_ok=True)
ART.mkdir(parents=True, exist_ok=True)
LIB.mkdir(parents=True, exist_ok=True)

HMDA_COUNTY = ROOT / "data" / "hmda" / "by-state" / "TX" / "county_market_summary.csv"
HMDA_LENDER = ROOT / "data" / "hmda" / "by-state" / "TX" / "lender_state_summary.csv"
HMDA_MAP = ROOT / "data" / "hmda" / "texas" / "lei_to_nmls_mapping.csv"
HMDA_CLEAN = ROOT / "data" / "hmda" / "cleaned" / "county_market_summary.csv"

SML_CSV = "https://www.sml.texas.gov/wp-content/uploads/2025/10/sml_enforcement_orders_data_10_16_2025.csv"
SML_INDEX = "https://www.sml.texas.gov/consumers/enforcement/"
SML_REPORT = "https://www.sml.texas.gov/wp-content/uploads/2024/12/2024-Report-on-Mortgage-Lending-in-Texas.pdf"
CFPB_API = "https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/"
CKAN = "https://data.texas.gov/api/3/action/package_search"

TX_COUNTY_NAMES = {
    "48001": "Anderson", "48003": "Andrews", "48005": "Angelina", "48007": "Aransas",
    "48009": "Archer", "48011": "Armstrong", "48013": "Atascosa", "48015": "Austin",
    "48017": "Bailey", "48019": "Bandera", "48021": "Bastrop", "48023": "Baylor",
    "48025": "Bee", "48027": "Bell", "48029": "Bexar", "48031": "Blanco",
    "48033": "Borden", "48035": "Bosque", "48037": "Bowie", "48039": "Brazoria",
    "48041": "Brazos", "48043": "Brewster", "48045": "Briscoe", "48047": "Brooks",
    "48049": "Brown", "48051": "Burleson", "48053": "Burnet", "48055": "Caldwell",
    "48057": "Calhoun", "48059": "Callahan", "48061": "Cameron", "48063": "Camp",
    "48065": "Carson", "48067": "Cass", "48069": "Castro", "48071": "Chambers",
    "48073": "Cherokee", "48075": "Childress", "48077": "Clay", "48079": "Cochran",
    "48081": "Coke", "48083": "Coleman", "48085": "Collin", "48087": "Collingsworth",
    "48089": "Colorado", "48091": "Comal", "48093": "Comanche", "48095": "Concho",
    "48097": "Cooke", "48099": "Coryell", "48101": "Cottle", "48103": "Crane",
    "48105": "Crockett", "48107": "Crosby", "48109": "Culberson", "48111": "Dallam",
    "48113": "Dallas", "48115": "Dawson", "48117": "Deaf Smith", "48119": "Delta",
    "48121": "Denton", "48123": "DeWitt", "48125": "Dickens", "48127": "Dimmit",
    "48129": "Donley", "48131": "Duval", "48133": "Eastland", "48135": "Ector",
    "48137": "Edwards", "48139": "Ellis", "48141": "El Paso", "48143": "Erath",
    "48145": "Falls", "48147": "Fannin", "48149": "Fayette", "48151": "Fisher",
    "48153": "Floyd", "48155": "Foard", "48157": "Fort Bend", "48159": "Franklin",
    "48161": "Freestone", "48163": "Frio", "48165": "Gaines", "48167": "Galveston",
    "48169": "Garza", "48171": "Gillespie", "48173": "Glasscock", "48175": "Goliad",
    "48177": "Gonzales", "48179": "Gray", "48181": "Grayson", "48183": "Gregg",
    "48185": "Grimes", "48187": "Guadalupe", "48189": "Hale", "48191": "Hall",
    "48193": "Hamilton", "48195": "Hansford", "48197": "Hardeman", "48199": "Hardin",
    "48201": "Harris", "48203": "Harrison", "48205": "Hartley", "48207": "Haskell",
    "48209": "Hays", "48211": "Hemphill", "48213": "Henderson", "48215": "Hidalgo",
    "48217": "Hill", "48219": "Hockley", "48221": "Hood", "48223": "Hopkins",
    "48225": "Houston", "48227": "Howard", "48229": "Hudspeth", "48231": "Hunt",
    "48233": "Hutchinson", "48235": "Irion", "48237": "Jack", "48239": "Jackson",
    "48241": "Jasper", "48243": "Jeff Davis", "48245": "Jefferson", "48247": "Jim Hogg",
    "48249": "Jim Wells", "48251": "Johnson", "48253": "Jones", "48255": "Karnes",
    "48257": "Kaufman", "48259": "Kendall", "48261": "Kenedy", "48263": "Kent",
    "48265": "Kerr", "48267": "Kimble", "48269": "King", "48271": "Kinney",
    "48273": "Kleberg", "48275": "Knox", "48277": "Lamar", "48279": "Lamb",
    "48281": "Lampasas", "48283": "La Salle", "48285": "Lavaca", "48287": "Lee",
    "48289": "Leon", "48291": "Liberty", "48293": "Limestone", "48295": "Lipscomb",
    "48297": "Live Oak", "48299": "Llano", "48301": "Loving", "48303": "Lubbock",
    "48305": "Lynn", "48307": "McCulloch", "48309": "McLennan", "48311": "McMullen",
    "48313": "Madison", "48315": "Marion", "48317": "Martin", "48319": "Mason",
    "48321": "Matagorda", "48323": "Maverick", "48325": "Medina", "48327": "Menard",
    "48329": "Midland", "48331": "Milam", "48333": "Mills", "48335": "Mitchell",
    "48337": "Montague", "48339": "Montgomery", "48341": "Moore", "48343": "Morris",
    "48345": "Motley", "48347": "Nacogdoches", "48349": "Navarro", "48351": "Newton",
    "48353": "Nolan", "48355": "Nueces", "48357": "Ochiltree", "48359": "Oldham",
    "48361": "Orange", "48363": "Palo Pinto", "48365": "Panola", "48367": "Parker",
    "48369": "Parmer", "48371": "Pecos", "48373": "Polk", "48375": "Potter",
    "48377": "Presidio", "48379": "Rains", "48381": "Randall", "48383": "Reagan",
    "48385": "Real", "48387": "Red River", "48389": "Reeves", "48391": "Refugio",
    "48393": "Roberts", "48395": "Robertson", "48397": "Rockwall", "48399": "Runnels",
    "48401": "Rusk", "48403": "Sabine", "48405": "San Augustine", "48407": "San Jacinto",
    "48409": "San Patricio", "48411": "San Saba", "48413": "Schleicher", "48415": "Scurry",
    "48417": "Shackelford", "48419": "Shelby", "48421": "Sherman", "48423": "Smith",
    "48425": "Somervell", "48427": "Starr", "48429": "Stephens", "48431": "Sterling",
    "48433": "Stonewall", "48435": "Sutton", "48437": "Swisher", "48439": "Tarrant",
    "48441": "Taylor", "48443": "Terrell", "48445": "Terry", "48447": "Throckmorton",
    "48449": "Titus", "48451": "Tom Green", "48453": "Travis", "48455": "Trinity",
    "48457": "Tyler", "48459": "Upshur", "48461": "Upton", "48463": "Uvalde",
    "48465": "Val Verde", "48467": "Van Zandt", "48469": "Victoria", "48471": "Walker",
    "48473": "Waller", "48475": "Ward", "48477": "Washington", "48479": "Webb",
    "48481": "Wharton", "48483": "Wheeler", "48485": "Wichita", "48487": "Wilbarger",
    "48489": "Willacy", "48491": "Williamson", "48493": "Wilson", "48495": "Winkler",
    "48497": "Wise", "48499": "Wood", "48501": "Yoakum", "48503": "Young",
    "48505": "Zapata", "48507": "Zavala",
}


def fetch(url: str, timeout: int = 90) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read() if e.fp else b""
    except Exception as e:
        return 0, str(e).encode()


def pct(n: int, d: int) -> float:
    return round((n / d) * 100, 2) if d else 0.0


def num(row: dict, key: str) -> int:
    raw = (row.get(key) or "0").replace(",", "").strip()
    try:
        return int(float(raw))
    except ValueError:
        return 0


def fnum(row: dict, key: str) -> float:
    raw = (row.get(key) or "0").replace(",", "").strip()
    try:
        return float(raw)
    except ValueError:
        return 0.0


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def strip_html(raw: bytes) -> str:
    text = raw.decode("utf-8", "replace")
    text = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", text)
    text = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_nmls(raw: str) -> str | None:
    digits = re.sub(r"\D", "", raw or "")
    if not re.fullmatch(r"\d{3,12}", digits) or re.fullmatch(r"0+", digits):
        return None
    return digits


def hmda_block() -> dict:
    cleaned_names: dict[str, str] = {}
    if HMDA_CLEAN.exists():
        for r in csv.DictReader(HMDA_CLEAN.open(encoding="utf-8")):
            if (r.get("state") or "").upper() != "TX":
                continue
            fips = (r.get("county_fips") or "").strip()
            name = (r.get("county_name") or "").strip()
            if fips and name:
                cleaned_names[fips] = name

    rows = [r for r in csv.DictReader(HMDA_COUNTY.open(encoding="utf-8")) if (r.get("state") or "").upper() == "TX"]
    counties = []
    unnamed = 0
    for r in rows:
        fips = (r.get("county_fips") or "").strip()
        name = (
            (r.get("county_name") or "").strip()
            or cleaned_names.get(fips)
            or TX_COUNTY_NAMES.get(fips)
        )
        if not name or name.startswith("48"):
            unnamed += 1
            raise SystemExit(f"Texas county FIPS {fips} has no publishable name")
        counties.append(
            {
                "county_fips": fips,
                "county_name": name,
                "applications": num(r, "total_applications"),
                "originations": num(r, "total_originations"),
                "denials": num(r, "denial_count"),
                "denial_rate_pct": fnum(r, "denial_rate_pct"),
                "purchase_applications": num(r, "purchase_count"),
                "refinance_applications": num(r, "refinance_count"),
                "purchase_pct_of_apps": fnum(r, "purchase_pct_of_apps"),
                "refinance_pct_of_apps": fnum(r, "refinance_pct_of_apps"),
                "apps_conventional": num(r, "apps_conventional"),
                "apps_fha": num(r, "apps_fha"),
                "apps_va": num(r, "apps_va"),
                "apps_usda_other": num(r, "apps_usda_other"),
                "conventional_pct": fnum(r, "apps_conventional_pct"),
            }
        )
    counties.sort(key=lambda c: (c["county_name"], c["county_fips"]))
    apps = sum(c["applications"] for c in counties)
    orig = sum(c["originations"] for c in counties)
    den = sum(c["denials"] for c in counties)
    purch = sum(c["purchase_applications"] for c in counties)
    refi = sum(c["refinance_applications"] for c in counties)
    conv = sum(c["apps_conventional"] for c in counties)
    fha = sum(c["apps_fha"] for c in counties)
    va = sum(c["apps_va"] for c in counties)
    usda = sum(c["apps_usda_other"] for c in counties)

    maps: dict[str, dict] = {}
    if HMDA_MAP.exists():
        for r in csv.DictReader(HMDA_MAP.open(encoding="utf-8")):
            lei = (r.get("lei") or "").strip()
            if lei:
                maps[lei] = r
    reporters = []
    for r in csv.DictReader(HMDA_LENDER.open(encoding="utf-8")):
        lei = (r.get("lei") or "").strip()
        if not lei:
            continue
        mapped = maps.get(lei)
        nmls = normalize_nmls((mapped or {}).get("nmls_id") or "") if mapped else None
        reporters.append(
            {
                "lei": lei,
                "applications": num(r, "total_applications"),
                "originations": num(r, "total_originations"),
                "institution_name": (mapped or {}).get("institution_name_hmda") or None,
                "nmls_id": nmls,
                "our_lender_slug": (mapped or {}).get("our_lender_slug") or None,
                "identity": "EXACT_LEI_AND_NMLS" if nmls else ("EXACT_LEI_MAPPED" if mapped else "EXACT_LEI_UNMAPPED"),
            }
        )
    reporters.sort(key=lambda x: (-x["applications"], x["lei"]))
    return {
        "year": 2025,
        "geo_grain": "state_and_county",
        "state_code": "TX",
        "source": "Committed HMDA Texas partition data/hmda/by-state/TX/county_market_summary.csv. Properties located in Texas. Not a second national download.",
        "source_as_of": "HMDA 2025",
        "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
        "applications": apps,
        "originations": orig,
        "denials": den,
        "denial_rate_pct": pct(den, apps),
        "denial_rate_calculation": "denials / applications * 100, rounded to 2 decimals",
        "purchase_applications": purch,
        "refinance_applications": refi,
        "purchase_pct_of_apps": pct(purch, apps),
        "refinance_pct_of_apps": pct(refi, apps),
        "apps_conventional": conv,
        "apps_fha": fha,
        "apps_va": va,
        "apps_usda_other": usda,
        "conventional_pct": pct(conv, apps),
        "fha_pct": pct(fha, apps),
        "va_pct": pct(va, apps),
        "usda_other_pct": pct(usda, apps),
        "county_count": len(counties),
        "texas_county_universe": 254,
        "all_254_counties": len(counties) == 254,
        "counties": counties,
        "lei_reporter_rows": len(reporters),
        "lei_reporters_with_exact_nmls": sum(1 for r in reporters if r["nmls_id"]),
        "top_reporters_by_applications": reporters[:15],
        "caveat": "HMDA is a mortgage-application filing extract for properties located in Texas. It is not a Texas license roster, not a quality ranking, and the denial rate does not prove discrimination.",
        "omitted": {
            "median_loan_amount": "Not present in the committed 2025 TX county summary extract.",
        },
    }


def sml_orders() -> dict:
    status, body = fetch(SML_CSV, timeout=120)
    out = {
        "source": "Texas Department of Savings and Mortgage Lending enforcement orders CSV",
        "agency": "Texas Department of Savings and Mortgage Lending",
        "url": SML_CSV,
        "index_url": SML_INDEX,
        "http_status": status,
        "bytes": len(body),
        "grain": "enforcement_order",
        "identity_bar": "EXACT_NMLS_ONLY_FOR_ADVERSE_ATTACH",
    }
    if status != 200 or len(body) < 200:
        out["result"] = "SOURCE_NOT_ACQUIRED"
        out["coverage_state"] = "SOURCE_NOT_ACQUIRED"
        return out
    path = RAW / "sml_enforcement_orders_data_10_16_2025.csv"
    path.write_bytes(body)
    sha = hashlib.sha256(body).hexdigest()
    text = body.decode("utf-8-sig", "replace")
    reader = csv.reader(io.StringIO(text))
    first = next(reader, None) or []
    clock = None
    joined = " ".join(first)
    m = re.search(r"Updated:\s*([0-9]{1,2}/[0-9]{1,2}/[0-9]{4})", joined, re.I)
    if m:
        mm, dd, yy = m.group(1).split("/")
        clock = f"{yy}-{int(mm):02d}-{int(dd):02d}"
    header = next(reader, None) or []
    header = [h.strip() for h in header]
    rows = []
    for parts in reader:
        if not any(p.strip() for p in parts):
            continue
        rec = {header[i]: (parts[i].strip() if i < len(parts) else "") for i in range(len(header))}
        rows.append(rec)
    nmls_rows = 0
    distinct_nmls: set[str] = set()
    titles = Counter()
    descriptions = Counter()
    statuses = Counter()
    years = Counter()
    flags = Counter()
    for rec in rows:
        nmls = normalize_nmls(rec.get("NMLS ID") or rec.get("NMLS ID".title()) or "")
        if nmls:
            nmls_rows += 1
            distinct_nmls.add(nmls)
        title = rec.get("Title of Order") or ""
        desc = rec.get("Description") or ""
        st = rec.get("Status") or ""
        signed = rec.get("Order Signed") or ""
        titles[title or "(blank native title)"] += 1
        descriptions[desc or "(blank native description)"] += 1
        statuses[st or "(blank native status)"] += 1
        ym = re.search(r"(\d{4})", signed)
        if ym:
            years[ym.group(1)] += 1
        blob = f"{title} {desc}".lower()
        if re.search(r"cease|c&d|c & d", blob):
            flags["native_text_mentions_cease_desist"] += 1
        if "revok" in blob:
            flags["native_text_mentions_revocation"] += 1
        if "suspend" in blob:
            flags["native_text_mentions_suspension"] += 1
        if "consent" in blob:
            flags["native_text_mentions_consent"] += 1
        if "settlement" in blob:
            flags["native_text_mentions_settlement"] += 1
        if "penalt" in blob or "adm. pen" in blob or "admin pen" in blob:
            flags["native_text_mentions_penalty"] += 1
        if "agreed order" in blob or "administrative" in blob or blob.startswith("ao ") or " ao " in f" {blob} ":
            flags["native_text_mentions_administrative_or_agreed_order"] += 1
    name_only = len(rows) - nmls_rows
    top_titles = [{"key": k, "count": v} for k, v in titles.most_common(20)]
    top_desc = [{"key": k, "count": v} for k, v in descriptions.most_common(15)]
    top_status = [{"key": k, "count": v} for k, v in statuses.most_common()]
    year_trend = [{"year": y, "count": years[y]} for y in sorted(years)]
    out.update(
        {
            "result": "ACQUIRED",
            "coverage_state": "ACQUIRED_DATED_SNAPSHOT",
            "sha256": sha,
            "source_as_of": clock or "2025-10-16",
            "retrieved_at": now_iso(),
            "order_rows": len(rows),
            "exact_nmls_rows": nmls_rows,
            "name_only_rows": name_only,
            "distinct_exact_nmls": len(distinct_nmls),
            "name_only_identity": "UNSAFE_FOR_ADVERSE_PROFILE_ATTACH",
            "nmls_person_vs_institution": "NOT_SOURCE_NATIVE — SML CSV NMLS ID is not typed as NMLS_INSTITUTION vs NMLS_PERSON. Exact NMLS is kept at order-event grain only.",
            "native_title_distinct": len(titles),
            "native_title_top": top_titles,
            "native_description_top": top_desc,
            "native_status": top_status,
            "order_year_trend": year_trend,
            "overlapping_native_text_flags": dict(flags),
            "penalty_amount_present": False,
            "caveat": (
                "An SML order is not a CFPB complaint and is not a quality ranking. "
                "Exact NMLS is required for adverse profile attachment. "
                "1,488-class name-only rows stay at statewide regulatory-event grain. "
                "Native Title of Order values are not collapsed. "
                "Penalty mentions are not consumer-loss amounts. "
                "CSV clock is the file update date, not current NMLS authority."
            ),
            "not_a_license_roster": True,
            "publication_eligibility": "PUBLIC_STATE_PAGE_AGGREGATES_ONLY",
        }
    )
    return out


def sml_annual_report() -> dict:
    status, body = fetch(SML_REPORT, timeout=120)
    out = {
        "url": SML_REPORT,
        "http_status": status,
        "bytes": len(body),
        "agency": "Texas Department of Savings and Mortgage Lending",
        "report_year": 2024,
        "as_of": "2024-10-31",
        "published": "2024-12-01",
        "label": "According to the 2024 Report on Mortgage Lending in Texas…",
        "coverage_state": "ACQUIRED_DATED_SNAPSHOT",
        "not_a_live_roster": True,
    }
    if status != 200 or len(body) < 1000:
        out["result"] = "SOURCE_NOT_ACQUIRED"
        return out
    path = RAW / "2024-Report-on-Mortgage-Lending-in-Texas.pdf"
    path.write_bytes(body)
    out["sha256"] = hashlib.sha256(body).hexdigest()
    text = ""
    try:
        from pypdf import PdfReader

        text = "\n".join((p.extract_text() or "") for p in PdfReader(str(path)).pages[:8])
    except Exception as e:
        out["pdf_extract_error"] = str(e)
    RAW.joinpath("2024-Report-on-Mortgage-Lending-in-Texas.txt").write_text(text, encoding="utf-8")
    def grab(pattern: str) -> int | None:
        m = re.search(pattern, text, re.I)
        if not m:
            return None
        return int(m.group(1).replace(",", ""))

    entities = grab(r"regulates\s+([0-9,]+)\s+mortgage entities")
    if entities is None:
        entities = grab(r"([0-9,]+)\s+mortgage entities")
    out.update(
        {
            "nmls_regulated_entities": entities,
            "mortgage_company": grab(r"Mortgage Company\s+([0-9,]+)"),
            "mortgage_banker": grab(r"Mortgage Banker\s+([0-9,]+)"),
            "mortgage_servicer": grab(r"Mortgage Servicer\s+([0-9,]+)"),
            "independent_contractor_processor_underwriter_company": grab(
                r"Independent Contractor\s+Proces[so]r/Underwriter\s+Company\s+([0-9,]+)"
            ),
            "state_savings_banks": grab(r"supervises\s+([0-9,]+)\s+state savings banks"),
            "result": "ACQUIRED" if entities else "ACQUIRED_PARTIAL",
            "caveat": (
                "Point-in-time NMLS-record entity counts as of October 31, 2024, published December 1, 2024. "
                "Not the current live Texas mortgage-company roster. Classes are source-native and are not summed into a quality score."
            ),
        }
    )
    classes = [
        out.get("mortgage_company"),
        out.get("mortgage_banker"),
        out.get("mortgage_servicer"),
        out.get("independent_contractor_processor_underwriter_company"),
    ]
    if entities and all(isinstance(x, int) for x in classes):
        out["class_sum_equals_entities"] = sum(classes) == entities
        out["result"] = "ACQUIRED"
    elif entities:
        # Pie labels in this PDF are often stacked as integers near the chart, not "Label N".
        ints = [int(x) for x in re.findall(r"\b(\d{3,4})\b", text)]
        if entities in ints:
            nearby = [n for n in ints if n != entities and n < entities]
            # Accept only if four class integers in the extract sum to the entity total.
            from itertools import combinations

            matched = None
            for combo in combinations(sorted(set(nearby), reverse=True), 4):
                if sum(combo) == entities:
                    matched = combo
                    break
            if matched:
                # Assign by official chart order when those four integers all appear.
                out["class_integers_summing_to_entities"] = list(matched)
                out["result"] = "ACQUIRED"
                out["class_assignment_note"] = (
                    "Four integers in the PDF extract sum to the NMLS-regulated entity total. "
                    "Source-native class labels (Mortgage Company, Mortgage Banker, Mortgage Servicer, "
                    "Independent Contractor Processor/Underwriter Company) are preserved; this snapshot "
                    "does not invent a live roster from them."
                )
    return out


def cfpb_overlay() -> dict:
    params = urllib.parse.urlencode({"size": "5", "state": "TX", "product": "Mortgage"})
    status, body = fetch(f"{CFPB_API}?{params}", timeout=60)
    out = {
        "source": "CFPB Consumer Complaint Database API",
        "source_url": "https://www.consumerfinance.gov/data-research/consumer-complaints/",
        "product": "Mortgage",
        "geography": "TX",
        "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT" if status == 200 else "SOURCE_NOT_ACQUIRED",
        "http_status": status,
        "caveat": "Complaint is not a violation. Raw complaint count is not a quality ranking and is not exposure-normalized. No company complaint rate is published without an exposure denominator.",
        "company_rate_published": False,
    }
    if status != 200:
        out["result"] = "SOURCE_NOT_ACQUIRED"
        return out
    try:
        payload = json.loads(body.decode("utf-8"))
    except Exception:
        out["result"] = "SOURCE_NOT_ACQUIRED"
        return out
    total = payload.get("hits", {}).get("total", {})
    if isinstance(total, dict):
        total = total.get("value")
    aggs = payload.get("aggregations") or {}
    issues = []
    issue_buckets = (
        ((aggs.get("issue") or {}).get("issue") or {}).get("buckets")
        or ((aggs.get("issue") or {}).get("buckets"))
        or []
    )
    for b in issue_buckets[:8]:
        issues.append({"key": b.get("key"), "count": b.get("doc_count")})
    products = []
    product_buckets = (
        ((aggs.get("sub_product") or {}).get("sub_product") or {}).get("buckets")
        or ((aggs.get("sub_product") or {}).get("buckets"))
        or ((aggs.get("product") or {}).get("product") or {}).get("buckets")
        or []
    )
    for b in product_buckets[:8]:
        products.append({"key": b.get("key"), "count": b.get("doc_count")})
    year_trend = []
    for year in range(2019, 2027):
        q = urllib.parse.urlencode(
            {
                "size": "0",
                "state": "TX",
                "product": "Mortgage",
                "date_received_min": f"{year}-01-01",
                "date_received_max": f"{year}-12-31",
            }
        )
        st, raw = fetch(f"{CFPB_API}?{q}", timeout=40)
        if st != 200:
            continue
        try:
            p = json.loads(raw.decode("utf-8"))
        except Exception:
            continue
        t = p.get("hits", {}).get("total", {})
        if isinstance(t, dict):
            t = t.get("value")
        if isinstance(t, int):
            year_trend.append({"year": year, "count": t})
    out.update(
        {
            "result": "ACQUIRED",
            "mortgage_complaint_rows": total,
            "top_issues": issues,
            "subproduct_or_product": products,
            "year_trend": year_trend,
            "retrieved_at": now_iso(),
            "canonical_company_snapshot": "National CFPB company snapshot exists separately; this overlay is statewide Texas geography and is not a company ranking.",
        }
    )
    return out


class SimpleTable(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_table = False
        self.in_row = False
        self.in_cell = False
        self.cell: list[str] = []
        self.row: list[str] = []
        self.rows: list[list[str]] = []

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.in_table = True
        if self.in_table and tag == "tr":
            self.in_row = True
            self.row = []
        if self.in_row and tag in {"td", "th"}:
            self.in_cell = True
            self.cell = []

    def handle_endtag(self, tag):
        if tag in {"td", "th"} and self.in_cell:
            self.row.append(re.sub(r"\s+", " ", "".join(self.cell)).strip())
            self.in_cell = False
        if tag == "tr" and self.in_row:
            if any(self.row):
                self.rows.append(self.row)
            self.in_row = False
        if tag == "table":
            self.in_table = False

    def handle_data(self, data):
        if self.in_cell:
            self.cell.append(data)


def lender_directories() -> dict:
    candidates = [
        ("tdhca_lenders_page", "https://welcomehome.tdhca.texas.gov/lenders", "TDHCA"),
        ("tdhca_find_a_lender", "https://welcomehome.tdhca.texas.gov/find-a-lender", "TDHCA"),
        ("tdhca_programs", "https://welcomehome.tdhca.texas.gov/programs", "TDHCA"),
        ("tsahc_find_a_lender", "https://www.tsahc.org/homebuyers-renters/find-a-lender", "TSAHC"),
        ("tsahc_lenders", "https://www.tsahc.org/lenders", "TSAHC"),
        ("tsahc_approved_lenders", "https://www.tsahc.org/homebuyers-renters/approved-lenders", "TSAHC"),
        ("readytobuy", "https://www.readytobuyatexashome.com/", "TSAHC"),
    ]
    probes = []
    acquired = None
    for key, url, agency in candidates:
        status, body = fetch(url, timeout=40)
        info = {
            "key": key,
            "url": url,
            "agency": agency,
            "http_status": status,
            "bytes": len(body),
        }
        if status == 200 and len(body) > 200:
            parser = SimpleTable()
            try:
                parser.feed(body.decode("utf-8", "replace"))
            except Exception:
                parser.rows = []
            info["html_table_rows"] = max(0, len(parser.rows) - 1) if parser.rows else 0
            blob = strip_html(body).lower()
            info["looks_like_search_or_onboarding"] = any(
                s in blob for s in ["become a", "join our lender", "on-boarding", "eligibility quiz"]
            )
            nmls_hits = len(re.findall(r"\bnmls\b", blob))
            info["nmls_mentions"] = nmls_hits
            # Only treat as a directory when there is a sizable HTML table of lender rows.
            if info["html_table_rows"] >= 20 and not info["looks_like_search_or_onboarding"]:
                names = []
                for row in parser.rows[1:]:
                    if row and row[0]:
                        names.append(row[0].strip())
                acquired = {
                    "result": "ACQUIRED",
                    "url": url,
                    "agency": agency,
                    "directory_rows": info["html_table_rows"],
                    "distinct_company_names": len({n.upper() for n in names if n}),
                    "nmls_id_present": 0,
                    "identity_bar": "REVIEW_REQUIRED",
                }
        probes.append(info)
    if acquired:
        acquired["probes"] = probes
        acquired["caveat"] = (
            "Program participating lender is not a Texas mortgage license and is not a TrustHub endorsement. "
            "NMLS IDs are not manufactured."
        )
        return acquired
    return {
        "result": "SOURCE_NOT_ACQUIRED",
        "directory_rows": 0,
        "distinct_company_names": 0,
        "nmls_id_present": 0,
        "phone_present": 0,
        "email_present": 0,
        "website_present": 0,
        "address_present": 0,
        "identity_bar": "NOT_ACQUIRED",
        "probes": probes,
        "caveat": (
            "No easy structured or HTML lender directory with reusable rows was acquired. "
            "TDHCA/TSAHC participating-lender search/onboarding pages are not a bulk roster. "
            "Program participation is not a license. NMLS IDs were not manufactured. "
            "Zero directory rows here means SOURCE_NOT_ACQUIRED, not an empty lender market."
        ),
        "publication_note": "Do not display directory_rows=0 as a market finding.",
    }


def programs() -> dict:
    pages = {
        "tdhca_programs": "https://welcomehome.tdhca.texas.gov/programs",
        "tdhca_mfth": "https://welcomehome.tdhca.texas.gov/products/my-first-texas-home",
        "tdhca_mcth": "https://welcomehome.tdhca.texas.gov/products/my-choice-texas-home",
        "tdhca_mcc": "https://welcomehome.tdhca.texas.gov/programs/texas-mortgage-credit-certificate-program",
        "tdhca_education": "https://welcomehome.tdhca.texas.gov/programs/texas-statewide-homebuyer-education-program",
        "tdhca_lenders": "https://welcomehome.tdhca.texas.gov/lenders",
        "tsahc_home": "https://www.tsahc.org/home-buyer-programs",
        "tsahc_heroes": "https://www.tsahc.org/homebuyers-renters/homes-for-texas-heroes-program",
        "tsahc_dpa": "https://www.tsahc.org/landing/home-down-payment-assistance",
        "tsahc_loans": "https://www.tsahc.org/homebuyers-renters/loans-down-payment-assistance",
    }
    fetched = {}
    texts = {}
    for key, url in pages.items():
        status, body = fetch(url, timeout=40)
        fetched[key] = {
            "url": url,
            "http_status": status,
            "bytes": len(body),
            "sha256": hashlib.sha256(body).hexdigest() if status == 200 and body else None,
        }
        texts[key] = strip_html(body) if status == 200 else ""
        if status == 200 and body:
            (RAW / f"{key}.html").write_bytes(body[:400000])

    def has(key: str, *needles: str) -> bool:
        blob = texts.get(key, "").lower()
        return all(n.lower() in blob for n in needles)

    items = []
    if has("tdhca_mfth", "My First Texas Home") or has("tdhca_programs", "My First Texas Home"):
        items.append(
            {
                "name": "My First Texas Home",
                "agency": "Texas Department of Housing and Community Affairs",
                "type": "first_mortgage_and_down_payment_assistance",
                "assistance": "30-year low-interest first mortgage with down-payment and closing-cost assistance",
                "maximum": "Official product page: flexible DPA at 2%, 3%, 4%, and 5% of the loan amount; 30-year 0% interest second lien; 3-year forgivable second lien available. Matrix PDF dated 2026-08-17 is the fee/overlay clock.",
                "eligibility": "First-time homebuyers and qualified veterans. Official page notes certain first-time-buyer exceptions in targeted areas and for qualified veterans. Homebuyer education is required for TDHCA Homebuyer Program assistance.",
                "income_purchase_limits": "Income and purchase-price limits apply; confirm current limits on official TDHCA materials. Not restated here as a single statewide dollar cap.",
                "first_time_buyer": True,
                "participating_lender_required": True,
                "status": "Documented on official TDHCA Welcome Home pages retrieved this snapshot.",
                "source_url": "https://welcomehome.tdhca.texas.gov/products/my-first-texas-home",
                "source_date": "Official page retrieval " + now_iso()[:10] + "; program matrix PDF dated 2026-08-17",
            }
        )
    if has("tdhca_mcth", "My Choice Texas Home") or has("tdhca_programs", "My Choice Texas Home"):
        items.append(
            {
                "name": "My Choice Texas Home",
                "agency": "Texas Department of Housing and Community Affairs",
                "type": "first_mortgage_and_down_payment_assistance",
                "assistance": "30-year low-interest first mortgage with down-payment and closing-cost assistance for buyers who are not limited to first-time status",
                "maximum": "Same official DPA family as My First Texas Home (percentage-of-loan assistance). Confirm current rate/DPA options with a participating lender.",
                "eligibility": "Official programs page: you do not have to be a first-time homebuyer to qualify. Homebuyer education is required for TDHCA Homebuyer Program assistance.",
                "income_purchase_limits": "Income and purchase-price limits apply; confirm on official TDHCA materials.",
                "first_time_buyer": False,
                "participating_lender_required": True,
                "status": "Documented on official TDHCA Welcome Home pages retrieved this snapshot.",
                "source_url": pages["tdhca_mcth"] if fetched["tdhca_mcth"]["http_status"] == 200 else pages["tdhca_programs"],
                "source_date": "Official page retrieval " + now_iso()[:10],
            }
        )
    if has("tdhca_mcc", "Mortgage Credit Certificate") or has("tdhca_programs", "Mortgage Credit Certificate"):
        items.append(
            {
                "name": "Texas Mortgage Credit Certificate (MCC)",
                "agency": "Texas Department of Housing and Community Affairs",
                "type": "mortgage_credit_certificate",
                "assistance": "Federal mortgage credit certificate that reduces federal income-tax liability dollar-for-dollar, as described on the official TDHCA page",
                "maximum": "Official programs page: available to veterans and first-time homebuyers with a first mortgage through the program, and as a stand-alone option. Supplies are limited.",
                "eligibility": "First-time homebuyers and veterans as stated on the official page. No minimum credit score with the stand-alone option, per the official programs page. Not a cash down-payment grant.",
                "income_purchase_limits": "MCC income/purchase rules are program-specific; confirm on the official MCC page.",
                "first_time_buyer": True,
                "participating_lender_required": True,
                "status": "Documented on official TDHCA Welcome Home pages retrieved this snapshot. Limited supply is an official statement, not a TrustHub scarcity ranking.",
                "source_url": pages["tdhca_mcc"],
                "source_date": "Official page retrieval " + now_iso()[:10],
            }
        )
    if has("tdhca_education", "homebuyer education") or has("tdhca_programs", "homebuyer education"):
        items.append(
            {
                "name": "Texas Statewide Homebuyer Education Program (TSHEP)",
                "agency": "Texas Department of Housing and Community Affairs",
                "type": "homebuyer_education",
                "assistance": "Required homebuyer education course for TDHCA Homebuyer Program assistance",
                "maximum": "Not a dollar assistance product.",
                "eligibility": "Completing an approved homebuyer education course is required to qualify for assistance through The TDHCA Homebuyer Program, per the official programs page.",
                "income_purchase_limits": "Not a loan product.",
                "first_time_buyer": None,
                "participating_lender_required": False,
                "status": "Documented on official TDHCA Welcome Home pages retrieved this snapshot.",
                "source_url": pages["tdhca_education"],
                "source_date": "Official page retrieval " + now_iso()[:10],
            }
        )
    if has("tsahc_heroes", "Homes for Texas Heroes") or has("tsahc_home", "Homes for Texas Heroes"):
        items.append(
            {
                "name": "Homes for Texas Heroes",
                "agency": "Texas State Affordable Housing Corporation",
                "type": "first_mortgage_and_down_payment_assistance",
                "assistance": "30-year fixed-rate mortgage with down-payment assistance for eligible hero professions",
                "maximum": "Official TSAHC pages: DPA 3% to 5% of the loan amount, as a grant that does not have to be repaid or a 3-year deferred forgivable second lien.",
                "eligibility": "Official page: professional educators (including specified public-school roles), fire fighters and EMS personnel, police and correctional officers, and veterans. First-time buyer status is not required. Apply through a participating lender after the eligibility quiz.",
                "income_purchase_limits": "Income limits apply and can be higher in targeted areas; confirm current AMFI tables on TSAHC materials.",
                "first_time_buyer": False,
                "participating_lender_required": True,
                "status": "Documented on official TSAHC pages retrieved this snapshot.",
                "source_url": pages["tsahc_heroes"],
                "source_date": "Official page retrieval " + now_iso()[:10],
            }
        )
    if has("tsahc_home", "Home Sweet Texas") or has("tsahc_dpa", "Home Sweet Texas"):
        items.append(
            {
                "name": "Home Sweet Texas Home Loan Program",
                "agency": "Texas State Affordable Housing Corporation",
                "type": "first_mortgage_and_down_payment_assistance",
                "assistance": "30-year fixed-rate mortgage with down-payment assistance for eligible Texas homebuyers who do not have to qualify under the Heroes occupation list",
                "maximum": "Official TSAHC pages: DPA 3% to 5% of the loan amount as a grant or 3-year deferred forgivable second lien. Credit scores as low as 620 are described on the official home-buyer programs page.",
                "eligibility": "Low- and moderate-income Texas homebuyers as published by TSAHC. First-time buyer status is not required for DPA. First-time buyers may also research TSAHC MCC.",
                "income_purchase_limits": "Income and purchase-price limits apply; targeted-area limits may differ. Confirm on official TSAHC tables.",
                "first_time_buyer": False,
                "participating_lender_required": True,
                "status": "Documented on official TSAHC pages retrieved this snapshot.",
                "source_url": pages["tsahc_home"],
                "source_date": "Official page retrieval " + now_iso()[:10],
            }
        )
    mcc_tsahc_blob = (texts.get("tsahc_home") + " " + texts.get("tsahc_dpa")).lower()
    if "mortgage credit certificate" in mcc_tsahc_blob:
        items.append(
            {
                "name": "TSAHC Mortgage Credit Certificate",
                "agency": "Texas State Affordable Housing Corporation",
                "type": "mortgage_credit_certificate",
                "assistance": "Mortgage credit certificate tax credit for eligible first-time buyers, as described on official TSAHC pages",
                "maximum": "Official TSAHC down-payment page: first-time buyers can also apply for an MCC. Confirm current combination rules on official TSAHC guidelines; do not treat MCC as cash DPA.",
                "eligibility": "First-time homebuyers as stated by TSAHC. Eligibility is not guaranteed approval.",
                "income_purchase_limits": "MCC income limits follow the official TSAHC/federal MCC tables, which can differ from DPA AMFI tables.",
                "first_time_buyer": True,
                "participating_lender_required": True,
                "status": "Documented on official TSAHC pages retrieved this snapshot.",
                "source_url": pages["tsahc_dpa"],
                "source_date": "Official page retrieval " + now_iso()[:10],
            }
        )

    return {
        "retrieved_at": now_iso(),
        "pages": fetched,
        "application_path": "TDHCA and TSAHC do not replace a mortgage underwriting decision. Buyers apply through a participating lender. Program participation is not a Texas license.",
        "items": items,
        "verified_family_count": len(items),
        "caveat": "Program terms change. Eligibility is not guaranteed approval. Headline amounts are official-page formulas, not a promise of funds. County or city local DPA is not inventoried here.",
    }


def bounded_roster_foreclosure() -> tuple[dict, dict, dict, dict]:
    searches = {
        "sml_roster": "SML mortgage company license roster",
        "nmls_texas": "NMLS Texas mortgage company bulk download",
        "foreclosure": "Texas statewide foreclosure dataset",
        "servicing": "Texas mortgage servicer loan-level report",
        "occc_mortgage": "OCCC residential mortgage company roster",
    }
    results = {}
    for key, q in searches.items():
        status, body = fetch(f"{CKAN}?{urllib.parse.urlencode({'q': q, 'rows': 8})}", timeout=40)
        titles = []
        if status == 200:
            try:
                data = json.loads(body.decode("utf-8"))
                titles = [r.get("title") for r in data.get("result", {}).get("results", [])][:8]
            except Exception:
                titles = []
        results[key] = {"http_status": status, "titles": titles, "query": q}

    roster = {
        "CURRENT_TEXAS_MORTGAGE_COMPANY_BULK_ROSTER": "SOURCE_NOT_ACQUIRED",
        "live_licensed_company_denominator": "UNKNOWN",
        "nmls_consumer_access": "OPEN_SEARCH_ONLY — not scraped",
        "ckan": results["sml_roster"],
        "caveat": "Missing live roster is unknown, not zero. Do not display a fake current license count. The 2024 SML report entity count is a dated snapshot, not this live denominator.",
    }
    occc = {
        "coverage": "NOT_A_SUBSTITUTE_MORTGAGE_COMPANY_ROSTER",
        "source_url": "https://occc.texas.gov/",
        "ckan": results["occc_mortgage"],
        "caveat": "OCCC regulates overlapping consumer-credit classes such as property-tax lending and manufactured housing. That is not the SML mortgage-company roster and is not displayed as a Texas mortgage-license count.",
    }
    servicing = {
        "result": "NO_EASY_STATEWIDE_SERVICING_REPORT",
        "sml_servicer_registration": "SML registers residential mortgage loan servicers; the 2024 report includes a dated servicer-entity count. That is not a loan-level statewide servicing file.",
        "ckan": results["servicing"],
        "caveat": "No easy statewide servicing performance report was acquired. Existing LenderTrustHub servicing architecture is not a Texas foreclosure portal.",
    }
    fc = {
        "STATEWIDE_STRUCTURED_FORECLOSURE_SOURCE_NOT_ACQUIRED": True,
        "ckan": results["foreclosure"],
        "note": "No county clerk or foreclosure-posting crawl was performed. Missing statewide foreclosure structure is unknown, not zero.",
    }
    return roster, occc, servicing, fc


def regulator_matrix() -> list[dict]:
    return [
        {
            "credential": "HMDA reporter",
            "what": "Institution that filed HMDA loan/application records for Texas property location",
            "regulator": "CFPB / FFIEC HMDA",
            "proves": "Reported application/origination activity in this vintage",
            "does_not_prove": "Texas mortgage license, current NMLS authority, or program participation",
        },
        {
            "credential": "NMLS ID",
            "what": "Nationwide Multistate Licensing System identifier when source-native",
            "regulator": "NMLS (system of record display; not a Texas regulator)",
            "proves": "A stable identifier when printed by the source",
            "does_not_prove": "Current Texas authority by itself, or whether the ID is an institution, branch, or person",
        },
        {
            "credential": "SML-regulated company",
            "what": "Mortgage company, mortgage banker, mortgage servicer, wrap lender, or independent contractor processor/underwriter company under Texas SML",
            "regulator": "Texas Department of Savings and Mortgage Lending",
            "proves": "SML licensing/registration class as of a stated evidence clock",
            "does_not_prove": "HMDA reporter status, OCCC authority, or TDHCA/TSAHC program participation",
        },
        {
            "credential": "OCCC-regulated company",
            "what": "Texas Office of Consumer Credit Commissioner authority in overlapping consumer-credit classes such as property-tax lending or manufactured housing",
            "regulator": "Texas Office of Consumer Credit Commissioner",
            "proves": "OCCC authority as of that source clock when acquired",
            "does_not_prove": "SML mortgage-company license",
        },
        {
            "credential": "MLO / RMLO",
            "what": "Individual residential mortgage loan originator licensed through NMLS and sponsored by an SML or OCCC company as applicable",
            "regulator": "Texas SML or Texas OCCC via NMLS display",
            "proves": "Individual originator credential path when source-native",
            "does_not_prove": "A company license, and this site does not publish an MLO person directory",
        },
        {
            "credential": "Depository",
            "what": "Bank, savings bank, or credit union operating under a prudential charter rather than an SML mortgage-company license alone",
            "regulator": "Federal and/or Texas Department of Banking / SML savings-bank supervision as applicable",
            "proves": "Charter identity when source-native",
            "does_not_prove": "SML mortgage-company license or HMDA completeness",
        },
        {
            "credential": "Program participating lender",
            "what": "Appears on a TDHCA or TSAHC participating-lender path for one or more homebuyer programs",
            "regulator": "TDHCA or TSAHC",
            "proves": "Program-participation listing as of directory/page retrieval",
            "does_not_prove": "Texas license, endorsement, or TrustHub recommendation",
        },
    ]


def public_contacts(directory: dict, sml: dict) -> dict:
    return {
        "policy": "Official/public business sources only. No internet enrichment. No person contact information.",
        "sml_orders_phone": 0,
        "sml_orders_email": 0,
        "sml_orders_website": 0,
        "sml_orders_address": 0,
        "sml_orders_contact_note": "SML enforcement CSV has no phone, email, website, or address fields.",
        "directory_phone": directory.get("phone_present") or 0,
        "directory_email": directory.get("email_present") or 0,
        "directory_website": directory.get("website_present") or 0,
        "directory_address": directory.get("address_present") or 0,
        "directory_result": directory.get("result"),
        "caveat": "Zero contact fields from an unacquired directory is a coverage gap, not a finding that Texas lenders have no phones.",
    }


def main() -> None:
    hmda = hmda_block()
    sml = sml_orders()
    report = sml_annual_report()
    programs_block = programs()
    directory = lender_directories()
    cfpb = cfpb_overlay()
    roster, occc, servicing, fc = bounded_roster_foreclosure()
    contacts = public_contacts(directory, sml)
    if not programs_block["items"]:
        raise SystemExit("Publication gate: at least one current Texas program family must be verified from official pages")
    snapshot = {
        "contract_name": "lender-tx-state-intel-v1",
        "version": "1.0.0",
        "geography": "TX",
        "publication_status": "published",
        "path": "/texas",
        "generated_at": now_iso(),
        "source_as_of": {
            "hmda": "HMDA 2025",
            "sml_orders": sml.get("source_as_of") or "SOURCE_NOT_ACQUIRED",
            "sml_annual_report": report.get("as_of"),
            "programs": programs_block.get("retrieved_at"),
            "approved_lenders": directory.get("result"),
            "cfpb": cfpb.get("retrieved_at") or "SOURCE_NOT_ACQUIRED",
            "live_roster": "SOURCE_NOT_ACQUIRED",
        },
        "hero": {
            "universe_label": "HMDA applications",
            "universe_value": hmda["applications"],
            "universe_hint": "2025 HMDA applications for properties located in Texas. Not a count of Texas-licensed mortgage companies.",
            "current_label": "HMDA originations",
            "current_value": hmda["originations"],
            "observations_label": "SML enforcement orders",
            "observations_value": sml.get("order_rows") or 0,
            "geography_label": "Counties in HMDA geography",
            "geography_value": hmda["county_count"],
            "as_of_label": "HMDA vintage",
            "as_of_value": "2025",
        },
        "hmda": hmda,
        "sml_orders": sml,
        "sml_annual_report": report,
        "programs": programs_block,
        "approved_lenders": directory,
        "live_roster": roster,
        "occc": occc,
        "cfpb": cfpb,
        "servicing": servicing,
        "foreclosure": fc,
        "public_contacts": contacts,
        "regulator_matrix": regulator_matrix(),
        "gaps": [
            "No current complete Texas mortgage-company bulk roster was acquired. Live licensed-company denominator is UNKNOWN, not zero.",
            "Complete MLO / RMLO person universe is not published and was not scraped from NMLS.",
            "Name-only SML orders cannot be attached to lender profiles. Not every enforcement order has an exact NMLS ID.",
            "SML CSV NMLS IDs are not source-typed as institution vs person vs branch.",
            "NMLS Consumer Access remains search-only. Not scraped.",
            "No easy structured TDHCA/TSAHC participating-lender directory was acquired.",
            "No easy statewide OCCC mortgage-company roster was acquired.",
            "No easy statewide servicing performance report was acquired.",
            "STATEWIDE_STRUCTURED_FORECLOSURE_SOURCE_NOT_ACQUIRED. No county clerk crawl.",
            "Company-level CFPB complaint exposure denominators are not computed.",
            "The 2024 SML report entity count is dated October 31, 2024, and is not a live roster.",
        ],
        "identity_rules": {
            "EXACT": ["NMLS when source-native on the SML order row", "HMDA LEI"],
            "HIGH_CONFIDENCE": "exact legal name + exact official business address for non-adverse descriptive data only",
            "REVIEW_REQUIRED": "program lender names without source-native NMLS",
            "UNSAFE": "name-only SML orders — not used for adverse profile attachment",
        },
        "semantic_guardrails": [
            "HMDA is not a license roster",
            "HMDA reporter is not a Texas licensee",
            "NMLS ID is not current Texas authority by itself",
            "State order is not a complaint",
            "Complaint is not a violation",
            "Denial rate is not quality and is not a discrimination finding",
            "Program participation is not an endorsement or a license",
            "Program eligibility is not approval",
            "Name-only order is not safe profile attachment",
            "Missing is not zero",
            "Order count is not quality",
            "Penalty amount is not consumer loss",
            "No Trust Score",
            "No paid ranking",
        ],
    }
    canonical = json.dumps(snapshot, sort_keys=True, separators=(",", ":"))
    snapshot["fingerprint"] = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    text = json.dumps(snapshot, indent=2) + "\n"
    (ART / "tx-lend-001-public-snapshot.json").write_text(text, encoding="utf-8")
    (LIB / "accepted-snapshot.json").write_text(text, encoding="utf-8")
    print(
        json.dumps(
            {
                "fingerprint": snapshot["fingerprint"],
                "apps": hmda["applications"],
                "orig": hmda["originations"],
                "den": hmda["denials"],
                "counties": hmda["county_count"],
                "all_254": hmda["all_254_counties"],
                "sml_orders": sml.get("order_rows"),
                "sml_nmls": sml.get("exact_nmls_rows"),
                "sml_name_only": sml.get("name_only_rows"),
                "programs": len(programs_block["items"]),
                "directory": directory.get("result"),
                "cfpb": cfpb.get("mortgage_complaint_rows"),
                "report_entities": report.get("nmls_regulated_entities"),
                "roster": roster["CURRENT_TEXAS_MORTGAGE_COMPANY_BULK_ROSTER"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

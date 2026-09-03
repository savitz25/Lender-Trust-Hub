"""CA-LEND-001 — California mortgage state snapshot from official bulk/easy sources.

Allowed: committed HMDA slices, CalHFA HTML directory, official PDFs/pages, CFPB API, CKAN.
Forbidden: NMLS Cloudflare bypass, DOCQNET scrape, county routes, MLO person harvest.
"""
from __future__ import annotations

import csv
import hashlib
import html
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

UA = "LenderTrustHub-CA-LEND-001/1.0 (+https://www.lendertrusthub.com; official bulk research)"
CTX = ssl.create_default_context()
ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "california"
ART = ROOT / "artifacts"
LIB = ROOT / "lib" / "california-intelligence"
RAW.mkdir(parents=True, exist_ok=True)
ART.mkdir(parents=True, exist_ok=True)
LIB.mkdir(parents=True, exist_ok=True)

HMDA_COUNTY = ROOT / "data" / "hmda" / "by-state" / "CA" / "county_market_summary.csv"
HMDA_LENDER = ROOT / "data" / "hmda" / "by-state" / "CA" / "lender_state_summary.csv"
HMDA_MAP = ROOT / "data" / "hmda" / "california" / "lei_to_nmls_mapping.csv"
CA_COUNTY_NAMES = {
    "06001": "Alameda", "06003": "Alpine", "06005": "Amador", "06007": "Butte",
    "06009": "Calaveras", "06011": "Colusa", "06013": "Contra Costa", "06015": "Del Norte",
    "06017": "El Dorado", "06019": "Fresno", "06021": "Glenn", "06023": "Humboldt",
    "06025": "Imperial", "06027": "Inyo", "06029": "Kern", "06031": "Kings",
    "06033": "Lake", "06035": "Lassen", "06037": "Los Angeles", "06039": "Madera",
    "06041": "Marin", "06043": "Mariposa", "06045": "Mendocino", "06047": "Merced",
    "06049": "Modoc", "06051": "Mono", "06053": "Monterey", "06055": "Napa",
    "06057": "Nevada", "06059": "Orange", "06061": "Placer", "06063": "Plumas",
    "06065": "Riverside", "06067": "Sacramento", "06069": "San Benito",
    "06071": "San Bernardino", "06073": "San Diego", "06075": "San Francisco",
    "06077": "San Joaquin", "06079": "San Luis Obispo", "06081": "San Mateo",
    "06083": "Santa Barbara", "06085": "Santa Clara", "06087": "Santa Cruz",
    "06089": "Shasta", "06091": "Sierra", "06093": "Siskiyou", "06095": "Solano",
    "06097": "Sonoma", "06099": "Stanislaus", "06101": "Sutter", "06103": "Tehama",
    "06105": "Trinity", "06107": "Tulare", "06109": "Tuolumne", "06111": "Ventura",
    "06113": "Yolo", "06115": "Yuba",
}
CALHFA_DIR = "https://www.calhfa.ca.gov/apps/approvedlenders/"
CRMLA_PDF = "https://dfpi.ca.gov/wp-content/uploads/2025/12/AnnualReport_2024_CRMLA.pdf"
CFPB_API = "https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/"
CKAN = "https://data.ca.gov/api/3/action/package_search"


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


def hmda_block() -> dict:
    rows = list(csv.DictReader(HMDA_COUNTY.open(encoding="utf-8")))
    rows = [r for r in rows if (r.get("state") or "").upper() == "CA"]
    rows.sort(key=lambda r: (r.get("county_name") or "", r.get("county_fips") or ""))
    apps = sum(num(r, "total_applications") for r in rows)
    orig = sum(num(r, "total_originations") for r in rows)
    den = sum(num(r, "denial_count") for r in rows)
    purch = sum(num(r, "purchase_count") for r in rows)
    refi = sum(num(r, "refinance_count") for r in rows)
    conv = sum(num(r, "apps_conventional") for r in rows)
    fha = sum(num(r, "apps_fha") for r in rows)
    va = sum(num(r, "apps_va") for r in rows)
    usda = sum(num(r, "apps_usda_other") for r in rows)
    counties = []
    for r in rows:
        counties.append(
            {
                "county_fips": r["county_fips"],
                "county_name": (r.get("county_name") or "").strip()
                or CA_COUNTY_NAMES.get(r["county_fips"], r["county_fips"]),
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
    maps = {}
    if HMDA_MAP.exists():
        for r in csv.DictReader(HMDA_MAP.open(encoding="utf-8")):
            maps[r["lei"]] = r
    reporters = []
    for r in csv.DictReader(HMDA_LENDER.open(encoding="utf-8")):
        lei = (r.get("lei") or "").strip()
        if not lei:
            continue
        mapped = maps.get(lei)
        reporters.append(
            {
                "lei": lei,
                "applications": num(r, "total_applications"),
                "originations": num(r, "total_originations"),
                "institution_name": (mapped or {}).get("institution_name_hmda") or None,
                "nmls_id": (mapped or {}).get("nmls_id") or None,
                "our_lender_slug": (mapped or {}).get("our_lender_slug") or None,
                "identity": "EXACT_LEI_MAPPED" if mapped else "EXACT_LEI_UNMAPPED",
            }
        )
    reporters.sort(key=lambda x: (-x["applications"], x["lei"]))
    return {
        "year": 2025,
        "geo_grain": "state_and_county",
        "state_code": "CA",
        "source": "Committed HMDA California partition data/hmda/by-state/CA/county_market_summary.csv. Properties located in California. Not a second national download.",
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
        "all_58_counties": len(counties) == 58,
        "counties": counties,
        "lei_reporter_rows": len(reporters),
        "top_reporters_by_applications": reporters[:15],
        "caveat": "HMDA is a mortgage-application filing extract for properties located in California. It is not a California license roster, not a quality ranking, and the denial rate does not prove discrimination.",
        "omitted": {
            "median_loan_amount": "Not present in the committed 2025 CA county summary extract.",
        },
    }


class CalhfaTable(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_table = False
        self.in_row = False
        self.in_cell = False
        self.cell = []
        self.cell_has_check = False
        self.row = []
        self.rows: list[list[tuple[str, bool]]] = []

    def handle_starttag(self, tag, attrs):
        ad = dict(attrs)
        if tag == "table":
            self.in_table = True
        if self.in_table and tag == "tr":
            self.in_row = True
            self.row = []
        if self.in_row and tag in ("td", "th"):
            self.in_cell = True
            self.cell = []
            self.cell_has_check = False
        if self.in_cell and tag == "img":
            alt = (ad.get("alt") or "") + (ad.get("src") or "")
            if "check" in alt.lower() or "participant" in alt.lower():
                self.cell_has_check = True

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.in_cell:
            text = html.unescape(re.sub(r"\s+", " ", "".join(self.cell))).strip()
            self.row.append((text, self.cell_has_check))
            self.in_cell = False
        if tag == "tr" and self.in_row:
            if self.row:
                self.rows.append(self.row)
            self.in_row = False
        if tag == "table":
            self.in_table = False

    def handle_data(self, data):
        if self.in_cell:
            self.cell.append(data)


PHONE_RE = re.compile(r"(\d{3}[.\-]\d{3}[.\-]\d{4})")
CITY_ST_ZIP = re.compile(
    r"^(.*?)\s+([A-Z]{2,}(?:\s+[A-Z]{2,})*),\s*([A-Z]{2})\s+(\d{5})(?:-\d{4})?\s*$"
)


def parse_address(blob: str) -> dict:
    phone_m = PHONE_RE.search(blob)
    phone = phone_m.group(1) if phone_m else None
    rest = blob[: phone_m.start()].strip() if phone_m else blob.strip()
    m = CITY_ST_ZIP.search(rest)
    if m:
        return {
            "street": m.group(1).strip(" ,"),
            "city": m.group(2).title(),
            "state": m.group(3),
            "zip": m.group(4),
            "phone": phone,
        }
    return {"street": rest, "city": None, "state": None, "zip": None, "phone": phone}


def calhfa_directory() -> dict:
    status, body = fetch(CALHFA_DIR, timeout=120)
    info = {"http_status": status, "bytes": len(body), "url": CALHFA_DIR}
    if status != 200 or len(body) < 1000:
        info["result"] = "SOURCE_NOT_ACQUIRED"
        return info
    RAW.joinpath("calhfa-approved-lenders.html").write_bytes(body)
    info["sha256"] = hashlib.sha256(body).hexdigest()
    parser = CalhfaTable()
    parser.feed(body.decode("utf-8", "replace"))
    data_rows = []
    for row in parser.rows:
        if not row or row[0][0].lower().startswith("calhfa-approved"):
            continue
        name = row[0][0]
        addr = row[1][0] if len(row) > 1 else ""
        if not name or name.lower() in {"lender", ""}:
            continue
        parsed = parse_address(addr)
        flags = {
            "calplus_conv": len(row) > 2 and row[2][1],
            "calhfa_conv": len(row) > 3 and row[3][1],
            "calplus_fha": len(row) > 4 and row[4][1],
            "calhfa_fha": len(row) > 5 and row[5][1],
            "calhfa_va": len(row) > 6 and row[6][1],
            "calhfa_usda": len(row) > 7 and row[7][1],
            "myhome": len(row) > 8 and row[8][1],
            "hud_184": len(row) > 9 and row[9][1],
            "dream_for_all": len(row) > 10 and row[10][1],
            "myaccess": len(row) > 11 and row[11][1],
            "limited_203k": len(row) > 12 and row[12][1],
        }
        data_rows.append({"lender_name": name, **parsed, "programs": flags})
    names = Counter(r["lender_name"].strip().upper() for r in data_rows)
    ca_rows = [r for r in data_rows if (r.get("state") or "").upper() == "CA"]
    phones = sum(1 for r in data_rows if r.get("phone"))
    addrs = sum(1 for r in data_rows if r.get("street"))
    cities = {r["city"] for r in data_rows if r.get("city")}
    return {
        **info,
        "result": "ACQUIRED",
        "grain": "CALHFA_APPROVED_LENDER_DIRECTORY_ROW",
        "identity_bar": "REVIEW_REQUIRED",
        "source_as_of": "2026-09-03 retrieval of live official HTML directory",
        "retrieved_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "directory_rows": len(data_rows),
        "distinct_company_names": len(names),
        "california_branch_rows": len(ca_rows),
        "out_of_state_or_unparsed_state_rows": len(data_rows) - len(ca_rows),
        "phone_present": phones,
        "address_present": addrs,
        "unique_city_count": len(cities),
        "email_present": 0,
        "website_present": 0,
        "nmls_id_present": 0,
        "contact_eligibility": "PUBLIC_ELIGIBLE branch phone and address as published by CalHFA. No email or NMLS ID in this directory.",
        "caveat": "CalHFA approved/participating lender is not a California license and is not a TrustHub endorsement. Directory row is not a unique company. No name-only NMLS attachment.",
        "publication_eligibility": "PUBLIC_STATE_PAGE",
    }


def crmla_report() -> dict:
    status, body = fetch(CRMLA_PDF, timeout=120)
    out = {
        "url": CRMLA_PDF,
        "http_status": status,
        "bytes": len(body),
        "agency": "California Department of Financial Protection and Innovation",
        "report_year": 2024,
        "as_of": "2024-12-31",
        "published": "October 2025",
        "label": "According to the 2024 CRMLA annual report…",
        "coverage_state": "ACQUIRED_DATED_SNAPSHOT",
        "not_a_live_roster": True,
    }
    if status != 200 or len(body) < 1000:
        out["result"] = "SOURCE_NOT_ACQUIRED"
        return out
    path = RAW / "crmla-annual-report-2024.pdf"
    path.write_bytes(body)
    out["sha256"] = hashlib.sha256(body).hexdigest()
    from pypdf import PdfReader

    text = "\n".join((p.extract_text() or "") for p in PdfReader(str(path)).pages)
    RAW.joinpath("crmla-annual-report-2024.txt").write_text(text, encoding="utf-8")
    def need(pattern: str) -> str:
        m = re.search(pattern, text, re.I)
        if not m:
            raise SystemExit(f"CRMLA PDF missing pattern {pattern}")
        return m.group(1).replace(",", "")

    out["loans_originated_count"] = int(need(r"([0-9,]+)\s+loans totaling \$105"))
    out["loans_originated_volume_note"] = "$105.2 billion originated (official report headline)"
    out["loans_brokered_count"] = int(need(r"Loans Brokered\s+•\s+([0-9,]+)\s+loans"))
    out["servicing_monthly_average_note"] = "Monthly average of $1.75 trillion serviced"
    out["nontraditional_mortgage_complaints"] = int(need(r"([0-9,]+)\s+complaints on non-traditional"))
    out["foreclosures_completed"] = int(need(r"Foreclosures\s+•\s+([0-9,]+)\s+completed"))
    out["licensees"] = int(need(r"Licensees:\s+([0-9,]+)"))
    out["branches"] = int(need(r"Branches:\s+([0-9,]+)"))
    out["result"] = "ACQUIRED"
    out["caveat"] = (
        "Point-in-time annual-report denominator as of December 31, 2024, published October 2025. "
        "Not the current September 2026 live CRMLA license roster."
    )
    return out


def cfpb_overlay() -> dict:
    params = urllib.parse.urlencode({"size": "5", "state": "CA", "product": "Mortgage"})
    status, body = fetch(f"{CFPB_API}?{params}", timeout=60)
    out = {
        "source": "CFPB Consumer Complaint Database API",
        "source_url": "https://www.consumerfinance.gov/data-research/consumer-complaints/",
        "product": "Mortgage",
        "geography": "CA",
        "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT" if status == 200 else "SOURCE_NOT_ACQUIRED",
        "http_status": status,
        "caveat": "Complaint is not a violation. Raw complaint count is not a quality ranking and is not exposure-normalized.",
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
    for b in issue_buckets[:6]:
        issues.append({"key": b.get("key"), "count": b.get("doc_count")})
    out.update(
        {
            "result": "ACQUIRED",
            "mortgage_complaint_rows": total,
            "top_issues": issues,
            "retrieved_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
    )
    return out


def bounded_roster_and_enforcement() -> tuple[dict, dict, dict, dict]:
    searches = {
        "crmla roster": "CRMLA license roster",
        "dfpi enforcement": "DFPI enforcement actions mortgage",
        "dre mlo bulk": "California DRE MLO download",
        "foreclosure": "California statewide foreclosure dataset",
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
        "CURRENT_CRMLA_BULK_ROSTER": "SOURCE_NOT_ACQUIRED",
        "nmls_consumer_access": "CLOUDFLARE_403 / OPEN_SEARCH_ONLY — do not bypass",
        "docqnet": "OPEN_SEARCH_ONLY — not scraped",
        "ckan": results["crmla roster"],
        "caveat": "Missing live roster is unknown, not zero. Do not display a fake current license count.",
    }
    dre = {
        "coverage": "OPEN_SEARCH_ONLY",
        "source_url": "https://www2.dre.ca.gov/PublicASP/pplinfo.asp",
        "ckan": results["dre mlo bulk"],
        "caveat": "DRE real-estate license plus MLO endorsement is a different credential path from a CRMLA company license. No person-level MLO directory is published.",
    }
    enf = {
        "pass": "bounded_easy_win",
        "result": "NO_BULK_ACQUIRED",
        "ckan": results["dfpi enforcement"],
        "caveat": "No official structured statewide DFPI mortgage enforcement CSV was acquired. Missing is unknown, not zero. Name-only attachment is unsafe.",
    }
    fc = {
        "STATEWIDE_STRUCTURED_SOURCE_NOT_ACQUIRED": True,
        "ckan": results["foreclosure"],
        "note": "CRMLA 2024 annual report includes a completed-foreclosure count as a report metric. That is not a county foreclosure portal and is not a live distress dataset.",
    }
    return roster, dre, enf, fc


def programs() -> dict:
    # Verified 2026-09-03 from official CalHFA pages (not memory).
    return {
        "source_agency": "California Housing Finance Agency",
        "source_index": "https://www.calhfa.ca.gov/homebuyer/programs/",
        "retrieved_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "income_limits_note": "2026 CalHFA income limits for first mortgages and subordinate mortgages effective 2026-06-30. County eligibility is not borrower eligibility.",
        "income_limits_url": "https://www.calhfa.ca.gov/homeownership/limits/",
        "application_path": "CalHFA does not accept applications directly. A CalHFA-approved lender originates the loan.",
        "items": [
            {
                "name": "MyHome Assistance Program",
                "type": "down_payment_and_closing_cost_assistance",
                "assistance": "Deferred-payment junior loan",
                "maximum": "Government/FHA first mortgages: up to the lesser of 3.5% of purchase price or appraised value. Conventional first mortgages: up to the lesser of 3% of purchase price or appraised value.",
                "eligibility": "First-time homebuyer; occupy as primary residence; homebuyer education; meet program income limits. Non-occupant co-borrowers not allowed.",
                "first_time_buyer": True,
                "participating_lender_required": True,
                "status": "Documented on official CalHFA program page; not a guarantee of funds.",
                "source_url": "https://www.calhfa.ca.gov/homebuyer/programs/myhome.htm",
                "source_date": "2026-09-03 official page retrieval",
            },
            {
                "name": "California Dream For All Shared Appreciation Loan",
                "type": "shared_appreciation_down_payment_assistance",
                "assistance": "Down payment and/or closing-cost assistance used with the Dream For All Conventional first mortgage",
                "maximum": "Up to 20% of appraised value/sales price, not to exceed $150,000",
                "eligibility": "At least one borrower first-generation homebuyer; at least one borrower current California resident; all borrowers first-time homebuyers; household income within county program limits. Voucher via randomized drawing, not first-come-first-served.",
                "first_time_buyer": True,
                "participating_lender_required": True,
                "status": "Voucher-based. Official update 2026-05-20: next round of DFA vouchers released. Not a statement that all Californians qualify or that funds are guaranteed.",
                "source_url": "https://www.calhfa.ca.gov/dream",
                "source_date": "2026-05-20 program update on official Dream For All page; page retrieved 2026-09-03",
            },
            {
                "name": "CalHFA Conventional / FHA / VA / USDA first mortgages and CalPLUS overlays",
                "type": "first_mortgage",
                "assistance": "First-mortgage product family originated by approved lenders",
                "maximum": "Subject to conforming/high-balance and insurer/GSE limits current to the rate sheet; not restated here as a single dollar cap.",
                "eligibility": "Must meet CalHFA, lender, and mortgage-insurer requirements; occupy as primary residence; homebuyer education.",
                "first_time_buyer": None,
                "participating_lender_required": True,
                "status": "Documented on official loan-programs index. Conventional refinance FAQ last revised May 2026.",
                "source_url": "https://www.calhfa.ca.gov/homebuyer/programs/",
                "source_date": "2026-09-03 official page retrieval; Conventional FAQ last revised May 2026",
            },
            {
                "name": "Disaster Rebuilding Assistance Program",
                "type": "disaster_rebuilding",
                "assistance": "CalHFA disaster rebuilding assistance (lender enrollment announced)",
                "maximum": "See official bulletin; not restated as an invented cap.",
                "eligibility": "Program-specific; income limits for this program effective 2026-08-03.",
                "first_time_buyer": None,
                "participating_lender_required": True,
                "status": "Program Bulletin #2026-08. Not described here as universally open.",
                "source_url": "https://www.calhfa.ca.gov/homeownership/bulletins/index.htm",
                "source_date": "Program Bulletin 2026-08 / eNews 2026-08-03",
            },
        ],
        "caveat": "Program terms change. Monetary figures carry the official source clock. County income limits are not a promise that a borrower qualifies.",
    }


def regulator_matrix() -> list[dict]:
    return [
        {
            "credential": "CRMLA company license",
            "what": "California Residential Mortgage Lending Act license to make or service residential mortgage loans in California",
            "regulator": "DFPI",
            "proves": "The company held CRMLA authority as of the evidence clock",
            "does_not_prove": "Bank charter, DRE MLO endorsement, HMDA reporter status, or CalHFA participation",
        },
        {
            "credential": "California Financing Law entity",
            "what": "CFL lender/broker/PACE administrator license — overlapping consumer-finance authority, not the CRMLA mortgage roster",
            "regulator": "DFPI",
            "proves": "CFL authority as of that report clock",
            "does_not_prove": "CRMLA mortgage-lender license",
        },
        {
            "credential": "DRE real-estate license",
            "what": "California Department of Real Estate license",
            "regulator": "California DRE",
            "proves": "Real-estate licensing",
            "does_not_prove": "CRMLA company license",
        },
        {
            "credential": "DRE MLO endorsement",
            "what": "Mortgage loan originator endorsement on a DRE license",
            "regulator": "California DRE / NMLS display",
            "proves": "Individual MLO endorsement path",
            "does_not_prove": "CRMLA company license",
        },
        {
            "credential": "NMLS ID",
            "what": "Nationwide Multistate Licensing System identifier",
            "regulator": "NMLS (system of record display; not a California regulator)",
            "proves": "A stable identifier when source-native",
            "does_not_prove": "Current California authority by itself",
        },
        {
            "credential": "HMDA reporter",
            "what": "Institution that filed HMDA loan/application records for California property location",
            "regulator": "CFPB / FFIEC HMDA",
            "proves": "Reported application/origination activity in this vintage",
            "does_not_prove": "California mortgage license",
        },
        {
            "credential": "CalHFA participating lender",
            "what": "Appears on CalHFA approved-lender directory for one or more programs",
            "regulator": "CalHFA",
            "proves": "Program-participation listing as of directory retrieval",
            "does_not_prove": "License, endorsement, or TrustHub recommendation",
        },
    ]


def main() -> None:
    hmda = hmda_block()
    directory = calhfa_directory()
    programs_block = programs()
    crmla = crmla_report()
    cfpb = cfpb_overlay()
    roster, dre, enf, fc = bounded_roster_and_enforcement()
    snapshot = {
        "contract_name": "lender-ca-state-intel-v1",
        "version": "1.0.0",
        "geography": "CA",
        "publication_status": "published",
        "path": "/california",
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_as_of": {
            "hmda": "HMDA 2025",
            "calhfa_directory": directory.get("source_as_of"),
            "calhfa_programs": "Official CalHFA pages retrieved 2026-09-03; Dream For All update 2026-05-20; income limits 2026-06-30",
            "crmla_annual_report": "2024-12-31",
            "cfpb": cfpb.get("retrieved_at") or "SOURCE_NOT_ACQUIRED",
            "live_crmla_roster": "SOURCE_NOT_ACQUIRED",
        },
        "hero": {
            "universe_label": "HMDA applications",
            "universe_value": hmda["applications"],
            "universe_hint": "2025 HMDA applications for properties located in California. Not a count of California-licensed mortgage companies.",
            "current_label": "HMDA originations",
            "current_value": hmda["originations"],
            "observations_label": "CalHFA directory rows",
            "observations_value": directory.get("directory_rows") or 0,
            "geography_label": "Counties in HMDA geography",
            "geography_value": hmda["county_count"],
            "as_of_label": "HMDA vintage",
            "as_of_value": "2025",
        },
        "hmda": hmda,
        "calhfa_programs": programs_block,
        "calhfa_directory": directory,
        "crmla_annual_report": crmla,
        "live_roster": roster,
        "dre_mlo": dre,
        "enforcement": enf,
        "cfpb": cfpb,
        "foreclosure": fc,
        "regulator_matrix": regulator_matrix(),
        "gaps": [
            "No current complete CRMLA company or branch bulk roster was acquired.",
            "NMLS Consumer Access remains search-only (Cloudflare). Not bypassed.",
            "DOCQNET remains search-only. Not scraped.",
            "No person-level DRE MLO universe is published.",
            "Exact NMLS identity is not source-native on CalHFA directory rows.",
            "No structured DFPI mortgage enforcement CSV was acquired in the easy-win pass.",
            "No dedicated statewide foreclosure dataset was acquired.",
            "Company-level complaint exposure denominators are not computed.",
            "The 36-county product slice under data/hmda/california/ is a major-county panel; this page uses the full 58-county by-state partition.",
        ],
        "identity_rules": {
            "EXACT": ["NMLS when source-native", "DFPI license ID", "HMDA LEI"],
            "HIGH_CONFIDENCE": "exact legal name + exact official business address for non-adverse descriptive data only",
            "REVIEW_REQUIRED": "CalHFA directory rows (name + address, no NMLS)",
            "UNSAFE": "name alone — not used for adverse attachment",
        },
    }
    canonical = json.dumps(snapshot, sort_keys=True, separators=(",", ":"))
    snapshot["fingerprint"] = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    text = json.dumps(snapshot, indent=2) + "\n"
    (ART / "ca-lend-001-public-snapshot.json").write_text(text, encoding="utf-8")
    (LIB / "accepted-snapshot.json").write_text(text, encoding="utf-8")
    print(
        json.dumps(
            {
                "fingerprint": snapshot["fingerprint"],
                "apps": hmda["applications"],
                "orig": hmda["originations"],
                "den": hmda["denials"],
                "counties": hmda["county_count"],
                "calhfa_rows": directory.get("directory_rows"),
                "calhfa_companies": directory.get("distinct_company_names"),
                "crmla_licensees": crmla.get("licensees"),
                "crmla_branches": crmla.get("branches"),
                "cfpb": cfpb.get("mortgage_complaint_rows"),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

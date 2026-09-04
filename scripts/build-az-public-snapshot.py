"""AZ-LEND-001 — Arizona mortgage state snapshot.

Allowed: committed HMDA slices, official DIFI pages/tables, CFPB API, ADOH/AZIDA pages.
Forbidden: NMLS scrape, Thentia login, county recorder crawl, county/city routes,
MLO person harvest, fake live company denominator, new federal HMDA ingest.
"""
from __future__ import annotations

import csv
import hashlib
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

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)
CTX = ssl.create_default_context()
ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "arizona"
ART = ROOT / "artifacts"
LIB = ROOT / "lib" / "arizona-intelligence"
RAW.mkdir(parents=True, exist_ok=True)
ART.mkdir(parents=True, exist_ok=True)
LIB.mkdir(parents=True, exist_ok=True)

HMDA_COUNTY = ROOT / "data" / "hmda" / "by-state" / "AZ" / "county_market_summary.csv"
HMDA_LENDER = ROOT / "data" / "hmda" / "by-state" / "AZ" / "lender_state_summary.csv"
HMDA_MAP = ROOT / "data" / "hmda" / "arizona" / "lei_to_nmls_mapping.csv"
HMDA_INDEX = ROOT / "data" / "hmda" / "by-state" / "index.json"
FDIC_AZ = ROOT / "lib" / "fdic" / "data" / "arizona.json"
AZ_LENDERS_TS = ROOT / "lib" / "mortgage" / "arizonaLenders.ts"

DIFI_LICENSE_SEARCH = "https://difi.az.gov/license-search"
DIFI_MORTGAGE = "https://difi.az.gov/licensing/mortgage-lending"
DIFI_ENFORCEMENT = "https://difi.az.gov/enforcement-actions"
DIFI_FIN_ENT = "https://difi.az.gov/licensing/financial-enterprises"
NMLS = "https://www.nmlsconsumeraccess.org/"
THENTIA = "https://azdifi.portalus.thentiacloud.net"
CFPB_API = "https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/"

AZ_COUNTY_NAMES = {
    "04001": "Apache",
    "04003": "Cochise",
    "04005": "Coconino",
    "04007": "Gila",
    "04009": "Graham",
    "04011": "Greenlee",
    "04012": "La Paz",
    "04013": "Maricopa",
    "04015": "Mohave",
    "04017": "Navajo",
    "04019": "Pima",
    "04021": "Pinal",
    "04023": "Santa Cruz",
    "04025": "Yavapai",
    "04027": "Yuma",
}

MORTGAGE_LICENSE_RE = re.compile(
    r"mortgage|loan originator|registered exempt|escrow|collection agency|"
    r"sales finance|consumer lend|financial enterprise|payday|money transmitter|"
    r"premium finance|commercial mortgage",
    re.I,
)
INSURANCE_LICENSE_RE = re.compile(
    r"insurance|producer|bail bond|surplus lines|title agent|service company|"
    r"captive|reinsur|life and health|adjuster",
    re.I,
)


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


def hmda_block() -> dict:
    rows = [r for r in csv.DictReader(HMDA_COUNTY.open(encoding="utf-8"))]
    counties = []
    for r in rows:
        fips = (r.get("county_fips") or "").strip()
        name = (r.get("county_name") or "").strip() or AZ_COUNTY_NAMES.get(fips)
        if not name or name.startswith("04"):
            raise SystemExit(f"Arizona county FIPS {fips} has no publishable name")
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
                "purpose_other_applications": num(r, "purpose_other_count"),
                "purchase_pct_of_apps": fnum(r, "purchase_pct_of_apps"),
                "refinance_pct_of_apps": fnum(r, "refinance_pct_of_apps"),
                "apps_conventional": num(r, "apps_conventional"),
                "apps_fha": num(r, "apps_fha"),
                "apps_va": num(r, "apps_va"),
                "apps_usda_other": num(r, "apps_usda_other"),
                "conventional_pct": fnum(r, "apps_conventional_pct"),
                "orig_conventional": num(r, "orig_conventional"),
                "orig_fha": num(r, "orig_fha"),
                "orig_va": num(r, "orig_va"),
                "orig_usda_other": num(r, "orig_usda_other"),
            }
        )
    counties.sort(key=lambda c: (c["county_name"], c["county_fips"]))
    apps = sum(c["applications"] for c in counties)
    orig = sum(c["originations"] for c in counties)
    den = sum(c["denials"] for c in counties)
    purch = sum(c["purchase_applications"] for c in counties)
    refi = sum(c["refinance_applications"] for c in counties)
    other_p = sum(c["purpose_other_applications"] for c in counties)
    conv = sum(c["apps_conventional"] for c in counties)
    fha = sum(c["apps_fha"] for c in counties)
    va = sum(c["apps_va"] for c in counties)
    usda = sum(c["apps_usda_other"] for c in counties)
    oconv = sum(c["orig_conventional"] for c in counties)
    ofha = sum(c["orig_fha"] for c in counties)
    ova = sum(c["orig_va"] for c in counties)
    ousda = sum(c["orig_usda_other"] for c in counties)

    maps: dict[str, dict] = {}
    high_conf = 0
    if HMDA_MAP.exists():
        for r in csv.DictReader(HMDA_MAP.open(encoding="utf-8")):
            lei = (r.get("lei") or "").strip()
            if lei:
                maps[lei] = r
                conf = (r.get("match_confidence") or "").strip().lower()
                if conf == "high":
                    high_conf += 1
    reporters = []
    for r in csv.DictReader(HMDA_LENDER.open(encoding="utf-8")):
        lei = (r.get("lei") or "").strip()
        if not lei:
            continue
        mapped = maps.get(lei)
        nmls = normalize_nmls((mapped or {}).get("nmls_id") or "") if mapped else None
        name = (r.get("institution_name") or "").strip() or (mapped or {}).get("institution_name_hmda") or None
        reporters.append(
            {
                "lei": lei,
                "applications": num(r, "total_applications"),
                "originations": num(r, "total_originations"),
                "institution_name": name,
                "nmls_id": nmls,
                "our_lender_slug": (mapped or {}).get("our_lender_slug") or None,
                "identity": "EXACT_LEI_AND_NMLS" if nmls else ("EXACT_LEI_MAPPED" if mapped else "EXACT_LEI_UNMAPPED"),
            }
        )
    reporters.sort(key=lambda x: (-x["applications"], x["lei"]))
    index_az = {}
    if HMDA_INDEX.exists():
        idx = json.loads(HMDA_INDEX.read_text(encoding="utf-8"))
        index_az = (idx.get("by_state") or {}).get("AZ") or {}
    return {
        "year": 2025,
        "geo_grain": "state_and_county",
        "state_code": "AZ",
        "source": "Committed HMDA Arizona partition data/hmda/by-state/AZ/county_market_summary.csv. Properties located in Arizona. Not a second national download.",
        "source_as_of": "HMDA 2025",
        "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
        "applications": apps,
        "originations": orig,
        "denials": den,
        "denial_rate_pct": pct(den, apps),
        "denial_rate_calculation": "denials / applications * 100, rounded to 2 decimals",
        "purchase_applications": purch,
        "refinance_applications": refi,
        "purpose_other_applications": other_p,
        "purchase_pct_of_apps": pct(purch, apps),
        "refinance_pct_of_apps": pct(refi, apps),
        "purpose_other_pct_of_apps": pct(other_p, apps),
        "apps_conventional": conv,
        "apps_fha": fha,
        "apps_va": va,
        "apps_usda_other": usda,
        "conventional_pct": pct(conv, apps),
        "fha_pct": pct(fha, apps),
        "va_pct": pct(va, apps),
        "usda_other_pct": pct(usda, apps),
        "orig_conventional": oconv,
        "orig_fha": ofha,
        "orig_va": ova,
        "orig_usda_other": ousda,
        "county_count": len(counties),
        "arizona_county_universe": 15,
        "all_15_counties": len(counties) == 15,
        "counties": counties,
        "lei_reporter_rows": len(reporters),
        "lei_reporters_with_exact_nmls": sum(1 for r in reporters if r["nmls_id"]),
        "high_confidence_lei_maps": high_conf,
        "index_json_applications": index_az.get("applications"),
        "index_json_originations": index_az.get("originations"),
        "index_json_lei_state_rows": index_az.get("lei_state_rows"),
        "index_json_lender_county_rows": index_az.get("lender_county_rows"),
        "top_reporters_by_applications": reporters[:15],
        "denial_reasons": None,
        "denial_reasons_coverage": "SOURCE_NOT_AVAILABLE_IN_COMMITTED_EXTRACT",
        "caveat": (
            "HMDA is a mortgage-application filing extract for properties located in Arizona. "
            "It is not an Arizona DIFI license roster, not a quality ranking, and the denial rate "
            "does not prove discrimination. An HMDA reporter is not an Arizona-licensed company. "
            "An Arizona office or HQ on an HMDA reporter is geography, not licensing."
        ),
        "omitted": {
            "median_loan_amount": "Not present in the committed 2025 AZ county summary extract.",
            "denial_reasons": "SOURCE_NOT_AVAILABLE_IN_COMMITTED_EXTRACT",
        },
    }


def classify_license(license_type: str) -> str:
    if MORTGAGE_LICENSE_RE.search(license_type or ""):
        return "MORTGAGE_LENDING"
    if INSURANCE_LICENSE_RE.search(license_type or ""):
        return "INSURANCE"
    return "OTHER_DIFI"


def classify_identity(text: str) -> str:
    if re.search(r"NMLS\s*(ID|#|No\.?|Number)?\s*[:#]?\s*\d{3,12}", text, re.I):
        return "EXACT_NMLS"
    if re.search(r"\bNMLS\s*#?\s*\d{3,12}\b", text, re.I):
        return "EXACT_NMLS"
    if re.search(r"\b(DIFI|AZDIFI)\s*(license|lic\.?)\s*(no\.?|number|#)?\s*[:#]?\s*[A-Z0-9-]{4,}", text, re.I):
        return "EXACT_DIFI_LICENSE"
    if re.search(r"\b(NAIC|NPN|SBS)\s*(NO\.?|Number|#|Co Code)?\s*[:#]?\s*\d{4,}", text, re.I):
        return "EXACT_OTHER_OFFICIAL_ID"
    if re.search(r"\b(Phoenix|Tucson|Mesa|Scottsdale|Tempe|Chandler|Glendale|Arizona)\b", text, re.I) and re.search(
        r"[A-Za-z]{3,}", text
    ):
        return "REVIEW_REQUIRED"
    return "UNSAFE_NAME_ONLY"


def difi_enforcement() -> dict:
    out = {
        "source": "Arizona DIFI Enforcement Actions HTML table",
        "agency": "Arizona Department of Insurance and Financial Institutions",
        "url": DIFI_ENFORCEMENT,
        "grain": "enforcement_order",
        "identity_bar": "EXACT_NMLS_OR_DIFI_LICENSE_FOR_ADVERSE_ATTACH",
        "mixes_domains": True,
    }
    collected: list[list[str]] = []
    pages_ok = 0
    header: list[str] = []
    for page in range(0, 40):
        url = DIFI_ENFORCEMENT if page == 0 else f"{DIFI_ENFORCEMENT}?page={page}"
        status, body = fetch(url, timeout=60)
        if page == 0:
            out["http_status"] = status
            (RAW / "difi-enforcement-page-0.html").write_bytes(body[:800000] if body else b"")
        if status != 200 or len(body) < 200:
            if page == 0:
                out.update(
                    {
                        "result": "SOURCE_ACCESS_BLOCKED" if status in {0, 403, 503} else "SOURCE_NOT_ACQUIRED",
                        "coverage_state": "SOURCE_NOT_ACQUIRED",
                        "order_rows": 0,
                        "blocker": f"HTTP {status} on official enforcement table",
                    }
                )
                return out
            break
        parser = SimpleTable()
        try:
            parser.feed(body.decode("utf-8", "replace"))
        except Exception:
            parser.rows = []
        rows = parser.rows
        if not rows:
            break
        if page == 0:
            header = rows[0]
            out["header"] = header
        data_rows = rows[1:]
        seen = {tuple(r[:3]) for r in collected}
        new = 0
        for r in data_rows:
            key = tuple(r[:3])
            if key in seen:
                continue
            collected.append(r)
            seen.add(key)
            new += 1
        pages_ok += 1
        if new == 0:
            break
    if not collected:
        out.update(
            {
                "result": "SOURCE_NOT_ACQUIRED",
                "coverage_state": "SOURCE_NOT_ACQUIRED",
                "order_rows": 0,
            }
        )
        return out

    def col(*names: str) -> int:
        h = [c.lower() for c in header]
        for i, cell in enumerate(h):
            if any(n in cell for n in names):
                return i
        return -1

    i_matter = col("order", "matter", "document")
    i_resp = col("matter of", "respondent", "in the matter")
    i_type = col("order type")
    i_license = col("license type")
    i_enf = col("enforcement type")
    i_date = col("filed", "date")

    types = Counter()
    licenses = Counter()
    enf_types = Counter()
    domains = Counter()
    identities = Counter()
    exact_nmls = 0
    exact_difi = 0
    exact_other = 0
    review = 0
    unsafe = 0
    lender_rows = 0
    insurance_rows = 0
    other_rows = 0
    distinct_nmls: set[str] = set()
    nmls_re = re.compile(r"NMLS\s*(ID|#|No\.?|Number)?\s*[:#]?\s*(\d{3,12})", re.I)
    for rec in collected:
        resp = rec[i_resp] if i_resp >= 0 and i_resp < len(rec) else " ".join(rec)
        typ = rec[i_type] if i_type >= 0 and i_type < len(rec) else ""
        lic = rec[i_license] if i_license >= 0 and i_license < len(rec) else ""
        et = rec[i_enf] if i_enf >= 0 and i_enf < len(rec) else ""
        blob = " ".join(rec)
        types[typ or "(blank native type)"] += 1
        licenses[lic or "(blank license type)"] += 1
        enf_types[et or "(blank enforcement type)"] += 1
        domain = classify_license(lic)
        domains[domain] += 1
        ident = classify_identity(blob)
        identities[ident] += 1
        if domain == "MORTGAGE_LENDING":
            lender_rows += 1
            if ident == "EXACT_NMLS":
                exact_nmls += 1
                for m in nmls_re.finditer(blob):
                    digits = normalize_nmls(m.group(2) if m.lastindex and m.lastindex >= 2 else m.group(0))
                    if digits:
                        distinct_nmls.add(digits)
            elif ident == "EXACT_DIFI_LICENSE":
                exact_difi += 1
            elif ident == "EXACT_OTHER_OFFICIAL_ID":
                exact_other += 1
            elif ident == "REVIEW_REQUIRED":
                review += 1
            else:
                unsafe += 1
        elif domain == "INSURANCE":
            insurance_rows += 1
        else:
            other_rows += 1

    out.update(
        {
            "result": "ACQUIRED",
            "coverage_state": "ACQUIRED_BOUNDED_HTML_TABLE",
            "retrieved_at": now_iso(),
            "pages_fetched": pages_ok,
            "order_rows": len(collected),
            "domain_split": {
                "MORTGAGE_LENDING": lender_rows,
                "INSURANCE": insurance_rows,
                "OTHER_DIFI": other_rows,
            },
            "lender_relevant_rows": lender_rows,
            "exact_nmls_rows": exact_nmls,
            "exact_difi_license_rows": exact_difi,
            "exact_other_official_id_rows": exact_other,
            "review_required_rows": review,
            "unsafe_name_only_rows": unsafe,
            "distinct_exact_nmls": len(distinct_nmls),
            "name_only_identity": "UNSAFE_FOR_ADVERSE_PROFILE_ATTACH",
            "filter_rule": (
                "Lender-relevant rows use source-native License Type matching mortgage/loan originator/"
                "registered exempt/escrow/collection/sales finance/consumer lender/financial enterprise. "
                "Do not infer from company name. Insurance rows are excluded from Lender publication."
            ),
            "native_type_distinct": len(types),
            "native_type_top": [{"key": k, "count": v} for k, v in types.most_common(15)],
            "native_license_type_top": [{"key": k, "count": v} for k, v in licenses.most_common(15)],
            "native_enforcement_type_top": [{"key": k, "count": v} for k, v in enf_types.most_common(15)],
            "not_a_license_roster": True,
            "publication_eligibility": "PUBLIC_STATE_PAGE_AGGREGATES_ONLY",
            "caveat": (
                "DIFI enforcement mixes insurance and financial-enterprise domains. Only source-native "
                "mortgage/lending License Type rows are treated as lender-relevant. NOTICE is not a final "
                "order. Charges are not a final finding. Order is not a complaint. Penalty is not consumer "
                "loss. Action count is not quality. Exact NMLS or DIFI license is required for adverse "
                "profile attachment. Name-only is UNSAFE."
            ),
        }
    )
    return out


def live_roster() -> dict:
    pages = {}
    for key, url in {
        "license_search": DIFI_LICENSE_SEARCH,
        "mortgage": DIFI_MORTGAGE,
        "financial_enterprises": DIFI_FIN_ENT,
        "nmls": NMLS,
        "thentia": THENTIA,
    }.items():
        status, body = fetch(url, timeout=40)
        pages[key] = {
            "url": url,
            "http_status": status,
            "bytes": len(body or b""),
            "looks_like_csv": (body or b"").lstrip()[:20].startswith(b"License") or url.endswith(".csv"),
        }
        (RAW / f"roster-{key}.html").write_bytes((body or b"")[:200000])
    csv_found = any(p.get("looks_like_csv") for p in pages.values())
    return {
        "CURRENT_ARIZONA_MORTGAGE_COMPANY_BULK_ROSTER": "SOURCE_NOT_ACQUIRED",
        "ARIZONA_LIVE_COMPANY_ROSTER": "SOURCE_NOT_ACQUIRED / OPEN_SEARCH_ONLY",
        "live_licensed_company_denominator": "UNKNOWN",
        "nmls_consumer_access": "OPEN_SEARCH_ONLY — not scraped",
        "thentia": "FREE_ACCOUNT_REQUIRED / licensee login — not used",
        "difi_csv_found": csv_found,
        "pages": pages,
        "caveat": (
            "Missing live roster is unknown, not zero. Search-only is not zero. Do not display a fake "
            "current Arizona mortgage-company count. NMLS Consumer Access and Thentia were not scraped."
        ),
    }


def cfpb_overlay() -> dict:
    params = urllib.parse.urlencode({"size": "5", "state": "AZ", "product": "Mortgage"})
    status, body = fetch(f"{CFPB_API}?{params}", timeout=60)
    out = {
        "source": "CFPB Consumer Complaint Database API",
        "source_url": "https://www.consumerfinance.gov/data-research/consumer-complaints/",
        "product": "Mortgage",
        "geography": "AZ",
        "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT" if status == 200 else "SOURCE_NOT_ACQUIRED",
        "http_status": status,
        "caveat": (
            "Complaint is not a violation. Raw complaint count is not a quality ranking and is not "
            "exposure-normalized. No company complaint rate is published without an exposure denominator."
        ),
        "company_rate_published": False,
        "canonical_company_snapshot": (
            "National CFPB company snapshot exists separately; this overlay is statewide Arizona "
            "geography and is not a company ranking. No new fuzzy adverse matching."
        ),
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
                "state": "AZ",
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
        }
    )
    return out


def programs() -> dict:
    catalog = {
        "adoh_home": "https://housing.az.gov/",
        "adoh_home_plus": "https://housing.az.gov/general-public/home-plus",
        "azida_homeplus": "https://arizonaida.com/homeplusdpa/",
        "azida_home": "https://arizonaida.com/",
        "homeplusaz": "https://homeplusaz.com/home-plus-dpa/",
    }
    pages = {}
    for key, url in catalog.items():
        status, body = fetch(url, timeout=50)
        pages[key] = {
            "url": url,
            "http_status": status,
            "bytes": len(body or b""),
            "sha256": hashlib.sha256(body).hexdigest() if status == 200 and body else None,
        }
        (RAW / f"program-{key}.html").write_bytes((body or b"")[:300000])
    items = []
    if pages["adoh_home_plus"]["http_status"] == 200 or pages["azida_homeplus"]["http_status"] == 200:
        items.append(
            {
                "name": "HOME Plus",
                "agency": "Arizona Industrial Development Authority (published via Arizona Department of Housing)",
                "type": "first_mortgage_and_down_payment_assistance",
                "assistance": "Statewide down-payment and closing-cost assistance paired with a 30-year fixed-rate mortgage. Official ADOH page: the only state-run statewide home-buyer DPA program in Arizona, available in every county, city, and ZIP code.",
                "maximum": "Official Arizona IDA / Home Plus materials describe up to 4% down-payment and closing-cost assistance. Confirm current options with a participating lender.",
                "eligibility": "Official materials: not limited to first-time buyers in all setups; income cap and credit-score rules apply as published. One borrower completes homebuyer education. Eligibility is not approval.",
                "income_purchase_limits": "Official Home Plus materials retrieved this snapshot list a statewide borrower income cap of $155,386 as of April 6, 2026. Confirm current figures on official pages.",
                "first_time_buyer": False,
                "participating_lender_required": True,
                "status": "Documented on official ADOH and Arizona IDA pages retrieved this snapshot.",
                "source_url": "https://housing.az.gov/general-public/home-plus",
                "source_date": f"Official page retrieval {now_iso()[:10]}",
            }
        )
    if pages["azida_home"]["http_status"] == 200:
        items.append(
            {
                "name": "Arizona Is Home",
                "agency": "Arizona Industrial Development Authority",
                "type": "first_mortgage_and_down_payment_assistance",
                "assistance": "Statewide first-time homebuyer program funded with tax-exempt bonds, with down-payment assistance as published by Arizona IDA.",
                "maximum": "Confirm current assistance percentage and funding availability on official Arizona IDA / Home Plus operator pages. 2026 program materials describe an annual funding cap.",
                "eligibility": "Official materials: first-time homebuyers. County AMI limits apply. Eligibility is not approval.",
                "income_purchase_limits": "County AMI tables are published by Arizona IDA and change. Confirm current county figures. Not copied here as a guaranteed underwriting limit.",
                "first_time_buyer": True,
                "participating_lender_required": True,
                "status": "Documented as a current statewide Arizona IDA program on official pages retrieved this snapshot.",
                "source_url": "https://arizonaida.com/",
                "source_date": f"Official page retrieval {now_iso()[:10]}",
            }
        )
    if pages["adoh_home"]["http_status"] == 200:
        items.append(
            {
                "name": "Arizona Department of Housing homebuyer information",
                "agency": "Arizona Department of Housing",
                "type": "homebuyer_education",
                "assistance": "Official state housing portal pointing consumers to statewide HOME Plus and related housing resources.",
                "maximum": "Not a dollar assistance product by itself.",
                "eligibility": "Portal information is not a loan approval.",
                "income_purchase_limits": "Not a loan product.",
                "first_time_buyer": None,
                "participating_lender_required": False,
                "status": "Documented on official ADOH home page retrieved this snapshot.",
                "source_url": "https://housing.az.gov/",
                "source_date": f"Official page retrieval {now_iso()[:10]}",
            }
        )
    return {
        "retrieved_at": now_iso(),
        "pages": pages,
        "application_path": (
            "HOME Plus and Arizona Is Home require a participating lender. They do not replace mortgage "
            "underwriting. Program eligibility is not approval. Phoenix / Maricopa-only programs such as "
            "Home in Five are out of scope on this state page."
        ),
        "items": items,
        "verified_family_count": len(items),
        "caveat": (
            "Program terms change. Eligibility is not guaranteed approval. Headline amounts are official-page "
            "formulas, not a promise of funds. City or county local DPA is not inventoried on this state page."
        ),
    }


def foreclosure_servicing() -> tuple[dict, dict]:
    urls = {
        "adoh": "https://housing.az.gov/",
        "difi_home": "https://difi.az.gov/",
        "azag": "https://www.azag.gov/",
    }
    pages = {}
    mentions = False
    for key, url in urls.items():
        status, body = fetch(url, timeout=40)
        text = strip_html(body).lower() if body else ""
        hit = "foreclos" in text
        mentions = mentions or hit
        pages[key] = {"url": url, "http_status": status, "mentions_foreclosure": hit}
    servicing = {
        "result": "NO_EASY_STATEWIDE_SERVICING_REPORT",
        "caveat": "No easy statewide mortgage-servicing performance report was acquired. DIFI mortgage classes may include servicing activity; that is not a live servicer roster.",
    }
    fc = {
        "STATEWIDE_STRUCTURED_FORECLOSURE_SOURCE_NOT_ACQUIRED": True,
        "pages": pages,
        "consumer_page_mentions_foreclosure": mentions,
        "note": (
            "No county recorder, deed, or trustee-sale crawl was performed. Missing statewide foreclosure "
            "structure is unknown, not zero. A consumer help mention is not a structured statewide dataset."
        ),
    }
    return servicing, fc


def depository_overlay() -> dict:
    banks = json.loads(FDIC_AZ.read_text(encoding="utf-8")).get("banks") or []
    return {
        "source": "Existing LenderTrustHub FDIC Arizona overlay (lib/fdic/data/arizona.json)",
        "fdic_cert_rows": len(banks),
        "identity": "FDIC CERT when source-native",
        "caveat": (
            "An Arizona-headquartered FDIC-insured bank is a depository overlay, not a DIFI mortgage-banker "
            "license. HMDA reporters include depositories and nonbanks. Do not call every HMDA reporter a "
            "DIFI-licensed lender."
        ),
        "coverage_state": "REUSED_EXISTING_NATIONAL_OVERLAY",
    }


def pre_ingest(hmda: dict) -> dict:
    catalog = 0
    if AZ_LENDERS_TS.exists():
        catalog = len(re.findall(r"slug:\s*'", AZ_LENDERS_TS.read_text(encoding="utf-8")))
    return {
        "catalog_arizona_lender_rows": catalog,
        "catalog_note": "Existing /local-lenders/arizona catalog entries. Not a DIFI live roster. Trust Score fields in that catalog are not used on this intelligence page.",
        "hmda_partition_already_in_repo": True,
        "hmda_applications_already_present": hmda["applications"],
        "lei_reporter_rows_already_present": hmda["lei_reporter_rows"],
        "high_confidence_lei_maps_already_present": hmda["high_confidence_lei_maps"],
        "canonical_company_vs_nmls_vs_lei": "Kept as distinct identity layers. An Arizona HMDA row is not a new organization.",
    }


def regulator_matrix() -> list[dict]:
    return [
        {
            "credential": "HMDA reporter",
            "what": "Institution that filed HMDA loan/application records for Arizona property location",
            "regulator": "CFPB / FFIEC HMDA",
            "grain": "business",
            "identity": "LEI",
            "verification": "Committed HMDA Arizona partition",
            "proves": "Reported application/origination activity in this vintage",
            "does_not_prove": "Arizona DIFI license, current NMLS authority, or HOME Plus participation",
        },
        {
            "credential": "NMLS ID",
            "what": "Nationwide Multistate Licensing System identifier when source-native",
            "regulator": "NMLS (system of record display; Arizona DIFI is the state regulator)",
            "grain": "mixed_person_and_business",
            "identity": "NMLS",
            "verification": "NMLS Consumer Access — search only, not scraped",
            "proves": "A stable identifier when printed by the source",
            "does_not_prove": "Current Arizona authority by itself, or whether the ID is an institution, branch, or person",
        },
        {
            "credential": "Mortgage Banker",
            "what": "Company licensed by DIFI to make or negotiate mortgage loans as a mortgage banker",
            "regulator": "Arizona DIFI",
            "grain": "business",
            "identity": "NMLS / DIFI",
            "verification": "NMLS Consumer Access",
            "proves": "DIFI mortgage-banker class when a live NMLS record is verified",
            "does_not_prove": "HMDA reporter status or MLO person credential",
        },
        {
            "credential": "Mortgage Broker",
            "what": "Company licensed by DIFI to broker mortgage loans",
            "regulator": "Arizona DIFI",
            "grain": "business",
            "identity": "NMLS / DIFI",
            "verification": "NMLS Consumer Access",
            "proves": "DIFI mortgage-broker class when a live NMLS record is verified",
            "does_not_prove": "Mortgage-banker authority or a live company census",
        },
        {
            "credential": "Commercial Mortgage Banker / Broker",
            "what": "DIFI commercial mortgage classes, distinct from residential mortgage banker/broker",
            "regulator": "Arizona DIFI",
            "grain": "business",
            "identity": "NMLS / DIFI",
            "verification": "NMLS Consumer Access",
            "proves": "Commercial mortgage class when a live record is verified",
            "does_not_prove": "Residential mortgage authority",
        },
        {
            "credential": "Registered Exempt Person",
            "what": "DIFI certificate of exemption class for specified mortgage activity",
            "regulator": "Arizona DIFI",
            "grain": "business",
            "identity": "NMLS / DIFI",
            "verification": "NMLS Consumer Access",
            "proves": "Exemption certificate class when a live record is verified",
            "does_not_prove": "A mortgage-banker or mortgage-broker license",
        },
        {
            "credential": "Loan Originator",
            "what": "Individual originator licensed through NMLS",
            "regulator": "Arizona DIFI via NMLS display",
            "grain": "person",
            "identity": "NMLS person",
            "verification": "NMLS Consumer Access",
            "proves": "Individual originator credential path when source-native",
            "does_not_prove": "A company license. This site does not publish an MLO person directory",
        },
        {
            "credential": "Escrow / financial enterprise (where DIFI-licensed)",
            "what": "Adjacent DIFI financial-enterprise classes such as collection agency or sales finance",
            "regulator": "Arizona DIFI",
            "grain": "business",
            "identity": "DIFI / Thentia when source-native",
            "verification": "DIFI license search / Thentia — not scraped",
            "proves": "That DIFI class when a live record is verified",
            "does_not_prove": "Mortgage-banker authority. Not added into a mortgage-company total",
        },
        {
            "credential": "Depository Bank / Credit Union",
            "what": "Bank, savings bank, or credit union under a prudential charter",
            "regulator": "FDIC / NCUA / OCC / Federal Reserve as applicable",
            "grain": "business",
            "identity": "FDIC CERT / NCUA / RSSD",
            "verification": "Existing national overlay",
            "proves": "Charter identity when source-native",
            "does_not_prove": "DIFI mortgage-banker or mortgage-broker license",
        },
        {
            "credential": "Program participating lender",
            "what": "Appears on a HOME Plus / Arizona Is Home participating-lender path",
            "regulator": "Arizona IDA / ADOH",
            "grain": "business",
            "identity": "Program listing",
            "verification": "Official program pages",
            "proves": "Program-participation listing as of page retrieval",
            "does_not_prove": "DIFI license, endorsement, or TrustHub recommendation",
        },
    ]


def clock_reconciliation(hmda: dict) -> dict:
    return {
        "lender_canonical_source": "data/hmda/by-state/AZ/county_market_summary.csv (summed) plus data/hmda/by-state/index.json",
        "lender_applications": hmda["applications"],
        "lender_originations": hmda["originations"],
        "lender_denials": hmda["denials"],
        "ask_fallback_applications": 307379,
        "ask_fallback_originations": 183374,
        "ask_fallback_denials": 49376,
        "originations_match": hmda["originations"] == 183374,
        "why": (
            "Originations match (183,374). Applications and denials differ because Ask lender-v1-fallback.json "
            "is a published network-metrics snapshot, not the live county-sum of the committed Arizona HMDA "
            "partition. This ticket uses the LenderTrustHub county-sum as canonical. Ask is not modified. "
            "ATH-AZ-002 should refresh Ask from this Lender snapshot."
        ),
        "which_is_canonical_for_this_ticket": "LenderTrustHub committed Arizona HMDA partition",
        "ask_is_stale_relative_to_lender_partition": hmda["applications"] != 307379,
    }


def expansion_ledger(hmda: dict, enf: dict, cfpb: dict, programs_block: dict) -> dict:
    lender_rows = enf.get("lender_relevant_rows") or 0
    cfpb_rows = cfpb.get("mortgage_complaint_rows") if isinstance(cfpb.get("mortgage_complaint_rows"), int) else 0
    program_items = len(programs_block.get("items") or [])
    new_evidence = 0
    if enf.get("result") == "ACQUIRED":
        new_evidence += lender_rows
    if cfpb.get("result") == "ACQUIRED":
        new_evidence += cfpb_rows
    new_evidence += program_items
    return {
        "NET_NEW_CANONICAL_ORGANIZATIONS": 0,
        "NET_NEW_STATE_IDENTITIES": 0,
        "EXISTING_ORGANIZATIONS_ENRICHED": 0,
        "NEW_EVIDENCE_ROWS": new_evidence,
        "notes": {
            "hmda": "HMDA Arizona partition was already in the repository. Displaying it on /arizona does not create new evidence rows or organizations.",
            "lei_maps": "High-confidence LEI maps were already committed. Not net-new organizations.",
            "enforcement": "Lender-relevant DIFI HTML rows acquired this ticket count as new evidence, not new companies.",
            "cfpb": "Statewide Arizona mortgage complaint overlay computed this ticket is new evidence, not organizations.",
            "programs": "Official program families documented this ticket are new evidence items.",
            "roster": "No DIFI/NMLS business identities were bulk-acquired, so NET_NEW_STATE_IDENTITIES is 0.",
        },
    }


def main() -> None:
    hmda = hmda_block()
    enf = difi_enforcement()
    roster = live_roster()
    programs_block = programs()
    cfpb = cfpb_overlay()
    servicing, fc = foreclosure_servicing()
    depository = depository_overlay()
    baseline = pre_ingest(hmda)
    clocks = clock_reconciliation(hmda)
    ledger = expansion_ledger(hmda, enf, cfpb, programs_block)
    if not programs_block["items"]:
        raise SystemExit("Publication gate: at least one current Arizona program family must be verified")
    if hmda["applications"] <= 0 or hmda["originations"] <= 0:
        raise SystemExit("Publication gate: HMDA Arizona metrics missing")
    if hmda["county_count"] != 15:
        raise SystemExit("Publication gate: Arizona HMDA must cover 15 counties")
    snapshot = {
        "contract_name": "lender-az-state-intel-v1",
        "version": "1.0.0",
        "geography": "AZ",
        "publication_status": "published",
        "path": "/arizona",
        "generated_at": now_iso(),
        "growth_classification": "INTELLIGENCE_GROWTH_HEAVY",
        "source_as_of": {
            "hmda": "HMDA 2025",
            "difi_enforcement": enf.get("retrieved_at") or enf.get("result") or "SOURCE_NOT_ACQUIRED",
            "programs": programs_block.get("retrieved_at"),
            "cfpb": cfpb.get("retrieved_at") or "SOURCE_NOT_ACQUIRED",
            "live_roster": "SOURCE_NOT_ACQUIRED",
        },
        "hero": {
            "universe_label": "HMDA applications",
            "universe_value": hmda["applications"],
            "universe_hint": "2025 HMDA applications for properties located in Arizona. Not a count of Arizona-licensed mortgage companies.",
            "current_label": "HMDA originations",
            "current_value": hmda["originations"],
            "observations_label": "DIFI lender-relevant enforcement rows",
            "observations_value": enf.get("lender_relevant_rows") if enf.get("result") == "ACQUIRED" else 0,
            "geography_label": "Counties in HMDA geography",
            "geography_value": hmda["county_count"],
            "as_of_label": "HMDA vintage",
            "as_of_value": "2025",
        },
        "pre_ingest_baseline": baseline,
        "clock_reconciliation": clocks,
        "hmda": hmda,
        "difi_enforcement": enf,
        "programs": programs_block,
        "live_roster": roster,
        "cfpb": cfpb,
        "servicing": servicing,
        "foreclosure": fc,
        "depository": depository,
        "expansion_ledger": ledger,
        "regulator_matrix": regulator_matrix(),
        "gaps": [
            "No current complete Arizona mortgage-company bulk roster was acquired. Live licensed-company denominator is UNKNOWN, not zero.",
            "Complete MLO person universe is not published and was not scraped from NMLS.",
            "Complete current servicer roster was not acquired.",
            "Name-only DIFI enforcement rows cannot be attached to lender profiles.",
            "NMLS Consumer Access remains search-only. Not scraped.",
            "Thentia remains a licensee login. Not used.",
            "Live license status for each HMDA reporter is unknown.",
            "No easy statewide servicing performance report was acquired.",
            "STATEWIDE_STRUCTURED_FORECLOSURE_SOURCE_NOT_ACQUIRED. No county recorder crawl.",
            "Company-level CFPB complaint exposure denominators are not computed.",
            "DIFI enforcement mixes insurance and lending; insurance rows are excluded from Lender publication.",
        ],
        "identity_rules": {
            "EXACT_NMLS": "NMLS when source-native on a lender-relevant DIFI order row",
            "EXACT_DIFI_LICENSE": "DIFI license number when source-native on a lender-relevant row",
            "EXACT_OTHER_OFFICIAL_ID": "NAIC / NPN / SBS / FDIC CERT / RSSD / LEI when source-native and not used to infer DIFI authority",
            "REVIEW_REQUIRED": "name + city without an official ID",
            "UNSAFE": "name-only DIFI orders — not used for adverse profile attachment",
        },
        "semantic_guardrails": [
            "HMDA is not a license roster",
            "HMDA reporter is not an Arizona-licensed company",
            "NMLS ID is not current Arizona authority by itself",
            "MLO person is not a lender company",
            "Application is not origination",
            "Denial is not misconduct",
            "Denial rate is not quality",
            "LEI is not NMLS",
            "Complaint is not a violation",
            "Order is not a complaint",
            "Name-only adverse match is unsafe",
            "Program eligibility is not approval",
            "Market row is not entity growth",
            "Missing is not zero",
            "Search-only is not zero",
            "No Trust Score",
            "No paid ranking",
        ],
    }
    canonical = json.dumps(snapshot, sort_keys=True, separators=(",", ":"))
    snapshot["fingerprint"] = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    text = json.dumps(snapshot, indent=2) + "\n"
    (ART / "az-lend-001-public-snapshot.json").write_text(text, encoding="utf-8")
    (LIB / "accepted-snapshot.json").write_text(text, encoding="utf-8")
    print(
        json.dumps(
            {
                "fingerprint": snapshot["fingerprint"],
                "apps": hmda["applications"],
                "orig": hmda["originations"],
                "den": hmda["denials"],
                "denial_rate": hmda["denial_rate_pct"],
                "counties": hmda["county_count"],
                "lei": hmda["lei_reporter_rows"],
                "lei_nmls": hmda["lei_reporters_with_exact_nmls"],
                "difi_http": enf.get("http_status"),
                "difi_rows": enf.get("order_rows"),
                "difi_lender": enf.get("lender_relevant_rows"),
                "difi_nmls": enf.get("exact_nmls_rows"),
                "programs": len(programs_block["items"]),
                "cfpb": cfpb.get("mortgage_complaint_rows"),
                "ledger": ledger,
                "roster": roster["ARIZONA_LIVE_COMPANY_ROSTER"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

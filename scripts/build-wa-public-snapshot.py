"""WA-LEND-001 — Washington mortgage state snapshot.

Allowed: committed HMDA slices, official DFI pages/tables, CFPB API, WSHFC pages, open data.
Forbidden: NMLS scrape, DFI licensee-database crawl, county recorder/foreclosure crawl,
county/city routes, MLO person harvest, fake live company denominator.
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

UA = "LenderTrustHub-WA-LEND-001/1.0 (+https://www.lendertrusthub.com; official bulk research)"
CTX = ssl.create_default_context()
ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "washington"
ART = ROOT / "artifacts"
LIB = ROOT / "lib" / "washington-intelligence"
RAW.mkdir(parents=True, exist_ok=True)
ART.mkdir(parents=True, exist_ok=True)
LIB.mkdir(parents=True, exist_ok=True)

HMDA_COUNTY = ROOT / "data" / "hmda" / "by-state" / "WA" / "county_market_summary.csv"
HMDA_LENDER = ROOT / "data" / "hmda" / "by-state" / "WA" / "lender_state_summary.csv"
HMDA_MAP = ROOT / "data" / "hmda" / "washington" / "lei_to_nmls_mapping.csv"
HMDA_CLEAN = ROOT / "data" / "hmda" / "cleaned" / "county_market_summary.csv"
FDIC_WA = ROOT / "lib" / "fdic" / "data" / "washington.json"

DFI_VERIFY = "https://dfi.wa.gov/consumers/verify-license"
DFI_ENFORCEMENT = "https://dfi.wa.gov/enforcement-actions"
DFI_STATS = (
    "https://dfi.wa.gov/newsletter/winter-2026-division-consumer-services/"
    "division-consumer-services-stats-glance-december"
)
DFI_SPRING_2026 = (
    "https://dfi.wa.gov/newsletter/spring-2026-cs-newsletter/"
    "spring-2026-mortgage-and-consumer-loan-industry-update"
)
DFI_CONSUMER = "https://dfi.wa.gov/consumers"
DFI_FORECLOSURE = "https://dfi.wa.gov/consumers/foreclosure"
NMLS = "https://www.nmlsconsumeraccess.org/"
CFPB_API = "https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/"
CKAN = "https://data.wa.gov/api/3/action/package_search"

WA_COUNTY_NAMES = {
    "53001": "Adams",
    "53003": "Asotin",
    "53005": "Benton",
    "53007": "Chelan",
    "53009": "Clallam",
    "53011": "Clark",
    "53013": "Columbia",
    "53015": "Cowlitz",
    "53017": "Douglas",
    "53019": "Ferry",
    "53021": "Franklin",
    "53023": "Garfield",
    "53025": "Grant",
    "53027": "Grays Harbor",
    "53029": "Island",
    "53031": "Jefferson",
    "53033": "King",
    "53035": "Kitsap",
    "53037": "Kittitas",
    "53039": "Klickitat",
    "53041": "Lewis",
    "53043": "Lincoln",
    "53045": "Mason",
    "53047": "Okanogan",
    "53049": "Pacific",
    "53051": "Pend Oreille",
    "53053": "Pierce",
    "53055": "San Juan",
    "53057": "Skagit",
    "53059": "Skamania",
    "53061": "Snohomish",
    "53063": "Spokane",
    "53065": "Stevens",
    "53067": "Thurston",
    "53069": "Wahkiakum",
    "53071": "Walla Walla",
    "53073": "Whatcom",
    "53075": "Whitman",
    "53077": "Yakima",
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


def looks_company(text: str) -> bool:
    return bool(
        re.search(
            r"\b(llc|l\.l\.c|inc|corp|corporation|company|co\.|n\.a\.|national association|"
            r"bank|credit union|servicing|mortgage|lending|partners|group|holdings|"
            r"lp|llp|plc|fcu|na)\b",
            text,
            re.I,
        )
    )


def looks_person(text: str) -> bool:
    blob = re.sub(r"NMLS\s*#?\s*\d+", " ", text, flags=re.I)
    blob = re.sub(r"\b(llc|inc|corp|company|bank|credit union)\b", " ", blob, flags=re.I)
    return bool(re.search(r"\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b", blob))


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
    cleaned_names: dict[str, str] = {}
    if HMDA_CLEAN.exists():
        for r in csv.DictReader(HMDA_CLEAN.open(encoding="utf-8")):
            if (r.get("state") or "").upper() != "WA":
                continue
            fips = (r.get("county_fips") or "").strip()
            name = (r.get("county_name") or "").strip()
            if fips and name:
                cleaned_names[fips] = name

    rows = [r for r in csv.DictReader(HMDA_COUNTY.open(encoding="utf-8")) if (r.get("state") or "").upper() == "WA"]
    counties = []
    for r in rows:
        fips = (r.get("county_fips") or "").strip()
        name = (
            (r.get("county_name") or "").strip()
            or cleaned_names.get(fips)
            or WA_COUNTY_NAMES.get(fips)
        )
        if not name or name.startswith("53"):
            raise SystemExit(f"Washington county FIPS {fips} has no publishable name")
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
    return {
        "year": 2025,
        "geo_grain": "state_and_county",
        "state_code": "WA",
        "source": "Committed HMDA Washington partition data/hmda/by-state/WA/county_market_summary.csv. Properties located in Washington. Not a second national download.",
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
        "washington_county_universe": 39,
        "all_39_counties": len(counties) == 39,
        "counties": counties,
        "lei_reporter_rows": len(reporters),
        "lei_reporters_with_exact_nmls": sum(1 for r in reporters if r["nmls_id"]),
        "top_reporters_by_applications": reporters[:15],
        "denial_reasons": None,
        "denial_reasons_coverage": "Not present in the committed 2025 WA county summary extract.",
        "caveat": (
            "HMDA is a mortgage-application filing extract for properties located in Washington. "
            "It is not a Washington DFI license roster, not a quality ranking, and the denial rate "
            "does not prove discrimination. An HMDA reporter is not a Washington-licensed company. "
            "A Washington office or HQ on an HMDA reporter is geography, not licensing."
        ),
        "omitted": {
            "median_loan_amount": "Not present in the committed 2025 WA county summary extract.",
            "denial_reasons": "Not present in the committed 2025 WA county summary extract.",
        },
    }


def dfi_enforcement() -> dict:
    out = {
        "source": "Washington DFI Division of Consumer Services enforcement-actions HTML table",
        "agency": "Washington Department of Financial Institutions, Division of Consumer Services",
        "url": DFI_ENFORCEMENT,
        "grain": "enforcement_order",
        "identity_bar": "EXACT_NMLS_ONLY_FOR_ADVERSE_ATTACH",
    }
    collected: list[list[str]] = []
    pages_ok = 0
    for page in range(0, 40):
        url = DFI_ENFORCEMENT if page == 0 else f"{DFI_ENFORCEMENT}?page={page}"
        status, body = fetch(url, timeout=60)
        if status != 200 or len(body) < 200:
            break
        (RAW / f"dfi-enforcement-page-{page}.html").write_bytes(body[:800000])
        parser = SimpleTable()
        try:
            parser.feed(body.decode("utf-8", "replace"))
        except Exception:
            parser.rows = []
        rows = parser.rows
        if not rows:
            break
        header = [c.lower() for c in rows[0]]
        data_rows = rows[1:]
        if page == 0:
            out["header"] = rows[0]
        new = 0
        seen = {tuple(r[:2]) for r in collected}
        for r in data_rows:
            key = tuple(r[:2])
            if key in seen:
                continue
            collected.append(r)
            seen.add(key)
            new += 1
        pages_ok += 1
        if new == 0:
            break
    if not collected:
        out.update({"result": "SOURCE_NOT_ACQUIRED", "coverage_state": "SOURCE_NOT_ACQUIRED", "order_rows": 0})
        return out

    header = [c.lower() for c in (out.get("header") or [])]
    def col(*names: str) -> int:
        for i, h in enumerate(header):
            if any(n in h for n in names):
                return i
        return -1

    i_order = col("order")
    i_resp = col("respondent")
    i_type = col("type")
    i_act = col("act")
    i_date = col("date")

    types = Counter()
    acts = Counter()
    years = Counter()
    exact = 0
    name_only = 0
    company_rows = 0
    person_rows = 0
    mixed_rows = 0
    unresolved = 0
    distinct_nmls: set[str] = set()
    nmls_re = re.compile(r"NMLS\s*#?\s*(\d{3,12})", re.I)
    for rec in collected:
        order = rec[i_order] if i_order >= 0 and i_order < len(rec) else ""
        resp = rec[i_resp] if i_resp >= 0 and i_resp < len(rec) else " ".join(rec)
        typ = rec[i_type] if i_type >= 0 and i_type < len(rec) else ""
        act = rec[i_act] if i_act >= 0 and i_act < len(rec) else ""
        dated = rec[i_date] if i_date >= 0 and i_date < len(rec) else ""
        types[typ or "(blank native type)"] += 1
        acts[act or "(blank native act)"] += 1
        ym = re.search(r"(20\d{2})", dated)
        if ym:
            years[ym.group(1)] += 1
        ids = [normalize_nmls(m) for m in nmls_re.findall(resp)]
        ids = [x for x in ids if x]
        if ids:
            exact += 1
            distinct_nmls.update(ids)
            identity = "EXACT_NMLS"
        else:
            name_only += 1
            identity = "UNSAFE_NAME_ONLY"
        co = looks_company(resp)
        pe = looks_person(resp)
        if co and pe:
            mixed_rows += 1
        elif co:
            company_rows += 1
        elif pe:
            person_rows += 1
        else:
            unresolved += 1
        rec.append(identity)  # unused; counts only

    out.update(
        {
            "result": "ACQUIRED",
            "coverage_state": "ACQUIRED_BOUNDED_HTML_TABLE",
            "retrieved_at": now_iso(),
            "pages_fetched": pages_ok,
            "order_rows": len(collected),
            "exact_nmls_rows": exact,
            "name_only_rows": name_only,
            "distinct_exact_nmls": len(distinct_nmls),
            "company_rows": company_rows,
            "person_rows": person_rows,
            "mixed_company_person_rows": mixed_rows,
            "unresolved_class_rows": unresolved,
            "name_only_identity": "UNSAFE_FOR_ADVERSE_PROFILE_ATTACH",
            "nmls_person_vs_institution": (
                "NOT_SOURCE_TYPED — DFI table prints NMLS # in the respondent cell. "
                "It is not labeled NMLS_INSTITUTION vs NMLS_PERSON. Exact NMLS is kept at order-event grain only. "
                "MLO people are not published as a person directory."
            ),
            "native_type_distinct": len(types),
            "native_type_top": [{"key": k, "count": v} for k, v in types.most_common(20)],
            "native_act_top": [{"key": k, "count": v} for k, v in acts.most_common(15)],
            "order_year_trend": [{"year": y, "count": years[y]} for y in sorted(years)],
            "penalty_amount_present": False,
            "not_a_license_roster": True,
            "publication_eligibility": "PUBLIC_STATE_PAGE_AGGREGATES_ONLY",
            "caveat": (
                "A DFI order is not a CFPB complaint and is not a quality ranking. "
                "NOTICE is not a final order. Statement of Charges is not a final finding. "
                "Exact NMLS is required for adverse profile attachment. Name-only rows stay at event grain. "
                "This bounded HTML table is recent Consumer Services actions, not a complete historical bulk file. "
                "The 2025 year-end aggregate of 91 enforcement actions issued is a dated DFI statistic, not this table's row count."
            ),
        }
    )
    return out


def dfi_aggregates() -> dict:
    status, body = fetch(DFI_STATS, timeout=60)
    spring_status, spring_body = fetch(DFI_SPRING_2026, timeout=60)
    out = {
        "source": "DFI Division of Consumer Services Stats at a Glance",
        "url": DFI_STATS,
        "agency": "Washington Department of Financial Institutions",
        "label": "DFI year-end reported entities",
        "as_of": "2025-12-31",
        "http_status": status,
        "not_a_live_roster": True,
        "spring_2026_url": DFI_SPRING_2026,
        "spring_2026_http_status": spring_status,
    }
    if status == 200 and body:
        (RAW / "dfi-stats-glance-2025-12-31.html").write_bytes(body[:400000])
        text = strip_html(body)
        out["sha256"] = hashlib.sha256(body).hexdigest()

        def grab(label: str) -> int | None:
            m = re.search(rf"{re.escape(label)}\s+([0-9,]+)", text, re.I)
            if not m:
                return None
            return int(m.group(1).replace(",", ""))

        out.update(
            {
                "mortgage_brokers": grab("Mortgage Brokers"),
                "loan_originators_active": grab("Loan Originators - Active") or grab("Loan Originators – Active"),
                "loan_originators_inactive": grab("Loan Originators - Inactive") or grab("Loan Originators – Inactive"),
                "consumer_loan_companies": grab("Consumer Loan Companies"),
                "escrow_agents": grab("Escrow Agents"),
                "money_transmitters": grab("Money Transmitters"),
                "payday_lenders": grab("Payday Lenders"),
                "check_cashers_and_sellers": grab("Check Cashers and Sellers"),
                "enforcement_actions_issued_2025": grab("Enforcement Actions Issued"),
                "complaints_received_2025": grab("Complaints Received"),
                "result": "ACQUIRED",
                "coverage_state": "ACQUIRED_DATED_SNAPSHOT",
                "caveat": (
                    "Point-in-time DFI year-end reported entities as of December 31, 2025. "
                    "Not the current live Washington licensed-lender roster. "
                    "Loan originators are people and are not a company count and are not a public person directory. "
                    "Money transmitters and payday lenders are adjacent DFI classes, not added into a mortgage-company total."
                ),
            }
        )
    else:
        out.update({"result": "SOURCE_NOT_ACQUIRED", "coverage_state": "SOURCE_NOT_ACQUIRED"})
    if spring_status == 200 and spring_body:
        (RAW / "dfi-spring-2026-industry-update.html").write_bytes(spring_body[:400000])
        st = strip_html(spring_body)
        out["spring_2026_as_of"] = "2026-05"
        out["spring_2026_note"] = (
            "May 2026 DFI newsletter licensing numbers are a later dated aggregate, still not a live roster. "
            "Main-office vs branch rows are source-native and are not summed into one company denominator."
        )
        out["spring_2026_sha256"] = hashlib.sha256(spring_body).hexdigest()
        out["spring_2026_excerpt_present"] = "Mortgage Broker Main Office" in st
    return out


def cfpb_overlay() -> dict:
    params = urllib.parse.urlencode({"size": "5", "state": "WA", "product": "Mortgage"})
    status, body = fetch(f"{CFPB_API}?{params}", timeout=60)
    out = {
        "source": "CFPB Consumer Complaint Database API",
        "source_url": "https://www.consumerfinance.gov/data-research/consumer-complaints/",
        "product": "Mortgage",
        "geography": "WA",
        "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT" if status == 200 else "SOURCE_NOT_ACQUIRED",
        "http_status": status,
        "caveat": (
            "Complaint is not a violation. Raw complaint count is not a quality ranking and is not "
            "exposure-normalized. No company complaint rate is published without an exposure denominator."
        ),
        "company_rate_published": False,
        "canonical_company_snapshot": (
            "National CFPB company snapshot exists separately; this overlay is statewide Washington "
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
                "state": "WA",
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
    pages = {
        "wshfc_home": "https://www.wshfc.org/",
        "wshfc_buyers": "https://www.wshfc.org/buyers/",
        "here_home": "https://heretohome.org/",
        "dpa": "https://heretohome.org/downpayment-assistance/",
        "home_advantage": "https://heretohome.org/home-advantage/",
        "house_key": "https://heretohome.org/house-key-opportunity/",
        "covenant": "https://heretohome.org/covenant/",
        "veterans": "https://heretohome.org/veterans/",
        "homechoice": "https://heretohome.org/homechoice/",
        "education": "https://heretohome.org/homebuyer-education/",
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
    if has("dpa", "Home Advantage DPA") or has("home_advantage", "Home Advantage"):
        items.append(
            {
                "name": "Home Advantage / Home Advantage DPA",
                "agency": "Washington State Housing Finance Commission",
                "type": "first_mortgage_and_down_payment_assistance",
                "assistance": "Commission first mortgage with down-payment assistance options described on official Here to Home pages",
                "maximum": "Official Here to Home DPA page: Home Advantage DPA offers 3%, 4%, or 5% of the first-mortgage loan amount at 0% interest. Confirm current options with a participating lender.",
                "eligibility": "Official page: first-time homeownership is not required for Home Advantage DPA. Owner-occupied principal residence. Household income must not exceed the official statewide cap published on the page. Homebuyer education is part of the Commission path.",
                "income_purchase_limits": "Official DPA page lists a statewide household-income cap; confirm the current dollar figure on heretohome.org. Not restated here as a guaranteed underwriting limit.",
                "first_time_buyer": False,
                "participating_lender_required": True,
                "status": "Documented on official WSHFC / Here to Home pages retrieved this snapshot.",
                "source_url": pages["dpa"] if fetched["dpa"]["http_status"] == 200 else pages["wshfc_buyers"],
                "source_date": "Official page retrieval " + now_iso()[:10],
            }
        )
    if has("dpa", "Needs-Based") or has("home_advantage", "Needs-Based"):
        items.append(
            {
                "name": "Home Advantage Needs-Based DPA",
                "agency": "Washington State Housing Finance Commission",
                "type": "down_payment_assistance",
                "assistance": "Needs-based down-payment assistance paired with the Home Advantage first mortgage, as described on the official DPA page",
                "maximum": "Official DPA page: up to $10,000 at 1% simple interest. Confirm current terms with a participating lender.",
                "eligibility": "Lower household-income path than standard Home Advantage DPA, with county-group income figures on the official page. Eligibility is not approval.",
                "income_purchase_limits": "Official page publishes separate King/Snohomish vs other-county income figures. Confirm current tables on heretohome.org.",
                "first_time_buyer": False,
                "participating_lender_required": True,
                "status": "Documented on official Here to Home pages retrieved this snapshot.",
                "source_url": pages["dpa"],
                "source_date": "Official page retrieval " + now_iso()[:10],
            }
        )
    if has("house_key", "House Key") or has("dpa", "House Key Opportunity"):
        items.append(
            {
                "name": "House Key Opportunity",
                "agency": "Washington State Housing Finance Commission",
                "type": "first_mortgage_and_down_payment_assistance",
                "assistance": "Below-market first mortgage with House Key Opportunity DPA for eligible first-time buyers",
                "maximum": "Official DPA page: House Key Opportunity DPA of up to $15,000 at 1% simple interest. Acquisition-cost and income limits apply.",
                "eligibility": "Aimed at first-time buyers (or Target Area exceptions as published). Two income tests and acquisition-cost limits are described on official job aids. Confirm current county tables.",
                "income_purchase_limits": "County-group income and acquisition-cost limits are published by WSHFC and change. Confirm on official materials; not copied here as a guarantee.",
                "first_time_buyer": True,
                "participating_lender_required": True,
                "status": "Documented on official Here to Home pages retrieved this snapshot.",
                "source_url": pages["house_key"] if fetched["house_key"]["http_status"] == 200 else pages["dpa"],
                "source_date": "Official page retrieval " + now_iso()[:10],
            }
        )
    if has("covenant", "Covenant") or has("dpa", "Covenant Homeownership"):
        items.append(
            {
                "name": "Covenant Homeownership Program",
                "agency": "Washington State Housing Finance Commission",
                "type": "down_payment_assistance",
                "assistance": "Down-payment and closing-cost assistance loan described on official Covenant pages",
                "maximum": "Official program materials describe a 0% interest second loan; confirm current maximum and any forgiveness path on HeretoHome.org/Covenant.",
                "eligibility": "Specialized statutory eligibility tied to the Covenant Homeownership Act study. First-time homebuyer rules and income limits apply as published. Not a general statewide DPA substitute.",
                "income_purchase_limits": "County income limits are published on the official Covenant page. Confirm current figures.",
                "first_time_buyer": True,
                "participating_lender_required": True,
                "status": "Documented on official Here to Home / Covenant pages retrieved this snapshot.",
                "source_url": pages["covenant"] if fetched["covenant"]["http_status"] == 200 else pages["dpa"],
                "source_date": "Official page retrieval " + now_iso()[:10],
            }
        )
    if has("veterans", "Veteran") or has("dpa", "Veterans"):
        items.append(
            {
                "name": "WSHFC Veterans down-payment assistance",
                "agency": "Washington State Housing Finance Commission",
                "type": "down_payment_assistance",
                "assistance": "Veterans-specific down-payment assistance listed on the official Here to Home DPA page",
                "maximum": "Confirm current amount and pairing rules on the official Veterans program page. Not restated here as a guaranteed dollar award.",
                "eligibility": "Veteran / military eligibility as published by WSHFC. Program availability is not borrower approval.",
                "income_purchase_limits": "Confirm official income/purchase rules on the Veterans page.",
                "first_time_buyer": True,
                "participating_lender_required": True,
                "status": "Documented on official Here to Home pages retrieved this snapshot.",
                "source_url": pages["veterans"] if fetched["veterans"]["http_status"] == 200 else pages["dpa"],
                "source_date": "Official page retrieval " + now_iso()[:10],
            }
        )
    if has("homechoice", "HomeChoice") or has("dpa", "Home Choice") or has("dpa", "HomeChoice"):
        items.append(
            {
                "name": "HomeChoice",
                "agency": "Washington State Housing Finance Commission",
                "type": "down_payment_assistance",
                "assistance": "Specialized HomeChoice assistance listed on official Here to Home pages",
                "maximum": "Confirm current terms on the official HomeChoice page.",
                "eligibility": "Specialized eligibility as published by WSHFC. Not a general first-time-buyer guarantee.",
                "income_purchase_limits": "Confirm official tables.",
                "first_time_buyer": True,
                "participating_lender_required": True,
                "status": "Documented on official Here to Home pages retrieved this snapshot.",
                "source_url": pages["homechoice"] if fetched["homechoice"]["http_status"] == 200 else pages["dpa"],
                "source_date": "Official page retrieval " + now_iso()[:10],
            }
        )
    if has("education", "homebuyer education") or has("here_home", "homebuyer education") or has("wshfc_buyers", "education"):
        items.append(
            {
                "name": "WSHFC homebuyer education",
                "agency": "Washington State Housing Finance Commission",
                "type": "homebuyer_education",
                "assistance": "Required or recommended homebuyer education for Commission assistance programs",
                "maximum": "Not a dollar assistance product.",
                "eligibility": "Education completion is a program condition on official pages, not a loan approval.",
                "income_purchase_limits": "Not a loan product.",
                "first_time_buyer": None,
                "participating_lender_required": False,
                "status": "Documented on official WSHFC / Here to Home pages retrieved this snapshot.",
                "source_url": pages["education"] if fetched["education"]["http_status"] == 200 else pages["wshfc_buyers"],
                "source_date": "Official page retrieval " + now_iso()[:10],
            }
        )

    return {
        "retrieved_at": now_iso(),
        "pages": fetched,
        "application_path": (
            "WSHFC / Here to Home do not replace a mortgage underwriting decision. "
            "Buyers apply through a Commission-trained participating lender. "
            "Program participation is not a DFI license and is not a TrustHub endorsement. "
            "City or county local DPA is not inventoried on this state page."
        ),
        "items": items,
        "verified_family_count": len(items),
        "caveat": (
            "Program terms change. Eligibility is not guaranteed approval. "
            "Headline amounts are official-page formulas, not a promise of funds. "
            "Seattle / King / other local programs are out of scope."
        ),
    }


def bounded_roster_foreclosure() -> tuple[dict, dict, dict]:
    searches = {
        "dfi_roster": "DFI mortgage broker consumer loan license roster",
        "nmls_wa": "NMLS Washington mortgage company bulk download",
        "foreclosure": "Washington statewide foreclosure dataset",
        "servicing": "Washington mortgage servicer loan-level report",
        "mediation": "Washington foreclosure fairness mediation",
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

    verify_status, verify_body = fetch(DFI_VERIFY, timeout=40)
    fc_status, fc_body = fetch(DFI_FORECLOSURE, timeout=40)
    if verify_status == 200 and verify_body:
        (RAW / "dfi-verify-license.html").write_bytes(verify_body[:200000])
    if fc_status == 200 and fc_body:
        (RAW / "dfi-foreclosure.html").write_bytes(fc_body[:200000])

    roster = {
        "CURRENT_WASHINGTON_MORTGAGE_COMPANY_BULK_ROSTER": "SOURCE_NOT_ACQUIRED",
        "WASHINGTON_LIVE_COMPANY_ROSTER": "SOURCE_NOT_ACQUIRED / OPEN_SEARCH_ONLY",
        "live_licensed_company_denominator": "UNKNOWN",
        "nmls_consumer_access": "OPEN_SEARCH_ONLY — not scraped",
        "dfi_verify_license": {
            "url": DFI_VERIFY,
            "http_status": verify_status,
            "access": "OPEN_SEARCH_ONLY",
        },
        "ckan": results["dfi_roster"],
        "caveat": (
            "Missing live roster is unknown, not zero. Search-only is not zero. "
            "Do not display a fake current license count. "
            "DFI year-end reported entities are a dated snapshot, not this live denominator. "
            "NMLS Consumer Access and the DFI licensee database were not scraped."
        ),
    }
    servicing = {
        "result": "NO_EASY_STATEWIDE_SERVICING_REPORT",
        "dfi_exams_note": "DFI year-end stats include mortgage-servicing exam counts; that is not a loan-level statewide servicing file.",
        "ckan": results["servicing"],
        "caveat": "No easy statewide servicing performance report was acquired. Consumer Loan companies may service mortgages; that class is not a live servicer roster.",
    }
    fc_text = strip_html(fc_body) if fc_status == 200 else ""
    fc = {
        "STATEWIDE_STRUCTURED_FORECLOSURE_SOURCE_NOT_ACQUIRED": True,
        "dfi_foreclosure_page": {
            "url": DFI_FORECLOSURE,
            "http_status": fc_status,
            "mentions_foreclosure_fairness": "foreclosure fairness" in fc_text.lower() or "mediation" in fc_text.lower(),
        },
        "ckan": results["foreclosure"],
        "note": (
            "No county recorder, deed, or trustee-sale crawl was performed. "
            "Missing statewide foreclosure structure is unknown, not zero. "
            "A consumer foreclosure-help page is not a structured statewide dataset."
        ),
    }
    return roster, servicing, fc


def depository_overlay() -> dict:
    banks = []
    if FDIC_WA.exists():
        payload = json.loads(FDIC_WA.read_text(encoding="utf-8"))
        banks = payload.get("banks") or []
    return {
        "source": "Existing LenderTrustHub FDIC Washington overlay (lib/fdic/data/washington.json)",
        "fdic_cert_rows": len(banks),
        "identity": "FDIC CERT when source-native",
        "caveat": (
            "A Washington-headquartered FDIC-insured bank is a depository overlay, not a DFI mortgage-broker license. "
            "HMDA reporters include depositories and nonbanks. Do not call every HMDA reporter a DFI-licensed lender. "
            "NCUA credit-union overlay is not restated as a DFI class here."
        ),
        "coverage_state": "REUSED_EXISTING_NATIONAL_OVERLAY" if banks else "SOURCE_NOT_ACQUIRED",
    }


def regulator_matrix() -> list[dict]:
    return [
        {
            "credential": "HMDA reporter",
            "what": "Institution that filed HMDA loan/application records for Washington property location",
            "regulator": "CFPB / FFIEC HMDA",
            "proves": "Reported application/origination activity in this vintage",
            "does_not_prove": "Washington DFI license, current NMLS authority, or WSHFC program participation",
        },
        {
            "credential": "NMLS ID",
            "what": "Nationwide Multistate Licensing System identifier when source-native",
            "regulator": "NMLS (system of record display; not a Washington regulator)",
            "proves": "A stable identifier when printed by the source",
            "does_not_prove": "Current Washington authority by itself, or whether the ID is an institution, branch, or person",
        },
        {
            "credential": "Mortgage Broker",
            "what": "Company licensed under the Mortgage Broker Practices Act",
            "regulator": "Washington DFI Division of Consumer Services",
            "proves": "DFI mortgage-broker class as of a stated evidence clock when a live record is verified in NMLS Consumer Access",
            "does_not_prove": "HMDA reporter status, consumer-loan authority, or MLO person credential",
        },
        {
            "credential": "Consumer Loan Company",
            "what": "Company licensed under the Consumer Loan Act; may originate or service mortgage and non-mortgage consumer loans",
            "regulator": "Washington DFI Division of Consumer Services",
            "proves": "DFI consumer-loan class as of a stated evidence clock when verified in NMLS Consumer Access",
            "does_not_prove": "That the company is only a mortgage lender, or a live company census",
        },
        {
            "credential": "Mortgage Loan Originator",
            "what": "Individual originator licensed through NMLS and sponsored as applicable",
            "regulator": "Washington DFI via NMLS display",
            "proves": "Individual originator credential path when source-native",
            "does_not_prove": "A company license. This site does not publish an MLO person directory",
        },
        {
            "credential": "Escrow Agent",
            "what": "DFI-licensed escrow agent; verification may use the DFI Licensee Database rather than NMLS",
            "regulator": "Washington DFI",
            "proves": "Escrow-agent class when a live DFI record is verified",
            "does_not_prove": "Mortgage-broker or consumer-loan authority",
        },
        {
            "credential": "Depository Bank / Credit Union",
            "what": "Bank, savings bank, or credit union operating under a prudential charter",
            "regulator": "FDIC / NCUA / DFI Division of Banks or Credit Unions as applicable",
            "proves": "Charter identity when source-native (FDIC CERT, NCUA, RSSD)",
            "does_not_prove": "DFI mortgage-broker or consumer-loan license",
        },
        {
            "credential": "Mortgage servicer activity",
            "what": "Servicing of residential mortgage loans; often under the Consumer Loan Act when nonbank",
            "regulator": "Washington DFI Division of Consumer Services when licensed as a consumer-loan company",
            "proves": "Servicing activity only when a source-native license/order says so",
            "does_not_prove": "A complete current servicer roster. No loan-level statewide servicing file was acquired",
        },
        {
            "credential": "Money Transmitter",
            "what": "DFI money-transmitter class listed on year-end stats; adjacent, not a mortgage-company substitute",
            "regulator": "Washington DFI",
            "proves": "Year-end reported money-transmitter count when cited as such",
            "does_not_prove": "Mortgage-broker authority. Not added into a lender total",
        },
        {
            "credential": "Program participating lender",
            "what": "Appears on a WSHFC / Here to Home participating-lender path",
            "regulator": "Washington State Housing Finance Commission",
            "proves": "Program-participation listing as of page retrieval",
            "does_not_prove": "DFI license, endorsement, or TrustHub recommendation",
        },
    ]


def public_contacts(enf: dict) -> dict:
    return {
        "policy": "Official/public business sources only. No internet enrichment. No person contact information.",
        "dfi_orders_phone": 0,
        "dfi_orders_email": 0,
        "dfi_orders_website": 0,
        "dfi_orders_address": 0,
        "dfi_orders_contact_note": "DFI enforcement HTML table has no phone, email, website, or address fields.",
        "caveat": "Zero contact fields from search-only license pages is a coverage gap, not a finding that Washington lenders have no phones.",
    }


def main() -> None:
    hmda = hmda_block()
    enf = dfi_enforcement()
    agg = dfi_aggregates()
    programs_block = programs()
    cfpb = cfpb_overlay()
    roster, servicing, fc = bounded_roster_foreclosure()
    depository = depository_overlay()
    contacts = public_contacts(enf)
    if not programs_block["items"]:
        raise SystemExit("Publication gate: at least one current Washington program family must be verified from official pages")
    if hmda["applications"] <= 0 or hmda["originations"] <= 0:
        raise SystemExit("Publication gate: HMDA Washington metrics missing")
    snapshot = {
        "contract_name": "lender-wa-state-intel-v1",
        "version": "1.0.0",
        "geography": "WA",
        "publication_status": "published",
        "path": "/washington",
        "generated_at": now_iso(),
        "source_as_of": {
            "hmda": "HMDA 2025",
            "dfi_enforcement": enf.get("retrieved_at") or "SOURCE_NOT_ACQUIRED",
            "dfi_year_end_aggregates": agg.get("as_of"),
            "programs": programs_block.get("retrieved_at"),
            "cfpb": cfpb.get("retrieved_at") or "SOURCE_NOT_ACQUIRED",
            "live_roster": "SOURCE_NOT_ACQUIRED",
        },
        "hero": {
            "universe_label": "HMDA applications",
            "universe_value": hmda["applications"],
            "universe_hint": "2025 HMDA applications for properties located in Washington. Not a count of Washington-licensed mortgage companies.",
            "current_label": "HMDA originations",
            "current_value": hmda["originations"],
            "observations_label": "DFI Consumer Services enforcement table rows",
            "observations_value": enf.get("order_rows") or 0,
            "geography_label": "Counties in HMDA geography",
            "geography_value": hmda["county_count"],
            "as_of_label": "HMDA vintage",
            "as_of_value": "2025",
        },
        "hmda": hmda,
        "dfi_enforcement": enf,
        "dfi_aggregates": agg,
        "programs": programs_block,
        "live_roster": roster,
        "cfpb": cfpb,
        "servicing": servicing,
        "foreclosure": fc,
        "depository": depository,
        "public_contacts": contacts,
        "regulator_matrix": regulator_matrix(),
        "gaps": [
            "No current complete Washington mortgage-company bulk roster was acquired. Live licensed-company denominator is UNKNOWN, not zero.",
            "Complete MLO person universe is not published and was not scraped from NMLS.",
            "Complete current servicer roster was not acquired.",
            "Name-only DFI enforcement rows cannot be attached to lender profiles.",
            "DFI HTML table NMLS IDs are not source-typed as institution vs person vs branch.",
            "NMLS Consumer Access remains search-only. Not scraped.",
            "DFI Licensee Database remains search-only. Not scraped.",
            "No complete state consumer-complaint census beyond CFPB mortgage overlay and DFI year-end complaint totals.",
            "Live license status for each HMDA reporter is unknown.",
            "No easy statewide servicing performance report was acquired.",
            "STATEWIDE_STRUCTURED_FORECLOSURE_SOURCE_NOT_ACQUIRED. No county recorder crawl.",
            "Company-level CFPB complaint exposure denominators are not computed.",
            "DFI year-end reported entities as of 2025-12-31 are not a live roster.",
        ],
        "identity_rules": {
            "EXACT": ["NMLS when source-native on the DFI order row", "HMDA LEI", "FDIC CERT when source-native"],
            "EXACT_OTHER_OFFICIAL_ID": "FDIC CERT / RSSD / NCUA when source-native and not used to infer DFI authority",
            "REVIEW_REQUIRED": "program lender names without source-native NMLS",
            "UNSAFE": "name-only DFI orders — not used for adverse profile attachment",
        },
        "semantic_guardrails": [
            "HMDA is not a license roster",
            "HMDA reporter is not a Washington-licensed company",
            "NMLS ID is not current Washington authority by itself",
            "MLO person is not a lender company",
            "DFI year-end count is not a live roster",
            "Application is not origination",
            "Denial is not misconduct",
            "Denial rate is not quality",
            "Complaint is not a violation",
            "Order is not a complaint",
            "Statement of Charges is not a final finding",
            "Name-only adverse match is unsafe",
            "Program eligibility is not approval",
            "Missing is not zero",
            "Search-only is not zero",
            "No Trust Score",
            "No paid ranking",
        ],
    }
    canonical = json.dumps(snapshot, sort_keys=True, separators=(",", ":"))
    snapshot["fingerprint"] = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    text = json.dumps(snapshot, indent=2) + "\n"
    (ART / "wa-lend-001-public-snapshot.json").write_text(text, encoding="utf-8")
    (LIB / "accepted-snapshot.json").write_text(text, encoding="utf-8")
    print(
        json.dumps(
            {
                "fingerprint": snapshot["fingerprint"],
                "apps": hmda["applications"],
                "orig": hmda["originations"],
                "den": hmda["denials"],
                "counties": hmda["county_count"],
                "all_39": hmda["all_39_counties"],
                "dfi_orders": enf.get("order_rows"),
                "dfi_nmls": enf.get("exact_nmls_rows"),
                "dfi_name_only": enf.get("name_only_rows"),
                "brokers": agg.get("mortgage_brokers"),
                "clc": agg.get("consumer_loan_companies"),
                "mlo_active": agg.get("loan_originators_active"),
                "programs": len(programs_block["items"]),
                "cfpb": cfpb.get("mortgage_complaint_rows"),
                "roster": roster["WASHINGTON_LIVE_COMPANY_ROSTER"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

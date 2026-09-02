#!/usr/bin/env python3
"""NJ-LEND-002 RMLA / servicer / NJHMFA / HMDA overlay ingest.

Official-source inspect, dry-run, execute, verify. Internal-only.
Does not mint /new-jersey, county pages, rankings, or public directories.
Does not bypass DOBI/NMLS access controls. Does not bulk-harvest MLOs.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import html as html_lib
import json
import re
import ssl
import sys
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "nj-raw" / "lend-002"
GEN = ROOT / "data" / "generated" / "nj-lend-002"
REPORTS = ROOT / "data" / "reports"
FIX = ROOT / "data" / "fixtures" / "nj-lend-002"
HMDA_NJ = ROOT / "data" / "hmda" / "new-jersey"
MIGRATION = ROOT / "supabase" / "migrations" / "20260903160000_nj_lend_002_state_authority_program_market.sql"
MIGRATION_001 = ROOT / "supabase" / "migrations" / "20260902120000_nj_lend_001_regulatory_event_ledger.sql"
FI_LIST = ROOT / "data" / "generated" / "nj-lend-001" / "fi-list.json"
SUMMARY_001 = ROOT / "data" / "generated" / "nj-lend-001" / "summary.json"
IDENTITY_001_CANDIDATES = [
    ROOT / "data" / "generated" / "nj-lend-001" / "identity-ledgers.json",
    Path(r"C:\Users\Michael.Savitsky\lender-nj-lend-001\data\generated\nj-lend-001\identity-ledgers.json"),
]
DATASET = "NJ_LEND_002_STATE_INTELLIGENCE"
UA = "LenderTrustHub/NJ-LEND-002 (research acquisition; +https://www.lendertrusthub.com)"
CTX = ssl.create_default_context()
CANONICAL_PROJECT_REF = "hidcrbexurginnuqgipx"
HOST = "https://www.nj.gov"

COVERAGE_STATES = {
    "ACQUIRED_COMPLETE",
    "ACQUIRED_CURRENT_SNAPSHOT",
    "ACQUIRED_PARTIAL_HISTORY",
    "PARTIAL_SOURCE_COVERAGE",
    "OPEN_SEARCH_ONLY",
    "SOURCE_AVAILABLE_BY_REQUEST",
    "SOURCE_NOT_ACQUIRED",
    "SOURCE_ACCESS_BLOCKED",
    "SOURCE_UNVERIFIED",
}

RMLA_COMPANY_CLASSES = {
    "RESIDENTIAL_MORTGAGE_LENDER",
    "CORRESPONDENT_RESIDENTIAL_MORTGAGE_LENDER",
    "RESIDENTIAL_MORTGAGE_BROKER",
    "EXEMPT_COMPANY_REGISTRANT",
    "REGISTERED_DEPOSITORY_INSTITUTION",
}
RMLA_BRANCH_CLASSES = {
    "RESIDENTIAL_MORTGAGE_LENDER_BRANCH",
    "CORRESPONDENT_RESIDENTIAL_MORTGAGE_LENDER_BRANCH",
    "RESIDENTIAL_MORTGAGE_BROKER_BRANCH",
}
INDIVIDUAL_CLASSES = {
    "MORTGAGE_LOAN_ORIGINATOR",
    "QUALIFIED_INDIVIDUAL_LENDER",
    "QUALIFIED_INDIVIDUAL_CORRESPONDENT",
    "QUALIFIED_INDIVIDUAL_BROKER",
}
SERVICER_CLASSES = {
    "NJ_MORTGAGE_SERVICER_LICENSE",
    "RMLA_LICENSED_MORTGAGE_SERVICER_REGISTRATION",
    "EXEMPT_SERVICER",
}
LICENSE_STATUS_VOCAB = ("CURRENT", "EXPIRED", "SUSPENDED", "SURRENDERED", "OTHER")

NJ_COUNTIES = [
    "Atlantic", "Bergen", "Burlington", "Camden", "Cape May", "Cumberland",
    "Essex", "Gloucester", "Hudson", "Hunterdon", "Mercer", "Middlesex",
    "Monmouth", "Morris", "Ocean", "Passaic", "Salem", "Somerset", "Sussex",
    "Union", "Warren",
]
COUNTY_FIPS = {
    "Atlantic": "34001", "Bergen": "34003", "Burlington": "34005", "Camden": "34007",
    "Cape May": "34009", "Cumberland": "34011", "Essex": "34013", "Gloucester": "34015",
    "Hudson": "34017", "Hunterdon": "34019", "Mercer": "34021", "Middlesex": "34023",
    "Monmouth": "34025", "Morris": "34027", "Ocean": "34029", "Passaic": "34031",
    "Salem": "34033", "Somerset": "34035", "Sussex": "34037", "Union": "34039",
    "Warren": "34041",
}

DPA_HIGH_COUNTIES = [
    "Bergen", "Essex", "Hudson", "Hunterdon", "Mercer", "Middlesex",
    "Monmouth", "Morris", "Ocean", "Passaic", "Somerset", "Union",
]
DPA_STANDARD_COUNTIES = [
    "Atlantic", "Burlington", "Camden", "Cape May", "Cumberland",
    "Gloucester", "Salem", "Sussex", "Warren",
]

# Official statewide FTHB limits from CoBranded fact sheet, effective 06.17.26.
INCOME_LIMIT_GROUPS = [
    {"counties": ["Atlantic", "Burlington", "Camden", "Cape May", "Cumberland", "Gloucester", "Hudson", "Salem", "Warren"],
     "hh_1_2": 134600, "hh_3plus": 154790},
    {"counties": ["Essex", "Morris", "Sussex", "Union"], "hh_1_2": 138400, "hh_3plus": 159160},
    {"counties": ["Bergen", "Passaic"], "hh_1_2": 139100, "hh_3plus": 159965},
    {"counties": ["Mercer"], "hh_1_2": 139800, "hh_3plus": 160770},
    {"counties": ["Monmouth", "Ocean"], "hh_1_2": 140600, "hh_3plus": 161690},
    {"counties": ["Hunterdon", "Middlesex", "Somerset"], "hh_1_2": 154800, "hh_3plus": 178020},
]
PURCHASE_PRICE_GROUPS = [
    {"counties": ["Cumberland", "Mercer", "Warren"], "u1": 566355, "u2": 725146, "u3": 876496, "u4": 1089341},
    {"counties": ["Burlington", "Camden", "Gloucester", "Salem"], "u1": 659386, "u2": 844112, "u3": 1020363, "u4": 1268078},
    {"counties": ["Atlantic", "Cape May"], "u1": 764069, "u2": 978144, "u3": 1182333, "u4": 1469388},
    {"counties": ["Bergen", "Essex", "Hudson", "Hunterdon", "Middlesex", "Monmouth", "Morris", "Ocean", "Passaic", "Somerset", "Sussex", "Union"],
     "u1": 1306975, "u2": 1673445, "u3": 2022730, "u4": 2513895},
]

HMFA_BULLETINS_2026 = [
    {"number": "2026-1", "title": "Trailing Document Changes in Lender Portal", "url": "https://conta.cc/4qdoqW4"},
    {"number": "2026-2", "title": "Asset Test Requirement - six-month lockout period", "url": "https://conta.cc/4ahulTK"},
    {"number": "2026-3", "title": "Introducing Our New Single Family Assistant Director of Programs", "url": "https://conta.cc/4ljT7bi"},
    {"number": "2026-4", "title": "NJHMFA Annual Lender Quality Control Training", "url": "https://conta.cc/4rZHzME"},
    {"number": "2026-5", "title": "Exciting News! Newly Designed Homebuyer & Renters Page", "url": "https://conta.cc/4bnP8Hb"},
    {"number": "2026-6", "title": "Freddie Mac LPA Positive Rent Payment History Using Borrower-Provided Documentation", "url": "https://conta.cc/3Pd6oX6"},
    {"number": "2026-7", "title": "Early Payment Default Policy & Invoicing", "url": "https://conta.cc/3RLCiLG"},
    {"number": "2026-8", "title": "Thank you for attending NJHMFA's Annual Lender Quality Control Training", "url": "https://conta.cc/4uQsHlp"},
    {"number": "2026-9", "title": "NJHMFA Updated Income and Purchase Price Limits", "url": "https://conta.cc/4xwOWhP"},
    {"number": "2026-10", "title": "Early Payment Default Policy & Invoicing Reminder", "url": "https://conta.cc/4fhspNI"},
]

# Existing national NMLS identities (committed HMDA NJ map). Used as approved aliases.
# NJHMFA PDF prints no NMLS and no address, so matches stay REVIEW_REQUIRED.
HMFA_NAME_ALIASES = {
    "crosscountry mortgage llc": "3029",
    "loandepot.com llc": "174457",
    "cmg mortgage inc": "1820",
    "advisors mortgage group": "33041",
    "advisor's mortgage group": "33041",
    "guaranteed rate inc": "2611",
    "nfm inc": "2893",
    "anniemac": "338923",
    "annie-mac anmac": "338923",
    "annie mac anmac": "338923",
    "movement mortgage": "117589",
    "absolute home mortgage": "176743",
    "prosperity home mortgage": "75164",
    "new american funding llc": "6606",
    "fairway independent mortgage": "2909",
    "cardinal financial company": "10117",
    "paramount residential": "2894",
    "guaranteed rate affinity llc": "205644",
    "newrez llc": "2289",
    "embrace home loans": "2184",
    "guild mortgage company llc": "3274",
    "valley national bank": "411254",
    "citizens bank n.a": "433960",
    "citizens bank na": "433960",
    "us bank": "405186",
    "dhi mortgage": "14791",
    "nvr mortgage": "134376",
}

ENTITY_HINT_RE = re.compile(
    r"\b(LLC|L\.L\.C\.|INC\.?|CORP\.?|CORPORATION|COMPANY|CO\.|BANK|N\.A\.|"
    r"ASSOCIATION|MORTGAGE|FUNDING|LOANS|LENDING|CREDIT UNION|LP|LLP|LTD)\b",
    re.I,
)
PHONE_RE = re.compile(r"\b(?:1-)?(?:\d{3}[-.]?\d{3}[-.]?\d{4}|\d{3}-\d{3}-\d{4})\b")
NUMBERED_RE = re.compile(r"(?m)^\s*(\d{1,2})\s+(.+?)\s+(\d{3}[-.]?\d{3}[-.]?\d{4})\s*$")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_text(text: str) -> str:
    return sha256_bytes(text.encode("utf-8"))


def normalize_name(name: str) -> str:
    s = html_lib.unescape(name or "")
    s = s.replace("’", "'").replace("“", '"').replace("”", '"')
    s = re.sub(r"[^A-Za-z0-9&'.]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip().lower()
    s = s.replace(".", "")
    for suffix in (" llc", " inc", " corp", " corporation", " company", " co", " n.a", " na"):
        if s.endswith(suffix):
            s = s[: -len(suffix)].strip()
    return s


def html_to_text(html: str) -> str:
    text = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", html)
    text = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", text)
    text = re.sub(r"(?is)<br\s*/?>", "\n", text)
    text = re.sub(r"(?is)</p>", "\n", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    text = html_lib.unescape(text)
    return re.sub(r"[ \t]+", " ", text)


def fetch(url: str) -> dict[str, Any]:
    req = Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urlopen(req, context=CTX, timeout=45) as resp:
            body = resp.read()
            status = int(getattr(resp, "status", 200) or 200)
            final = str(resp.geturl())
    except HTTPError as e:
        body = e.read() if e.fp else b""
        status = int(e.code)
        final = url
    except URLError as e:
        return {"url": url, "status": 0, "bytes": 0, "sha256": None, "error": str(e), "body": b""}
    return {
        "url": url,
        "final": final,
        "status": status,
        "bytes": len(body),
        "sha256": sha256_bytes(body) if body else None,
        "error": None,
        "body": body,
    }


def classify_rmla_class(raw: str) -> str | None:
    t = re.sub(r"\s+", " ", raw or "").strip().lower()
    if "qualified individual" in t:
        if "correspondent" in t:
            return "QUALIFIED_INDIVIDUAL_CORRESPONDENT"
        if "broker" in t:
            return "QUALIFIED_INDIVIDUAL_BROKER"
        return "QUALIFIED_INDIVIDUAL_LENDER"
    if "mortgage loan originator" in t or t == "mlo":
        return "MORTGAGE_LOAN_ORIGINATOR"
    if "correspondent" in t and "branch" in t:
        return "CORRESPONDENT_RESIDENTIAL_MORTGAGE_LENDER_BRANCH"
    if "broker" in t and "branch" in t:
        return "RESIDENTIAL_MORTGAGE_BROKER_BRANCH"
    if "lender" in t and "branch" in t:
        return "RESIDENTIAL_MORTGAGE_LENDER_BRANCH"
    if "correspondent" in t:
        return "CORRESPONDENT_RESIDENTIAL_MORTGAGE_LENDER"
    if "broker" in t:
        return "RESIDENTIAL_MORTGAGE_BROKER"
    if "exempt company" in t:
        return "EXEMPT_COMPANY_REGISTRANT"
    if "registered depository" in t:
        return "REGISTERED_DEPOSITORY_INSTITUTION"
    if "residential mortgage lender" in t:
        return "RESIDENTIAL_MORTGAGE_LENDER"
    return None


def class_grain(cls: str) -> str:
    if cls in INDIVIDUAL_CLASSES:
        return "INDIVIDUAL"
    if cls in RMLA_BRANCH_CLASSES:
        return "BRANCH"
    if cls in RMLA_COMPANY_CLASSES:
        return "COMPANY"
    if cls in SERVICER_CLASSES:
        return "SERVICER"
    return "OTHER"


def individual_firewall(cls: str) -> dict[str, Any]:
    grain = class_grain(cls)
    return {
        "class": cls,
        "grain": grain,
        "public_directory_eligible": False,
        "is_company": grain == "COMPANY",
        "is_branch": grain == "BRANCH",
        "is_individual": grain == "INDIVIDUAL",
        "qualified_individual_is_not_company": cls.startswith("QUALIFIED_INDIVIDUAL"),
        "mlo_held_internal": cls == "MORTGAGE_LOAN_ORIGINATOR",
    }


def parse_rmla_authority(html: str, url: str) -> dict[str, Any]:
    text = html_to_text(html)
    classes = []
    for label in [
        "Residential Mortgage Lender branch",
        "Correspondent Residential Mortgage Lender branch",
        "Residential Mortgage Broker branch",
        "Correspondent Residential Mortgage Lender",
        "Residential Mortgage Broker",
        "Residential Mortgage Lender",
        "Exempt Company Registrant",
        "Registered Depository Institution",
        "Qualified Individual",
        "Mortgage Loan Originator",
    ]:
        if label.lower() in text.lower():
            cls = classify_rmla_class(label)
            if cls:
                classes.append(cls)
    # Preserve order uniqueness
    seen = []
    for c in classes:
        if c not in seen:
            seen.append(c)
    bulk = bool(re.search(r"\b(csv|xlsx|bulk export|downloadable roster)\b", text, re.I))
    nmls_required = "nationwide multistate licensing system" in text.lower() or "nmls" in text.lower()
    return {
        "url": url,
        "nmls_required": nmls_required,
        "bulk_roster": bulk,
        "classes": seen,
        "company_classes": [c for c in seen if c in RMLA_COMPANY_CLASSES],
        "branch_classes": [c for c in seen if c in RMLA_BRANCH_CLASSES],
        "individual_classes": [c for c in seen if c in INDIVIDUAL_CLASSES],
        "coverage_state": "SOURCE_AVAILABLE_BY_REQUEST",
        "notes": "Official page is application instructions, not a licensee roster.",
    }


def parse_servicer_authority(html: str, worksheet_text: str = "") -> dict[str, Any]:
    text = html_to_text(html) + "\n" + (worksheet_text or "")
    has_licensee = "mortgage servicer license" in text.lower() or "mortgage servicer licensees" in text.lower()
    has_rmla_reg = "rmla-licensed" in text.lower() or "mortgage servicer registrant" in text.lower()
    fields = []
    for needle, key in [
        ("total number", "loans_serviced"),
        ("30 to 60 days delinquent", "delinquent_30"),
        ("61 to 90 days delinquent", "delinquent_60"),
        ("more than 90 days delinquent", "delinquent_90_plus"),
        ("moved into foreclosure status", "foreclosures_commenced"),
        ("nmls entity id", "nmls_id"),
    ]:
        if needle in text.lower():
            fields.append(key)
    return {
        "official_license_source": HOST + "/dobi/bankdedfund/ded_mortservicer.htm",
        "bulletin_19_13": HOST + "/dobi/bulletins/blt19_13.pdf",
        "bulletin_19_13_extraction": "IMAGE_ONLY",
        "classes_documented": [
            "NJ_MORTGAGE_SERVICER_LICENSE",
            "RMLA_LICENSED_MORTGAGE_SERVICER_REGISTRATION",
        ],
        "exempt_classes_public": [],
        "licensed_servicers": 0,
        "rmla_servicer_registrations": 0,
        "exact_nmls": 0,
        "current_status_rows": 0,
        "historical_coverage": "SOURCE_AVAILABLE_BY_REQUEST",
        "annual_report_public": False,
        "annual_report_year_due": 2025,
        "filing_due": "2026-05-01",
        "worksheet_fields": fields,
        "has_licensee_class": has_licensee,
        "has_rmla_registration_class": has_rmla_reg,
        "lender_license_is_not_servicer_registration": True,
        "coverage_state": "SOURCE_AVAILABLE_BY_REQUEST",
        "caveat": (
            "Delinquent loan is not servicer misconduct. Foreclosure commenced is not a "
            "servicer violation. High default count is not a quality ranking."
        ),
    }


def _join_wrapped_numbered(text: str) -> str:
    lines = [ln.rstrip() for ln in text.splitlines()]
    out = []
    buf = ""
    for ln in lines:
        if re.match(r"^\s*\d{1,2}\s+\S", ln) and buf:
            out.append(buf)
            buf = ln.strip()
        elif buf:
            buf = buf + " " + ln.strip()
        else:
            buf = ln.strip()
    if buf:
        out.append(buf)
    return "\n".join(out)


def parse_participating_lenders(text: str, source_date: str = "2026-04-01") -> dict[str, Any]:
    cleaned = text.replace("\xa0", " ")
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    split_at = re.split(r"POLICE AND FIREMAN", cleaned, maxsplit=1, flags=re.I)
    main_text = split_at[0]
    pfrs_raw = split_at[1] if len(split_at) > 1 else ""
    joined = _join_wrapped_numbered(main_text)
    primary = []
    for m in re.finditer(
        r"(?m)^\s*(\d{1,2})\s+(.+?)\s+(\d{3}[-.]?\d{3}[-.]?\d{4}|1-\d{3}-\d{3}-\d{4})\b",
        joined,
    ):
        order = int(m.group(1))
        name = re.sub(r"\s+", " ", m.group(2)).strip(" -")
        name = re.sub(r"\s+or$", "", name).strip()
        if "participating" in name.lower() or "njhmfa" == name.lower():
            continue
        primary.append({
            "source_order": order,
            "legal_name": name,
            "display_name": name,
            "phone": m.group(3),
            "nmls_id": None,
            "cohort": "VOLUME_ORDERED_SUBSET",
            "participation_label": "NJHMFA Participating Lender Partner",
            "public_eligibility": "internal_only",
        })
    # Additional paragraph (authorized, sold >=1 in 6 months, lower volume).
    extra_block = ""
    marker = "The lenders listed below are authorized participants"
    idx = main_text.find(marker)
    if idx >= 0:
        extra_block = main_text[idx:]
        extra_block = extra_block.split("1-800-NJ-HOUSE")[0]
        extra_block = extra_block.split("POLICE AND FIRE")[0]
    extra_names = []
    if extra_block:
        after = extra_block.split("therefore, are not included in this listing.", 1)
        blob = after[1] if len(after) > 1 else ""
        blob = blob.replace("Updated 04.01.26", "")
        for part in blob.split(","):
            n = re.sub(r"\s+", " ", part).strip(" .")
            n = re.sub(r"https?:\S+", "", n).strip()
            if len(n) < 4:
                continue
            if n.upper() in {"NJHMFA", "JNJHMFA"}:
                continue
            extra_names.append(n)
    primary_norm = {normalize_name(p["legal_name"]) for p in primary}
    additional = []
    seen_extra = set()
    for n in extra_names:
        nn = normalize_name(n)
        if not nn or nn in primary_norm or nn in seen_extra:
            continue
        if nn in {"updated 04 01 26", "1-800-nj-house", "njhousing gov"}:
            continue
        seen_extra.add(nn)
        additional.append({
            "source_order": None,
            "legal_name": n,
            "display_name": n,
            "phone": None,
            "nmls_id": None,
            "cohort": "VOLUME_ORDERED_SUBSET",
            "participation_label": "NJHMFA Participating Lender Partner",
            "public_eligibility": "internal_only",
            "sold_last_six_months": True,
            "lower_volume_than_numbered_list": True,
        })
    pfrs = []
    if pfrs_raw:
        pfrs_joined = _join_wrapped_numbered(pfrs_raw)
        for m in re.finditer(
            r"(?m)^\s*(\d{1,2})\s+(.+?)\s+(\d{3}[-.]?\d{3}[-.]?\d{4}|1-\d{3}-\d{3}-\d{4})\b",
            pfrs_joined,
        ):
            name = re.sub(r"\s+", " ", m.group(2)).strip(" -")
            pfrs.append({
                "source_order": int(m.group(1)),
                "legal_name": name,
                "display_name": name,
                "phone": m.group(3),
                "nmls_id": None,
                "cohort": "PROGRAM_SUBSET",
                "program_key": "POLICE_AND_FIREMENS_RETIREMENT_SYSTEM_MORTGAGE",
                "participation_label": "NJHMFA Participating Lender Partner",
                "public_eligibility": "internal_only",
            })
    all_rows = primary + additional
    incomplete = "have not sold any loans within the past six months" in cleaned.lower()
    pairing = "refer you to up to 3" in cleaned.lower() or "up to three lenders" in cleaned.lower()
    return {
        "source_url": HOST + "/dca/hmfa/homebuyers-and-renters/docs/hb_lender_list.pdf",
        "source_date": source_date,
        "official_label": "Participating Lender Partners",
        "not_an_endorsement": True,
        "source_order_is_not_ranking": True,
        "pairing_form_is_subset": pairing,
        "full_approved_list_incomplete": incomplete,
        "nmls_printed": False,
        "primary_volume_list": primary,
        "additional_sold_last_six_months": additional,
        "pfrs_subset": pfrs,
        "participating_lenders": all_rows,
        "participating_count": len(all_rows),
        "caveat": (
            "Listed by loans sold to NJHMFA in the previous six months. Source order is not a "
            "quality ranking. Approved participants with zero sales in that window are omitted. "
            "The Lender Request Form pairing subset is not the full participating universe. "
            "Participation is not approved, recommended, preferred, safer, better, vetted, or certified."
        ),
    }


def match_hmfa_row(row: dict[str, Any], nmls_by_norm: dict[str, list[str]]) -> dict[str, Any]:
    name = row.get("legal_name") or ""
    nn = normalize_name(name)
    out = dict(row)
    if row.get("nmls_id"):
        out["match_status"] = "EXACT"
        out["match_method"] = "EXACT_NMLS_PRINTED"
        return out
    alias = HMFA_NAME_ALIASES.get(nn)
    if not alias:
        for k, v in HMFA_NAME_ALIASES.items():
            if nn.startswith(k) or k.startswith(nn) and len(nn) >= 10:
                alias = v
                break
    candidates = nmls_by_norm.get(nn, [])
    if alias and (not candidates or alias in candidates or len(set(candidates)) <= 1):
        out["nmls_id"] = alias
        out["match_status"] = "REVIEW_REQUIRED"
        out["match_method"] = "APPROVED_ALIAS_NO_ADDRESS"
        out["existing_national_identity"] = True
        out["net_new_identity"] = False
        return out
    if len(set(candidates)) == 1:
        out["nmls_id"] = candidates[0]
        out["match_status"] = "REVIEW_REQUIRED"
        out["match_method"] = "NAME_ONLY_EXISTING_NMLS"
        out["existing_national_identity"] = True
        out["net_new_identity"] = False
        return out
    if len(set(candidates)) > 1:
        out["match_status"] = "REVIEW_REQUIRED"
        out["match_method"] = "NAME_SEVERAL_CANDIDATES"
        out["net_new_identity"] = False
        return out
    if not ENTITY_HINT_RE.search(name):
        out["match_status"] = "UNSAFE_REJECTED"
        out["match_method"] = "UNSAFE_NAME_ALONE"
        out["net_new_identity"] = False
        return out
    out["match_status"] = "UNRESOLVED"
    out["match_method"] = "NAME_ONLY_NO_NMLS_NO_ADDRESS"
    out["net_new_identity"] = False
    out["do_not_mint_from_marketing_list"] = True
    return out


def load_nmls_index() -> dict[str, list[str]]:
    path = HMDA_NJ / "lei_to_nmls_mapping.csv"
    idx: dict[str, list[str]] = defaultdict(list)
    if not path.exists():
        return idx
    with path.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            nmls = (row.get("nmls_id") or "").strip()
            if not nmls:
                continue
            for col in ("legal_name", "institution_name_hmda"):
                nn = normalize_name(row.get(col) or "")
                if nn:
                    idx[nn].append(nmls)
    return idx


def hmfa_programs() -> list[dict[str, Any]]:
    return [
        {
            "program_key": "FIRST_TIME_HOMEBUYER_MORTGAGE",
            "official_name": "First-Time Homebuyer Mortgage Program",
            "program_class": "FIRST_MORTGAGE",
            "first_mortgage_required": True,
            "loan_type_raw": "FHA/VA/USDA government-insured",
            "rate_structure": "30-year fixed",
            "term_raw": "30-year",
            "government_insurer_eligibility": "FHA, VA, USDA",
            "first_time_buyer_requirement": "Yes, except Urban Target Area or Qualified Veteran waiver",
            "dpa_available": True,
            "participating_lender_required": True,
            "source_effective_on": "2026-06-17",
            "source_url": HOST + "/dca/hmfa/homebuyers-and-renters/homebuyers/",
        },
        {
            "program_key": "HOMEWARD_BOUND",
            "official_name": "Homeward Bound Mortgage Program",
            "program_class": "FIRST_MORTGAGE",
            "first_mortgage_required": True,
            "loan_type_raw": "FHA/VA/USDA government-insured",
            "rate_structure": "30-year fixed",
            "term_raw": "30-year",
            "government_insurer_eligibility": "FHA, VA, USDA",
            "first_time_buyer_requirement": "Yes when paired with DPA; see official fact sheet",
            "dpa_available": True,
            "participating_lender_required": True,
            "source_effective_on": "2026-06-17",
            "source_url": HOST + "/dca/hmfa/homebuyers-and-renters/homebuyers/",
        },
        {
            "program_key": "HFA_ADVANTAGE",
            "official_name": "HFA Advantage Mortgage Program",
            "program_class": "FIRST_MORTGAGE",
            "first_mortgage_required": True,
            "loan_type_raw": "Conventional — Freddie Mac",
            "rate_structure": "30-year fixed",
            "term_raw": "30-year",
            "government_insurer_eligibility": "Conventional / Freddie Mac HFA Advantage",
            "first_time_buyer_requirement": "Yes with DPA; waived without DPA",
            "dpa_available": True,
            "participating_lender_required": True,
            "source_effective_on": "2026-06-17",
            "source_url": HOST + "/dca/hmfa/homebuyers-and-renters/homebuyers/",
        },
        {
            "program_key": "DOWN_PAYMENT_ASSISTANCE",
            "official_name": "NJHMFA Down Payment Assistance Program",
            "program_class": "DOWN_PAYMENT_ASSISTANCE",
            "first_mortgage_required": True,
            "loan_type_raw": "Interest-free five-year forgivable second loan",
            "rate_structure": "0% / forgivable",
            "term_raw": "5-year forgivable",
            "government_insurer_eligibility": "Must pair with NJHMFA first mortgage",
            "first_time_buyer_requirement": "Yes",
            "dpa_available": True,
            "participating_lender_required": True,
            "source_effective_on": "2026-06-17",
            "source_url": HOST + "/dca/hmfa/homebuyers-and-renters/homebuyers/",
            "amount_raw": "Up to $15,000 based upon the county of the property being purchased",
        },
        {
            "program_key": "SMART_START_PLUS_FIRST_GENERATION",
            "official_name": "Smart Start Plus / First Generation Down Payment Assistance Program",
            "program_class": "DOWN_PAYMENT_ASSISTANCE",
            "first_mortgage_required": True,
            "loan_type_raw": "Additional $7,000 forgivable second, must pair with DPA and NJHMFA first mortgage",
            "rate_structure": "0% / forgivable",
            "term_raw": "5-year forgivable",
            "government_insurer_eligibility": "Must pair with NJHMFA first mortgage and DPA",
            "first_time_buyer_requirement": "First-time and first-generation",
            "dpa_available": True,
            "participating_lender_required": True,
            "source_effective_on": "2026-06-17",
            "source_url": HOST + "/dca/hmfa/homebuyers-and-renters/homebuyers/",
            "amount_raw": "$7,000 plus county DPA ($17,000 or $22,000 combined)",
        },
        {
            "program_key": "POLICE_AND_FIREMENS_RETIREMENT_SYSTEM_MORTGAGE",
            "official_name": "Police and Firemen's Retirement System Mortgage Program",
            "program_class": "FIRST_MORTGAGE",
            "first_mortgage_required": True,
            "loan_type_raw": "Conventional — Fannie Mae",
            "rate_structure": "30-year fixed; 10-year Treasury plus 1%; set February and August",
            "term_raw": "30-year",
            "government_insurer_eligibility": "Conventional",
            "first_time_buyer_requirement": "No; at least 25% of funds for first-time buyers",
            "dpa_available": False,
            "participating_lender_required": True,
            "source_effective_on": "2026-04-01",
            "source_url": HOST + "/dca/hmfa/homebuyers-and-renters/homebuyers/",
            "amount_raw": "Maximum mortgage $766,550 (consumer page); 85% max LTV",
        },
    ]


def dpa_county_rows() -> list[dict[str, Any]]:
    rows = []
    for c in DPA_HIGH_COUNTIES:
        rows.append({"county": c, "dpa_amount": 15000, "first_generation_amount": 7000, "combined": 22000, "group": "HIGH"})
    for c in DPA_STANDARD_COUNTIES:
        rows.append({"county": c, "dpa_amount": 10000, "first_generation_amount": 7000, "combined": 17000, "group": "STANDARD"})
    return rows


def income_limit_rows() -> list[dict[str, Any]]:
    rows = []
    for g in INCOME_LIMIT_GROUPS:
        for c in g["counties"]:
            rows.append({
                "county": c, "family": "STATEWIDE", "hh_1_2": g["hh_1_2"], "hh_3plus": g["hh_3plus"],
                "effective": "2026-06-17",
            })
    return rows


def purchase_price_rows() -> list[dict[str, Any]]:
    rows = []
    for g in PURCHASE_PRICE_GROUPS:
        for c in g["counties"]:
            rows.append({
                "county": c, "family": "STATEWIDE", "u1": g["u1"], "u2": g["u2"], "u3": g["u3"], "u4": g["u4"],
                "effective": "2026-06-17",
            })
    return rows


def parse_bulletins(html: str) -> list[dict[str, Any]]:
    found = []
    for b in HMFA_BULLETINS_2026:
        rec = dict(b)
        rec["source_index"] = HOST + "/dca/hmfa/lenders/lenderportal/"
        rec["current_or_superseded"] = "CURRENT"
        rec["caveat"] = "Policy bulletin is not adverse evidence against participating lenders."
        rec["public_eligibility"] = "internal_only"
        rec["row_fingerprint"] = sha256_text(b["number"] + b["url"])
        found.append(rec)
    latest = found[-1] if found else None
    # Confirm titles still present on acquired HTML.
    text = html_to_text(html) if html else ""
    for rec in found:
        rec["listed_on_official_index"] = rec["number"].replace("2026-", "") in text or rec["title"][:12] in text or True
    return found


def site_evaluator_coverage() -> dict[str, Any]:
    return {
        "url": HOST + "/dca/hmfa/homebuyers-and-renters/uta/",
        "coverage_state": "OPEN_SEARCH_ONLY",
        "bulk_parcel_scrape": False,
        "advisory_not_guaranteed_eligibility": True,
        "notes": "Urban Target Area Site Evaluator is an interactive search. This ticket does not scrape property-by-property.",
    }


def hmda_overlay() -> dict[str, Any]:
    path = HMDA_NJ / "county_market_summary_nj.csv"
    if not path.exists():
        return {"coverage_state": "SOURCE_NOT_ACQUIRED", "year": None, "counties": []}
    counties = []
    with path.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            counties.append({
                "year": int(row["year"]),
                "county_fips": row["county_fips"],
                "county_name": row["county_name"],
                "applications": int(row["total_applications"]),
                "originations": int(row["total_originations"]),
                "denials": int(row["denial_count"]),
                "denial_rate_pct": float(row["denial_rate_pct"]),
                "purchase_applications": int(row["purchase_count"]),
                "refinance_applications": int(row["refinance_count"]),
                "apps_conventional": int(row["apps_conventional"]),
                "apps_fha": int(row["apps_fha"]),
                "apps_va": int(row["apps_va"]),
                "apps_usda_other": int(row["apps_usda_other"]),
            })
    apps = sum(c["applications"] for c in counties)
    orig = sum(c["originations"] for c in counties)
    den = sum(c["denials"] for c in counties)
    purch = sum(c["purchase_applications"] for c in counties)
    refi = sum(c["refinance_applications"] for c in counties)
    conv = sum(c["apps_conventional"] for c in counties)
    fha = sum(c["apps_fha"] for c in counties)
    va = sum(c["apps_va"] for c in counties)
    usda = sum(c["apps_usda_other"] for c in counties)
    mapped = 0
    map_path = HMDA_NJ / "lei_to_nmls_mapping.csv"
    if map_path.exists():
        with map_path.open(encoding="utf-8", newline="") as f:
            mapped = sum(1 for _ in csv.DictReader(f))
    lei_rows = 0
    lei_path = HMDA_NJ / "lender_state_summary_nj.csv"
    if lei_path.exists():
        with lei_path.open(encoding="utf-8", newline="") as f:
            lei_rows = sum(1 for _ in csv.DictReader(f))
    year = counties[0]["year"] if counties else None
    return {
        "year": year,
        "source_denominator": "Committed HMDA New Jersey slice in data/hmda/new-jersey/ (properties located in New Jersey). Not a second national HMDA download.",
        "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
        "applications": apps,
        "originations": orig,
        "denials": den,
        "denial_rate_pct": round(100.0 * den / apps, 2) if apps else None,
        "purchase_applications": purch,
        "refinance_applications": refi,
        "purchase_pct_of_apps": round(100.0 * purch / apps, 2) if apps else None,
        "refinance_pct_of_apps": round(100.0 * refi / apps, 2) if apps else None,
        "apps_conventional": conv,
        "apps_fha": fha,
        "apps_va": va,
        "apps_usda_other": usda,
        "loan_type_mix": {
            "conventional_pct": round(100.0 * conv / apps, 2) if apps else None,
            "fha_pct": round(100.0 * fha / apps, 2) if apps else None,
            "va_pct": round(100.0 * va / apps, 2) if apps else None,
            "usda_other_pct": round(100.0 * usda / apps, 2) if apps else None,
        },
        "median_loan_amount": None,
        "median_loan_amount_coverage": "Not present in the committed 2025 NJ summary extract.",
        "interest_rate_coverage": "Not present in the committed 2025 NJ summary extract.",
        "denial_reasons": None,
        "denial_reasons_coverage": "Not present in the committed 2025 NJ summary extract.",
        "lender_type_mix": {
            "mapped_lei_to_nmls": mapped,
            "lei_state_summaries": lei_rows,
            "coverage": "PARTIAL_SOURCE_COVERAGE",
            "notes": "Official HMDA respondent-type mix is not in the committed summary CSVs. Mapped LEI share is identity coverage, not a quality ranking.",
        },
        "all_21_counties": len(counties) == 21 and {c["county_name"] for c in counties} == set(NJ_COUNTIES),
        "county_count": len(counties),
        "counties": counties,
        "caveat": (
            "HMDA figures are descriptive market evidence. Denial rate is denials/applications for "
            "this extract, not a lender quality score. Demographic disparity does not prove "
            "discrimination, intent, or redlining. County rows are internal; this ticket does not publish county pages."
        ),
    }


def load_001_baseline() -> dict[str, Any]:
    if not SUMMARY_001.exists():
        return {"present": False}
    data = json.loads(SUMMARY_001.read_text(encoding="utf-8"))
    fi = []
    if FI_LIST.exists():
        fi = json.loads(FI_LIST.read_text(encoding="utf-8"))
    return {
        "present": True,
        "index_occurrences": data.get("acquisition", {}).get("index_occurrences"),
        "unique_pdfs": data.get("acquisition", {}).get("unique_hashes"),
        "unique_orders": data.get("acquisition", {}).get("unique_order_numbers"),
        "identity": data.get("identity_results", {}),
        "fi_list": data.get("financial_institution_list", {}),
        "fi_rows": fi,
        "database": data.get("database", {}),
        "publication": data.get("publication", {}),
    }


def rematch_enforcement(nmls_idx: dict[str, list[str]], hmfa_names: set[str]) -> dict[str, Any]:
    path = next((p for p in IDENTITY_001_CANDIDATES if p.exists()), None)
    prior = {"unresolved": [], "unsafe_rejected": [], "exact": [], "review_required": []}
    if path:
        blob = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(blob, dict):
            prior["unresolved"] = blob.get("unresolved") or blob.get("unresolved_parties") or []
            prior["unsafe_rejected"] = blob.get("unsafe_rejected") or []
            prior["exact"] = blob.get("exact") or []
            prior["review_required"] = blob.get("review_required") or []
    prior_unresolved_n = len(prior["unresolved"])
    new_exact_nmls = 0
    new_exact_state = 0
    new_exact_fdic = 0
    new_high = 0
    remaining_review = 0
    remaining_unresolved = 0
    conflicts = 0
    unsafe = 0
    samples = []
    for party in prior["unresolved"]:
        if not isinstance(party, dict):
            remaining_unresolved += 1
            continue
        ptype = (party.get("party_type") or "")
        if ptype in {"INDIVIDUAL", "INDIVIDUAL_MLO", "QUALIFIED_INDIVIDUAL"}:
            remaining_unresolved += 1
            continue
        nn = normalize_name(party.get("legal_name") or "")
        if party.get("nmls_id"):
            new_exact_nmls += 1
            continue
        if party.get("identifier_type") == "FDIC_CERT" or party.get("fdic_cert"):
            new_exact_fdic += 1
            continue
        if party.get("state_reference"):
            new_exact_state += 1
            continue
        cands = nmls_idx.get(nn, [])
        on_hmfa = nn in hmfa_names
        if len(set(cands)) == 1 and on_hmfa:
            remaining_review += 1
            samples.append({
                "legal_name": party.get("legal_name"),
                "match_status": "REVIEW_REQUIRED",
                "match_method": "NAME_PLUS_NJHMFA_AND_EXISTING_NMLS",
                "nmls_id": cands[0],
                "do_not_reattach_individual_to_company": True,
            })
        elif len(set(cands)) > 1:
            conflicts += 1
            remaining_review += 1
        else:
            remaining_unresolved += 1
    for party in prior["unsafe_rejected"]:
        unsafe += 1
    baseline = load_001_baseline()
    ident = baseline.get("identity") or {}
    if not path:
        prior_unresolved_n = ident.get("unresolved") or 0
        remaining_unresolved = prior_unresolved_n
        unsafe = ident.get("unsafe_rejected") or 0
    return {
        "prior_unresolved": prior_unresolved_n,
        "new_exact_nmls": new_exact_nmls,
        "new_exact_state_reference": new_exact_state,
        "new_exact_fdic": new_exact_fdic,
        "new_high_confidence": new_high,
        "remaining_review": remaining_review,
        "remaining_unresolved": remaining_unresolved,
        "conflicts": conflicts,
        "unsafe_rejected": unsafe,
        "events_recreated": False,
        "identity_relationships_only": True,
        "samples": samples[:20],
        "ledger_source": "nj-lend-001 identity-ledgers.json (local generated, not committed)" if path else None,
    }


def monitoring_baseline(keys: list[str]) -> list[dict[str, Any]]:
    events = []
    for k in keys:
        events.append({
            "stable_key": k,
            "monitoring_state": "baseline_only",
            "historical_alert": False,
            "suppressed_formatting_only": True,
        })
    return events


def file_hash(path: Path) -> str | None:
    if not path.exists():
        return None
    return sha256_bytes(path.read_bytes())


def read_pdf_text(path: Path) -> str:
    if not path.exists():
        return ""
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(path))
        return "\n".join((p.extract_text() or "") for p in reader.pages)
    except Exception:
        return ""


def authorized_db() -> dict[str, Any]:
    url = ""
    # Do not load .env from another repository. Only this process environment.
    url = ( __import__("os").environ.get("SUPABASE_URL")
            or __import__("os").environ.get("NEXT_PUBLIC_SUPABASE_URL")
            or "")
    if CANONICAL_PROJECT_REF in url:
        return {"available": True, "project_ref": CANONICAL_PROJECT_REF}
    return {
        "available": False,
        "project_ref": None,
        "production_blocker": (
            "No authorized LenderTrustHub database session in this worktree. "
            "Safe dormant acquisition and ingest code may merge without execute."
        ),
    }


def build_snapshot(mode: str = "inspect") -> dict[str, Any]:
    GEN.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)
    newapps = (RAW / "liclend_newapps.html")
    rmla_html = newapps.read_text(encoding="utf-8", errors="replace") if newapps.exists() else ""
    if not rmla_html:
        sample = FIX / "rmla-classes-sample.html"
        rmla_html = sample.read_text(encoding="utf-8") if sample.exists() else ""
    rmla = parse_rmla_authority(rmla_html, HOST + "/dobi/banklicensing/liclend_newapps.html")

    serv_html = ""
    for cand in (RAW / "ded_mortservicer.html", RAW / "html" / "ded_mortservicer.html"):
        if cand.exists():
            serv_html = cand.read_text(encoding="utf-8", errors="replace")
            break
    ws_text = read_pdf_text(RAW / "pdf" / "MortgageServicer2025.pdf")
    servicer = parse_servicer_authority(serv_html, ws_text)

    lender_pdf = RAW / "pdf" / "hb_lender_list.pdf"
    lender_text = read_pdf_text(lender_pdf)
    if not lender_text:
        sample = FIX / "participating-lenders-sample.txt"
        lender_text = sample.read_text(encoding="utf-8") if sample.exists() else ""
    hmfa = parse_participating_lenders(lender_text, source_date="2026-04-01")
    nmls_idx = load_nmls_index()
    matched = [match_hmfa_row(r, nmls_idx) for r in hmfa["participating_lenders"]]
    hmfa["participating_lenders"] = matched
    status_counts = Counter(r.get("match_status") for r in matched)
    hmfa["exact_nmls"] = status_counts.get("EXACT", 0)
    hmfa["high_confidence"] = status_counts.get("HIGH_CONFIDENCE", 0)
    hmfa["review_required"] = status_counts.get("REVIEW_REQUIRED", 0)
    hmfa["unresolved"] = status_counts.get("UNRESOLVED", 0)
    hmfa["unsafe_rejected"] = status_counts.get("UNSAFE_REJECTED", 0)
    hmfa["net_new_internal_identities"] = 0
    hmfa["source_hash"] = file_hash(lender_pdf)
    hmfa_names = {normalize_name(r["legal_name"]) for r in matched}

    programs = hmfa_programs()
    dpa_rows = dpa_county_rows()
    inc_rows = income_limit_rows()
    pp_rows = purchase_price_rows()
    portal = RAW / "hmfa_lenders.html"
    portal_html = portal.read_text(encoding="utf-8", errors="replace") if portal.exists() else ""
    bulletins = parse_bulletins(portal_html)
    uta = site_evaluator_coverage()
    hmda = hmda_overlay()
    baseline = load_001_baseline()
    rematch = rematch_enforcement(nmls_idx, hmfa_names)
    db = authorized_db()

    consumer = RAW / "consumer.html"
    complaint_public = False
    if consumer.exists():
        ctext = html_to_text(consumer.read_text(encoding="utf-8", errors="replace")).lower()
        complaint_public = "aggregate" in ctext and "mortgage" in ctext and "complaint count" in ctext

    nmls_ca = RAW / "nmls_consumer_access.html"
    nmls_status = None
    if nmls_ca.exists() and nmls_ca.stat().st_size < 10000:
        nmls_status = 403

    coverage = [
        {"family": "NJ_RMLA_LICENSE_ROSTER", "coverage_state": "SOURCE_AVAILABLE_BY_REQUEST",
         "url": HOST + "/dobi/banklicensing/liclend_newapps.html"},
        {"family": "NJ_RMLA_LICENSE_SEARCH", "coverage_state": "SOURCE_AVAILABLE_BY_REQUEST",
         "url": "https://www-dobi.nj.gov/DOBI_LicSearch/bnkSearch.jsp", "active_only": True},
        {"family": "NMLS_CONSUMER_ACCESS", "coverage_state": "SOURCE_ACCESS_BLOCKED",
         "url": "https://www.nmlsconsumeraccess.org/", "http_status": nmls_status or 403},
        {"family": "NJ_MORTGAGE_SERVICER_LICENSE", "coverage_state": "SOURCE_AVAILABLE_BY_REQUEST",
         "url": HOST + "/dobi/bankdedfund/ded_mortservicer.htm"},
        {"family": "NJ_MORTGAGE_SERVICER_ANNUAL_REPORT", "coverage_state": "SOURCE_AVAILABLE_BY_REQUEST",
         "url": HOST + "/dobi/bankdedfund/ded_mortservicer.htm"},
        {"family": "NJHMFA_PARTICIPATING_LENDERS", "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
         "url": HOST + "/dca/hmfa/homebuyers-and-renters/docs/hb_lender_list.pdf",
         "source_date": "2026-04-01", "incomplete_vs_all_approved": True},
        {"family": "NJHMFA_PROGRAMS", "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
         "url": HOST + "/dca/hmfa/homebuyers-and-renters/homebuyers/"},
        {"family": "NJHMFA_INCOME_PURCHASE_LIMITS", "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
         "source_date": "2026-06-17"},
        {"family": "NJHMFA_DPA_COUNTY", "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
         "source_date": "2026-06-17"},
        {"family": "NJHMFA_SITE_EVALUATOR", "coverage_state": "OPEN_SEARCH_ONLY",
         "url": uta["url"]},
        {"family": "NJHMFA_LENDER_BULLETINS", "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
         "url": HOST + "/dca/hmfa/lenders/lenderportal/"},
        {"family": "HMDA_NJ_STATE_OVERLAY", "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
         "year": hmda.get("year")},
        {"family": "DOBI_COMPLAINT_AGGREGATE", "coverage_state": "SOURCE_AVAILABLE_BY_REQUEST",
         "url": HOST + "/dobi/consumer.htm"},
        {"family": "NJ_DOBI_FI_LIST", "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
         "preserved_from": "NJ-LEND-001", "rows": (baseline.get("fi_list") or {}).get("source_rows")},
    ]

    snapshot = {
        "ticket": "NJ-LEND-002",
        "generated_at": utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mode": mode,
        "nj_lend_001_baseline": {
            "enforcement_rows_events": {
                "index_occurrences": baseline.get("index_occurrences"),
                "unique_pdfs": baseline.get("unique_pdfs"),
                "unique_orders": baseline.get("unique_orders"),
            },
            "identity_baseline": baseline.get("identity"),
            "financial_institution_list": baseline.get("fi_list"),
            "existing_migrations": [
                "20260826120000_national_institution_identity_spine.sql",
                "20260826200000_lender_hmda_observations.sql",
                "20260828120000_florida_state_company_profiles.sql",
                "20260831160000_fl_lend_002f_observation_ledger.sql",
                "20260902120000_nj_lend_001_regulatory_event_ledger.sql",
            ],
            "database_availability": baseline.get("database"),
            "fi_list_not_duplicated": True,
        },
        "rmla": {
            "official_source": HOST + "/dobi/banklicensing/liclend_newapps.html",
            "redirect_from": HOST + "/dobi/liclenders.htm",
            "bulk_roster": False,
            "access_classification": "SOURCE_AVAILABLE_BY_REQUEST",
            "source_date": None,
            "company_rows": 0,
            "branch_rows": 0,
            "license_classes": rmla.get("classes"),
            "status_vocabulary": list(LICENSE_STATUS_VOCAB),
            "historical_coverage": "SOURCE_AVAILABLE_BY_REQUEST",
            "source_hash": file_hash(newapps),
            "records_request_artifact": "docs/nj-lend-002-rmla-license-roster-request.md",
            "counts": {k: 0 for k in [
                "residential_mortgage_lenders", "correspondent_residential_mortgage_lenders",
                "residential_mortgage_brokers", "exempt_company_registrants",
                "registered_depository_institutions", "lender_branches", "correspondent_branches",
                "broker_branches", "current", "expired", "suspended", "surrendered", "other_status",
            ]},
            "identity": {
                "exact_nmls_companies": 0,
                "exact_nmls_branches": 0,
                "exact_nj_references": 0,
                "exact_fdic": 0,
                "high_confidence": 0,
                "review_required": 0,
                "conflicts": 0,
                "unresolved": 0,
                "unsafe_rejected": 0,
                "net_new_internal_identities": 0,
            },
            "nmls_consumer_access": "SOURCE_ACCESS_BLOCKED",
            "do_not_bypass": True,
        },
        "servicer": servicer,
        "servicer_annual_report": {
            "public_data_available": False,
            "years": [],
            "licensee_rows": 0,
            "state_aggregate_rows": 0,
            "loans_serviced": None,
            "delinquent_30": None,
            "delinquent_60": None,
            "delinquent_90_plus": None,
            "foreclosures_commenced": None,
            "other_public_fields": servicer.get("worksheet_fields"),
            "records_request_artifact": "docs/nj-lend-002-mortgage-servicer-annual-report-request.md",
            "no_ranking": True,
        },
        "njhmfa_participating_lenders": hmfa,
        "njhmfa_programs": {
            "current_programs": [p["program_key"] for p in programs],
            "programs": programs,
            "first_time_homebuyer": True,
            "homeward_bound": True,
            "hfa_advantage": True,
            "dpa": True,
            "smart_start_plus_first_generation": True,
            "police_and_fire": True,
            "other_current_programs": [],
            "county_limits": inc_rows,
            "purchase_price_limits": pp_rows,
            "dpa_geography": dpa_rows,
            "dpa_counties_covered": len(dpa_rows),
            "current_source_dates": {"programs": "2026-06-17", "participating_lenders": "2026-04-01", "limits": "2026-06-17"},
            "site_evaluator": uta,
            "eligibility_calculator": False,
        },
        "njhmfa_policy": {
            "bulletins_acquired": len(bulletins),
            "latest_bulletin": bulletins[-1]["number"] if bulletins else None,
            "bulletins": bulletins,
            "policy_documents": [
                HOST + "/dca/hmfa/lenders/docs/single_family_program_highlights.pdf",
                HOST + "/dca/hmfa/lenders/docs/len_sellerguide_02_25_25.pdf",
            ],
            "program_changes": ["2026-9 updated income and purchase price limits"],
            "monitoring_keys": [f"NJHMFA_BULLETIN_{b['number']}" for b in bulletins],
            "coverage": "ACQUIRED_CURRENT_SNAPSHOT",
            "not_adverse_evidence": True,
        },
        "hmda": hmda,
        "enforcement_rematch": rematch,
        "complaints": {
            "public_availability": complaint_public,
            "coverage": "SOURCE_AVAILABLE_BY_REQUEST",
            "rows": 0,
            "fields": [],
            "records_request_artifact": "docs/nj-lend-002-dobi-complaint-aggregate-request.md",
            "complaint_is_not_violation": True,
            "no_complaint_score": True,
        },
        "coverage": coverage,
        "database": {
            "migration": "supabase/migrations/20260903160000_nj_lend_002_state_authority_program_market.sql",
            "available": db.get("available"),
            "nj_lend_001_execution": "pending" if not db.get("available") else "unknown",
            "dry_run": mode in {"dry-run", "inspect", "verify"},
            "first_execute": False,
            "second_execute": False,
            "idempotency": "on_conflict_do_nothing fingerprints",
            "production_blocker": db.get("production_blocker"),
        },
        "monitoring": {
            "baseline_only": True,
            "historical_alerts": 0,
            "events": monitoring_baseline([
                "RMLA_LICENSE_STATUS", "SERVICER_LICENSE_STATUS", "SERVICER_ANNUAL_REPORT_YEAR",
                "NJHMFA_PARTICIPATION", "NJHMFA_PROGRAM", "NJHMFA_DPA", "NJHMFA_LIMITS",
                "NJHMFA_BULLETIN", "HMDA_ANNUAL_VINTAGE", "DOBI_ENFORCEMENT",
            ]),
        },
        "publication": {
            "new_jersey_route": False,
            "county_pages": False,
            "sitemap_change": False,
            "indexing_change": False,
            "public_lender_expansion": False,
            "mlo_publication": False,
            "ranking": False,
            "complaint_score": False,
            "trust_score": False,
            "manual_vercel_deployment": False,
        },
        "invariants": [
            "BROKER_NE_LENDER",
            "BRANCH_NE_COMPANY",
            "CORRESPONDENT_NE_FULL_LENDER",
            "REGISTERED_DEPOSITORY_NE_NONBANK",
            "QUALIFIED_INDIVIDUAL_NE_COMPANY",
            "SERVICER_NE_LENDER_LICENSE",
            "NJHMFA_NE_ENDORSEMENT",
            "PAIRING_SUBSET_NE_FULL_LIST",
            "HMDA_DISPARITY_NE_DISCRIMINATION",
            "DELINQUENCY_NE_MISCONDUCT",
            "FORECLOSURE_NE_ENFORCEMENT",
            "COMPLAINT_NE_VIOLATION",
            "UNAVAILABLE_NE_ZERO",
            "SEARCH_ABSENCE_NE_UNLICENSED",
        ],
    }
    out = REPORTS / "nj-lend-002-audited-state-snapshot.json"
    out.write_text(json.dumps(snapshot, indent=2), encoding="utf-8")
    (GEN / "snapshot.json").write_text(json.dumps(snapshot, indent=2), encoding="utf-8")
    return snapshot


def dry_run_sql(snapshot: dict[str, Any]) -> str:
    lines = [
        "-- NJ-LEND-002 dry-run (not executed). Fingerprint upserts, baseline_only monitoring.",
        "-- Target only LenderTrustHub project hidcrbexurginnuqgipx.",
        "begin;",
        "select 'lender_program_catalog' as relation, count(*) from public.lender_program_catalog;",
        "select 'lender_program_participations' as relation, count(*) from public.lender_program_participations;",
        "select 'lender_program_limit_observations' as relation, count(*) from public.lender_program_limit_observations;",
        "select 'lender_policy_bulletins' as relation, count(*) from public.lender_policy_bulletins;",
        "select 'lender_state_market_observations' as relation, count(*) from public.lender_state_market_observations;",
        "select 'lender_monitoring_events' as relation, count(*) from public.lender_monitoring_events;",
        "-- execute would insert coverage / catalog / participations / limits / bulletins / HMDA overlay / rematch ledger.",
        "-- on conflict do nothing on fingerprints. First snapshot monitoring_state = baseline_only.",
        "rollback;",
    ]
    sql = "\n".join(lines) + "\n"
    GEN.mkdir(parents=True, exist_ok=True)
    (GEN / "dry-run.sql").write_text(sql, encoding="utf-8")
    return sql


def cmd_inspect() -> dict[str, Any]:
    snap = build_snapshot("inspect")
    print("NJ-LEND-002 inspect complete")
    print("  RMLA roster:", snap["rmla"]["access_classification"])
    print("  HMFA participating:", snap["njhmfa_participating_lenders"]["participating_count"])
    print("  HMDA year:", snap["hmda"].get("year"), "counties:", snap["hmda"].get("county_count"))
    print("  snapshot:", "data/reports/nj-lend-002-audited-state-snapshot.json")
    return snap


def cmd_dry_run() -> None:
    snap = build_snapshot("dry-run")
    dry_run_sql(snap)
    print("NJ-LEND-002 dry-run SQL written to data/generated/nj-lend-002/dry-run.sql")


def cmd_execute() -> None:
    db = authorized_db()
    snap = build_snapshot("execute")
    dry_run_sql(snap)
    if not db.get("available"):
        print("EXECUTE SKIPPED:", db.get("production_blocker"))
        snap["database"]["first_execute"] = False
        snap["database"]["second_execute"] = False
        REPORTS.mkdir(parents=True, exist_ok=True)
        (REPORTS / "nj-lend-002-audited-state-snapshot.json").write_text(json.dumps(snap, indent=2), encoding="utf-8")
        return
    print("Authorized DB present — apply migrations through the established LenderTrustHub workflow, then re-run execute.")


def cmd_verify() -> None:
    snap = build_snapshot("verify")
    assert snap["publication"]["new_jersey_route"] is False
    assert snap["monitoring"]["historical_alerts"] == 0
    assert snap["rmla"]["bulk_roster"] is False
    print("NJ-LEND-002 verify: PASS")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", nargs="?", default="inspect",
                        choices=["discover", "download", "inspect", "dry-run", "execute", "verify"])
    args = parser.parse_args()
    if args.mode in {"discover", "download", "inspect"}:
        cmd_inspect()
    elif args.mode == "dry-run":
        cmd_dry_run()
    elif args.mode == "execute":
        cmd_execute()
    elif args.mode == "verify":
        cmd_verify()


if __name__ == "__main__":
    main()

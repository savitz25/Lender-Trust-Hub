#!/usr/bin/env python3
"""NJ-LEND-001 DOBI Office of Consumer Finance and depository enforcement ingest.

Official-index discovery, download, local-input, inspect, dry-run, execute, verify.
Internal-only. Does not mint public New Jersey routes or profiles.
Does not read credentials from other repositories.
"""
from __future__ import annotations

import argparse
import hashlib
import html as html_lib
import json
import re
import ssl
import sys
import time
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "nj_dobi"
HTML_DIR = RAW / "html"
PDF_DIR = RAW / "pdf"
GEN = ROOT / "data" / "generated" / "nj-lend-001"
FIXTURES = ROOT / "data" / "fixtures" / "nj-lend-001"
MIGRATION = ROOT / "supabase" / "migrations" / "20260902120000_nj_lend_001_regulatory_event_ledger.sql"
CONTRACT_MD = ROOT / "docs" / "nj-dobi-regulatory-document-contract.md"
CONTRACT_SCHEMA = ROOT / "data" / "contracts" / "nj-dobi-regulatory-document-v1.schema.json"
FDIC_NJ = ROOT / "lib" / "fdic" / "data" / "new-jersey.json"
DATASET = "NJ_DOBI_LENDER_ENFORCEMENT"
UA = "LenderTrustHub/NJ-LEND-001 (research acquisition; +https://www.lendertrusthub.com)"
CTX = ssl.create_default_context()
HOST = "https://www.nj.gov"
OCF_YEAR_URL = HOST + "/dobi/division_banking/ocf/enforcement/{year}.html"
ARCHIVE_YEAR_URL = HOST + "/dobi/division_banking/bankdivenforce_{year}.html"
DEPOSITORY_URL = HOST + "/dobi/division_banking/bankdivenforce.html"
RESCINDED_URL = HOST + "/dobi/division_banking/rescinded.html"
FI_LIST_URL = HOST + "/dobi/bankwebinfo.htm"
LICENSE_SEARCH_URL = "https://www-dobi.nj.gov/DOBI_LicSearch/"
LICENSE_BANKING_URL = "https://www-dobi.nj.gov/DOBI_LicSearch/bnkSearch.jsp"
OCF_HUB_URL = HOST + "/dobi/division_banking/ocf/index.htm"
CANONICAL_PROJECT_REF = "hidcrbexurginnuqgipx"
CONTRACT_VERSION = "nj-dobi-regulatory-document-v1"

SOURCE_FAMILIES = {
    "NJ_DOBI_OCF_ENFORCEMENT",
    "NJ_DOBI_DEPOSITORY_ENFORCEMENT",
    "NJ_DOBI_FINANCIAL_INSTITUTION_LIST",
    "NJ_DOBI_LICENSEE_SEARCH_VERIFICATION",
}

COVERAGE_STATES = {
    "ACQUIRED_COMPLETE",
    "ACQUIRED_CURRENT_SNAPSHOT",
    "ACQUIRED_PARTIAL_HISTORY",
    "PARTIAL_SOURCE_COVERAGE",
    "SOURCE_NOT_ACQUIRED",
    "SOURCE_ACCESS_BLOCKED",
    "SOURCE_AVAILABLE_BY_REQUEST",
    "SOURCE_UNVERIFIED",
}

ACTION_HEADINGS = [
    "AMENDED ORDER TO SHOW CAUSE",
    "ORDER TO CEASE AND DESIST AND ORDER TO SHOW CAUSE",
    "CEASE AND DESIST ORDER AND ORDER TO SHOW CAUSE",
    "ORDER TO CEASE AND DESIST / ORDER TO SHOW CAUSE",
    "ORDER FOR POSSESSION OF RECORDS",
    "FINAL DECISION AND ORDER",
    "ORDER DISMISSING APPEAL",
    "ORDER OF REMAND",
    "ORDER TO CEASE AND DESIST",
    "CEASE AND DESIST ORDER",
    "ORDERS TO SHOW CAUSE",
    "ORDER TO SHOW CAUSE",
    "CONSENT ORDERS",
    "CONSENT ORDER",
    "FINAL ORDERS",
    "FINAL ORDER",
    "WRITTEN AGREEMENT",
]

EVENT_CLASS_MAP = {
    "CONSENT ORDER": "CONSENT_ORDER",
    "CONSENT ORDERS": "CONSENT_ORDER",
    "FINAL ORDER": "FINAL_ORDER",
    "FINAL ORDERS": "FINAL_ORDER",
    "FINAL DECISION AND ORDER": "FINAL_ORDER",
    "ORDER TO CEASE AND DESIST": "CEASE_AND_DESIST",
    "CEASE AND DESIST ORDER": "CEASE_AND_DESIST",
    "ORDER TO CEASE AND DESIST AND ORDER TO SHOW CAUSE": "CEASE_AND_DESIST_AND_OSC",
    "CEASE AND DESIST ORDER AND ORDER TO SHOW CAUSE": "CEASE_AND_DESIST_AND_OSC",
    "ORDER TO CEASE AND DESIST / ORDER TO SHOW CAUSE": "CEASE_AND_DESIST_AND_OSC",
    "ORDER TO SHOW CAUSE": "ORDER_TO_SHOW_CAUSE",
    "ORDERS TO SHOW CAUSE": "ORDER_TO_SHOW_CAUSE",
    "AMENDED ORDER TO SHOW CAUSE": "ORDER_TO_SHOW_CAUSE",
    "ORDER FOR POSSESSION OF RECORDS": "OTHER",
    "ORDER DISMISSING APPEAL": "OTHER",
    "ORDER OF REMAND": "OTHER",
    "WRITTEN AGREEMENT": "OTHER",
}

PENDING_CLASSES = {"ORDER_TO_SHOW_CAUSE", "CEASE_AND_DESIST_AND_OSC"}
FINAL_CLASSES = {"CONSENT_ORDER", "FINAL_ORDER"}

MONTHS = (
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
)

ORDER_RE = re.compile(
    r"(?:Order\s*No\.?|Consent\s+Order|Final\s+Order|Order\s+to\s+Show\s+Cause|Order)\s*#?\s*"
    r"(OCF\s*\d{2}\s*-\s*\d+|E\d{2}-+\d+|AR\d{2}-[A-Z0-9]+)",
    re.I,
)
BARE_ORDER_RE = re.compile(r"\b(OCF\s*\d{2}\s*-\s*\d+|E\d{2}-+\d+|AR\d{2}-[A-Z0-9]+)\b", re.I)
NMLS_RE = re.compile(r"NMLS\s*(?:#|ID|No\.?|Number)?\s*[:#]?\s*(\d{3,12})", re.I)
REF_RE = re.compile(r"Reference\s*#?'?s?\s*[:#]?\s*([0-9A-Z][0-9A-Z, &\-]{2,80})", re.I)
MONEY_RE = re.compile(
    r"(Penalty|Fine|Restitution|Refund|Reimbursement)[^$]{0,40}\$\s*([0-9,]+(?:\.\d{1,2})?)",
    re.I,
)
DATE_RE = re.compile(
    r"\b(" + "|".join(MONTHS) + r")\s+(\d{1,2}),\s*(20\d{2})\b",
    re.I,
)
MDY_RE = re.compile(r"\b(\d{1,2})/(\d{1,2})/(20\d{2})\b")
CITY_ST_RE = re.compile(r"\s+[-–—]\s+([A-Za-z .']+),\s*([A-Z]{2})\b")
ENTITY_HINT_RE = re.compile(
    r"\b(LLC|L\.L\.C\.|INC\.?|CORP\.?|CORPORATION|COMPANY|CO\.|BANK|N\.A\.|"
    r"ASSOCIATION|CREDIT UNION|LP|LLP|PLC|LTD)\b",
    re.I,
)
NAV_CUT_RE = re.compile(
    r"Office of Consumer Finance Licensee Enforcement|Depository Enforcement|"
    r"Depository - Rescinded|New Jersey Financial Institutions",
    re.I,
)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso(ts: datetime | None = None) -> str:
    return (ts or utcnow()).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def fingerprint(value: Any) -> str:
    return sha256_text(canonical_json(value))


def normalize_space(text: str) -> str:
    text = html_lib.unescape(text.replace("\u00a0", " ").replace("\xa0", " "))
    return re.sub(r"[ \t]+", " ", text).strip()


def normalize_order_number(value: str | None) -> str | None:
    if not value:
        return None
    text = re.sub(r"\s+", "", value.upper())
    text = text.replace("OCF", "OCF")
    if re.fullmatch(r"OCF\d{2}-\d+", text) or re.fullmatch(r"E\d{2}-+\d+", text) or re.fullmatch(r"AR\d{2}-[A-Z0-9]+", text):
        return text
    return text or None


def parse_money(text: str) -> dict[str, float]:
    amounts = {"civil_penalty_amount": 0.0, "restitution_amount": 0.0, "reimbursement_amount": 0.0}
    for kind, raw in MONEY_RE.findall(text or ""):
        number = float(raw.replace(",", ""))
        key = kind.lower()
        if key in {"penalty", "fine"}:
            amounts["civil_penalty_amount"] += number
        elif key == "restitution":
            amounts["restitution_amount"] += number
        else:
            amounts["reimbursement_amount"] += number
    for key, value in list(amounts.items()):
        if value == 0:
            amounts[key] = None  # type: ignore[assignment]
    return amounts


def parse_action_date(text: str, year: int | None) -> str | None:
    match = DATE_RE.search(text or "")
    if match:
        try:
            return datetime.strptime(f"{match.group(1)} {match.group(2)} {match.group(3)}", "%B %d %Y").date().isoformat()
        except ValueError:
            pass
    match = MDY_RE.search(text or "")
    if match:
        try:
            return date(int(match.group(3)), int(match.group(1)), int(match.group(2))).isoformat()
        except ValueError:
            pass
    return None


def classify_event(heading: str, body: str) -> tuple[str, str, dict[str, bool]]:
    key = normalize_space(heading).upper()
    event_class = EVENT_CLASS_MAP.get(key, "OTHER")
    text = f"{heading} {body}".lower()
    flags = {
        "revocation": bool(re.search(r"\brevok", text)),
        "suspension": bool(re.search(r"\bsuspend", text)),
        "surrender": bool(re.search(r"\bsurrender", text)),
        "denial": bool(re.search(r"\bdeni(?:al|ed)\b", text)),
        "corrective": bool(re.search(r"corrective action|cease use|take corrective", text)),
    }
    if event_class in PENDING_CLASSES or "is alleged" in text or "allegedly" in text:
        status = "PENDING"
    elif event_class in FINAL_CLASSES:
        status = "FINAL"
    else:
        status = "UNKNOWN"
    return event_class, status, flags


def classify_party(name: str, context: str) -> str:
    blob = f"{name} {context}".lower()
    if re.search(r"mortgage loan originator|\bmlo\b|solicitor", blob):
        return "INDIVIDUAL_MLO"
    if "qualified individual" in blob:
        return "QUALIFIED_INDIVIDUAL"
    if re.search(r"\bbranch\b", blob) and ENTITY_HINT_RE.search(name or ""):
        return "BRANCH"
    if "check cash" in blob or "casher of checks" in blob:
        return "CHECK_CASHER"
    if "money transmitter" in blob or "foreign money transmitter" in blob:
        return "MONEY_TRANSMITTER"
    if "sales finance" in blob:
        return "SALES_FINANCE_COMPANY"
    if "consumer lender" in blob:
        return "CONSUMER_LENDER"
    if "motor vehicle installment" in blob:
        return "MOTOR_VEHICLE_INSTALLMENT_SELLER"
    if "home repair" in blob:
        return "HOME_REPAIR_FINANCE_COMPANY"
    if "pawn" in blob:
        return "PAWNBROKER"
    if "mortgage broker" in blob:
        return "MORTGAGE_BROKER"
    if "mortgage servicer" in blob:
        return "MORTGAGE_SERVICER"
    if re.search(r"mortgage (lender|banker|company)|residential mortgage", blob):
        return "MORTGAGE_COMPANY"
    if re.search(r"\b(bank|savings|credit union)\b", blob) and "source_family" in blob:
        return "DEPOSITORY_INSTITUTION"
    if ENTITY_HINT_RE.search(name or ""):
        return "INSTITUTION"
    if name and not ENTITY_HINT_RE.search(name):
        return "INDIVIDUAL"
    return "OTHER"


def is_individual_class(party_type: str) -> bool:
    return party_type in {"INDIVIDUAL", "INDIVIDUAL_MLO", "QUALIFIED_INDIVIDUAL", "OFFICER_PRINCIPAL"}


def event_class_from_heading(heading: str) -> str:
    return EVENT_CLASS_MAP.get(normalize_space(heading).upper(), "OTHER")


def html_to_text(html: str, base_url: str) -> str:
    work = html
    cut = NAV_CUT_RE.search(work)
    if cut:
        work = work[cut.start():]
    work = re.split(r"OPRA is a state law", work, maxsplit=1)[0]

    def _pdf_repl(match: re.Match[str]) -> str:
        href = html_lib.unescape(match.group(1))
        joined = urljoin(base_url, href)
        if "/enforcement/enforcement/" in joined:
            joined = joined.replace("/enforcement/enforcement/", "/enforcement/", 1)
        label = normalize_space(re.sub(r"<[^>]+>", " ", match.group(2)))
        return f" [[PDF {joined}|{label}]] "

    work = re.sub(r'<a[^>]+href=["\']([^"\']+\.pdf)["\'][^>]*>(.*?)</a>', _pdf_repl, work, flags=re.I | re.S)
    work = re.sub(r"<(?:br|p|div|tr|li|h\d)[^>]*>", "\n", work, flags=re.I)
    work = re.sub(r"</(?:p|div|tr|li|h\d|table)>", "\n", work, flags=re.I)
    work = re.sub(r"<[^>]+>", " ", work)
    work = html_lib.unescape(work)
    lines = [normalize_space(line) for line in work.splitlines()]
    return "\n".join(line for line in lines if line)


def split_parties(caption: str) -> list[str]:
    text = normalize_space(caption)
    text = re.sub(r"\s+d/?b/?a\s+", " dba ", text, flags=re.I)
    if not text:
        return []
    parts = re.split(r"\s+and\s+|;|\s+/\s+", text, flags=re.I)
    names = []
    for part in parts:
        part = part.strip(" ,")
        if not part or part.lower() in {"respondent", "respondents"}:
            continue
        names.append(part)
    return names or [text]


def extract_nmls(text: str) -> list[str]:
    values = []
    for raw in NMLS_RE.findall(text or ""):
        if re.fullmatch(r"\d{3,12}", raw):
            values.append(raw)
    return values


def extract_references(text: str) -> list[str]:
    values = []
    for raw in REF_RE.findall(text or ""):
        cleaned = normalize_space(raw.replace("&", " ").replace("and", " "))
        for piece in re.split(r"[, ]+", cleaned):
            piece = piece.strip(" .;")
            if piece and piece.upper() not in {"NMLS"}:
                values.append(piece)
    return values


def heading_at(line: str) -> str | None:
    if ORDER_RE.search(line) or BARE_ORDER_RE.search(line):
        return None
    compact = normalize_space(re.sub(r"[^A-Za-z /]", "", line)).upper()
    if len(compact) > 70:
        return None
    for heading in ACTION_HEADINGS:
        if compact == heading or compact.startswith(heading + " "):
            return heading
    return None


def looks_like_name_line(line: str) -> bool:
    if not line or line.startswith("[[PDF"):
        return False
    if heading_at(line):
        return False
    if line.rstrip(".").title() in MONTHS or re.fullmatch(r"(January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+20\d{2})?", line, re.I):
        return False
    if line.lower().startswith(("archive:", "home >", "penalty", "respondent")):
        return False
    if ORDER_RE.search(line) or BARE_ORDER_RE.search(line) and line.lower().startswith(("consent", "final", "order")):
        return False
    if NMLS_RE.search(line) or REF_RE.search(line):
        return False
    if len(line) > 180:
        return False
    return bool(re.search(r"[A-Za-z]", line))


def parse_enforcement_text(
    text: str,
    *,
    source_url: str,
    source_year: int | None,
    source_family: str,
    source_page: str,
) -> list[dict[str, Any]]:
    lines = text.splitlines()
    current_heading = "UNKNOWN"
    current_month = None
    buffer: list[str] = []
    events: list[dict[str, Any]] = []

    def flush(extra: str | None = None) -> None:
        nonlocal buffer
        chunk_lines = buffer[:]
        if extra:
            chunk_lines.append(extra)
        buffer = []
        chunk = "\n".join(chunk_lines).strip()
        if not chunk:
            return
        order_match = ORDER_RE.search(chunk) or BARE_ORDER_RE.search(chunk)
        pdfs = re.findall(r"\[\[PDF ([^\]|]+)\|([^\]]*)\]\]", chunk)
        if not order_match and not pdfs and "Institution:" not in chunk:
            return
        order_number = normalize_order_number(order_match.group(1) if order_match else None)
        if not order_number and pdfs:
            order_number = normalize_order_number(BARE_ORDER_RE.search(pdfs[0][1] or "") and BARE_ORDER_RE.search(pdfs[0][1]).group(1) or None)
        caption_lines = [ln for ln in chunk_lines if looks_like_name_line(ln) and "[[PDF" not in ln]
        caption = " and ".join(caption_lines[:6]) if caption_lines else "UNKNOWN RESPONDENT"
        if caption == "UNKNOWN RESPONDENT":
            prose = re.split(r"\b(?:was |while |pled |agreed |failed |ordered )", chunk, maxsplit=1)[0]
            prose = ORDER_RE.sub("", prose)
            prose = normalize_space(re.sub(r"\[\[PDF[^\]]+\]\]", " ", prose))
            if 2 < len(prose) < 120:
                caption = prose.strip(" ,;-")
        body = chunk
        event_class, event_status, flags = classify_event(current_heading, body)
        amounts = parse_money(body)
        action_date = parse_action_date(body, source_year)
        nmls_ids = extract_nmls(body)
        references = extract_references(body)
        parties = []
        names = split_parties(caption)
        for idx, name in enumerate(names):
            party_type = classify_party(name, body + " " + source_family)
            nmls = nmls_ids[idx] if idx < len(nmls_ids) else (nmls_ids[0] if len(nmls_ids) == 1 and len(names) == 1 else None)
            state_ref = references[idx] if idx < len(references) else (references[0] if len(references) == 1 and len(names) == 1 else None)
            if state_ref and nmls and state_ref == nmls:
                state_ref = None
            parties.append(
                {
                    "legal_name": name,
                    "party_type": party_type,
                    "role_in_order": "respondent",
                    "nmls_id": nmls,
                    "state_reference": state_ref,
                    "city_state": None,
                }
            )
            loc = CITY_ST_RE.search(name)
            if loc:
                parties[-1]["city_state"] = f"{loc.group(1).strip()}, {loc.group(2)}"
                parties[-1]["legal_name"] = normalize_space(name[: loc.start()])
        document_url = pdfs[0][0] if pdfs else None
        occ_fp = fingerprint(
            {
                "source_url": source_url,
                "order_number": order_number,
                "caption": caption,
                "action_date": action_date,
                "document_url": document_url,
                "heading": current_heading,
            }
        )
        event_id = order_number or fingerprint(
            {"caption": caption, "action_date": action_date, "class": event_class, "year": source_year, "url": source_url}
        )
        events.append(
            {
                "source_dataset": DATASET,
                "source_family": source_family,
                "source_year": source_year,
                "source_url": source_url,
                "source_page": source_page,
                "index_location": f"{source_page}:{current_month or 'undated'}:{current_heading}",
                "order_number": order_number,
                "event_id": event_id,
                "event_class": event_class,
                "event_status": event_status,
                "flags": flags,
                "respondent_caption": caption,
                "action_date": action_date,
                "document_url": document_url,
                "all_document_urls": [p[0] for p in pdfs],
                "amounts": amounts,
                "parties": parties,
                "occurrence_fingerprint": occ_fp,
                "raw_excerpt": chunk[:4000],
                "public_eligibility": "internal_only",
                "monitoring_state": "baseline_only",
            }
        )

    for line in lines:
        heading = heading_at(line)
        if heading:
            flush()
            current_heading = heading
            continue
        if re.fullmatch(rf"(?:{'|'.join(MONTHS)})(?:\s+20\d{{2}})?", line, re.I):
            current_month = line
            continue
        if ORDER_RE.search(line) or (BARE_ORDER_RE.search(line) and re.search(r"Order|Consent|Final", line, re.I)):
            buffer.append(line)
            flush()
            continue
        buffer.append(line)
    flush()
    return events


def parse_depository_html(html: str, source_url: str) -> list[dict[str, Any]]:
    text = html_to_text(html, source_url)
    blocks = re.split(r"\n(?=20\d{2}\b|Institution[: ])", text)
    year = None
    events: list[dict[str, Any]] = []
    for block in blocks:
        stripped = block.strip()
        if re.fullmatch(r"20\d{2}", stripped):
            year = int(stripped)
            continue
        year_match = re.match(r"(20\d{2})\n", block)
        if year_match and "Institution" not in block.split("\n", 1)[0]:
            year = int(year_match.group(1))
            rest = block[year_match.end():]
        else:
            rest = block
        if "Institution" not in rest:
            continue
        name_match = re.search(r"Institution:\s*(.+)", rest)
        action_match = re.search(r"Type of Action:\s*(?:\[\[PDF ([^\]|]+)\|([^\]]*)\]\])?(.+)?", rest)
        date_match = re.search(r"Effective Date:\s*(.+)", rest)
        reason_match = re.search(r"Reason:\s*(.+)", rest)
        name = normalize_space(name_match.group(1) if name_match else "UNKNOWN INSTITUTION")
        pdf_url = None
        heading = "CONSENT ORDER"
        if action_match:
            pdf_url = action_match.group(1)
            heading = normalize_space(action_match.group(2) or action_match.group(3) or "CONSENT ORDER")
        action_date = parse_action_date(date_match.group(1) if date_match else "", year)
        order_number = None
        if pdf_url:
            stem = Path(urlparse(pdf_url).path).stem.upper()
            order_number = f"DEP-{stem}"
        event_class, event_status, flags = classify_event(heading, rest)
        occ_fp = fingerprint({"source_url": source_url, "name": name, "year": year, "pdf": pdf_url, "date": action_date})
        events.append(
            {
                "source_dataset": DATASET,
                "source_family": "NJ_DOBI_DEPOSITORY_ENFORCEMENT",
                "source_year": year,
                "source_url": source_url,
                "source_page": "bankdivenforce.html",
                "index_location": f"depository:{year}:{name}",
                "order_number": order_number,
                "event_id": order_number or occ_fp,
                "event_class": event_class if event_class != "OTHER" else "CONSENT_ORDER",
                "event_status": "FINAL",
                "flags": flags,
                "respondent_caption": name,
                "action_date": action_date,
                "document_url": pdf_url,
                "all_document_urls": [pdf_url] if pdf_url else [],
                "amounts": {"civil_penalty_amount": None, "restitution_amount": None, "reimbursement_amount": None},
                "parties": [
                    {
                        "legal_name": name,
                        "party_type": "DEPOSITORY_INSTITUTION",
                        "role_in_order": "respondent",
                        "nmls_id": None,
                        "state_reference": None,
                        "city_state": None,
                    }
                ],
                "occurrence_fingerprint": occ_fp,
                "raw_excerpt": rest[:4000],
                "reason": normalize_space(reason_match.group(1) if reason_match else ""),
                "source_status": "CURRENT",
                "public_eligibility": "internal_only",
                "monitoring_state": "baseline_only",
            }
        )
    return events


def parse_rescinded_html(html: str, source_url: str) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    skip_names = {"name of bank", "search", "type of action", "effective date", "rescinded date"}
    rows = re.findall(r"<tr\b[^>]*>(.*?)</tr>", html, flags=re.I | re.S)
    seen: set[tuple] = set()
    simple: list[tuple[str, str, str, str, str]] = []
    for row in rows:
        pdf = re.search(r'href=["\']([^"\']+\.pdf)["\'][^>]*>(.*?)</a>', row, flags=re.I | re.S)
        dates = re.findall(r"(\d{2}/\d{2}/20\d{2})", row)
        if not pdf or len(dates) < 2:
            continue
        raw_cells = re.findall(r"<td\b[^>]*>(.*?)</td>", row, flags=re.I | re.S)
        name = ""
        if raw_cells:
            name = normalize_space(re.sub(r"<[^>]+>", " ", raw_cells[0]))
        if not name:
            strong = re.search(r"<strong>([^<]+)</strong>", row, flags=re.I)
            name = normalize_space(strong.group(1) if strong else "")
        simple.append((name, pdf.group(1), pdf.group(2), dates[0], dates[1]))
    for name, href, label, effective, rescinded in simple:
        name = normalize_space(name)
        if name.lower() in skip_names or not name:
            continue
        pdf_url = urljoin(source_url, html_lib.unescape(href))
        key = (name, pdf_url, effective)
        if key in seen:
            continue
        seen.add(key)
        heading = normalize_space(re.sub(r"<[^>]+>", " ", label))
        action_date = parse_action_date(effective, None)
        stem = Path(urlparse(pdf_url).path).stem.upper()
        order_number = f"DEP-RESCINDED-{stem}"
        occ_fp = fingerprint({"url": source_url, "name": name, "pdf": pdf_url, "effective": effective})
        events.append(
            {
                "source_dataset": DATASET,
                "source_family": "NJ_DOBI_DEPOSITORY_ENFORCEMENT",
                "source_year": int(effective.split("/")[-1]) if effective else None,
                "source_url": source_url,
                "source_page": "rescinded.html",
                "index_location": f"rescinded:{name}:{effective}",
                "order_number": order_number,
                "event_id": order_number,
                "event_class": event_class_from_heading(heading) if heading else "CONSENT_ORDER",
                "event_status": "FINAL",
                "flags": {"revocation": False, "suspension": False, "surrender": False, "denial": False, "corrective": False},
                "respondent_caption": name,
                "action_date": action_date,
                "end_date": parse_action_date(rescinded, None),
                "document_url": pdf_url,
                "all_document_urls": [pdf_url],
                "amounts": {"civil_penalty_amount": None, "restitution_amount": None, "reimbursement_amount": None},
                "parties": [
                    {
                        "legal_name": name,
                        "party_type": "DEPOSITORY_INSTITUTION",
                        "role_in_order": "respondent",
                        "nmls_id": None,
                        "state_reference": None,
                        "city_state": None,
                    }
                ],
                "occurrence_fingerprint": occ_fp,
                "raw_excerpt": f"{name} {heading} {effective} rescinded {rescinded}",
                "source_status": "RESCINDED",
                "public_eligibility": "internal_only",
                "monitoring_state": "baseline_only",
            }
        )
    return events


CHARTER_CLASS_MAP = {
    "COMMERCIAL BANKS/STATE": "STATE_CHARTERED_BANK",
    "SAVINGS BANKS/STATE": "STATE_CHARTERED_SAVINGS_BANK",
    "SAVINGS AND LOAN/STATE": "STATE_CHARTERED_SAVINGS_AND_LOAN",
    "CREDIT UNIONS/STATE": "STATE_CHARTERED_CREDIT_UNION",
    "COMMERCIAL BANK (NATIONAL)": "FEDERAL_CHARTER_BANK",
    "NATIONAL BANK": "FEDERAL_CHARTER_BANK",
    "SAVINGS AND LOAN (NATIONAL)": "FEDERAL_CHARTER_THRIFT",
    "FEDERAL SAVINGS BANK": "FEDERAL_CHARTER_THRIFT",
    "FEDERAL SAVINGS AND LOAN": "FEDERAL_CHARTER_THRIFT",
    "CREDIT UNION (FEDERAL)": "FEDERAL_CHARTER_CREDIT_UNION",
    "COMMERCIAL BANK (OUT OF STATE)": "OUT_OF_STATE_BANK",
    "SAVINGS AND LOAN (OUT OF STATE)": "OUT_OF_STATE_THRIFT",
    "FOREIGN BANK OFFICE": "FOREIGN_BANK_OFFICE",
    "LIMITED PURPOSE TRUST": "LIMITED_PURPOSE_TRUST",
}


def map_charter_class(raw: str) -> str:
    key = normalize_space(raw).upper()
    if key in CHARTER_CLASS_MAP:
        return CHARTER_CLASS_MAP[key]
    if "CREDIT UNION" in key and "STATE" in key:
        return "STATE_CHARTERED_CREDIT_UNION"
    if "CREDIT UNION" in key and "FEDERAL" in key:
        return "FEDERAL_CHARTER_CREDIT_UNION"
    if "NATIONAL" in key:
        return "FEDERAL_CHARTER_BANK"
    if "OUT OF STATE" in key:
        return "OUT_OF_STATE_BANK"
    if "FOREIGN" in key:
        return "FOREIGN_BANK_OFFICE"
    if "LIMITED PURPOSE" in key or "TRUST" in key:
        return "LIMITED_PURPOSE_TRUST"
    if "FEDERAL SAVINGS" in key or "SAVINGS AND LOAN" in key:
        return "FEDERAL_CHARTER_THRIFT"
    if "STATE" in key and "CREDIT UNION" not in key:
        return "STATE_CHARTERED_BANK"
    return "OTHER_OFFICIAL_CLASS"


def parse_fi_list(html: str, source_url: str) -> list[dict[str, Any]]:
    published = None
    pub_match = re.search(r"page published\s+(\d{1,2}/\d{1,2}/20\d{2})", html, re.I)
    asof_match = re.search(r"as of\s+(\d{1,2}/\d{1,2}/20\d{2})", html, re.I)
    if pub_match:
        published = parse_action_date(pub_match.group(1), None)
    source_as_of = parse_action_date(asof_match.group(1), None) if asof_match else published
    rows = []
    blocks = re.split(r"<tr bgcolor='#CCCCCC'>", html)
    name_re = re.compile(r"<a[^>]*>(.*?)</a>", re.I | re.S)
    class_re = re.compile(r"-\s*<i>(.*?)</i>", re.I | re.S)
    addr_re = re.compile(r"</i>\s*<br><font[^>]*>(.*?)<br>(.*?)</font>", re.I | re.S)
    holding_re = re.compile(r"Holding Company:</b></i>\s*([^<\n]+)", re.I)
    regulator_re = re.compile(r"Regulator:</b></i>\s*(?:<a[^>]*>)?([^<\n]+)", re.I)
    for block in blocks:
        if "<i>" not in block or "Holding Company" not in block and "Regulator" not in block:
            if "<i>" not in block:
                continue
        name_match = name_re.search(block)
        class_match = class_re.search(block)
        if not name_match or not class_match:
            continue
        name = normalize_space(re.sub(r"<[^>]+>", " ", name_match.group(1)))
        raw_class = normalize_space(class_match.group(1))
        address = None
        city = None
        state = None
        addr_match = addr_re.search(block)
        if addr_match:
            address = normalize_space(addr_match.group(1))
            loc = normalize_space(addr_match.group(2))
            loc_m = re.match(r"(.+),\s*([A-Z]{2})\s+(\d{5})", loc)
            if loc_m:
                city, state = loc_m.group(1), loc_m.group(2)
            else:
                city = loc
        holding = normalize_space(holding_re.search(block).group(1)) if holding_re.search(block) else None
        regulator = normalize_space(regulator_re.search(block).group(1)) if regulator_re.search(block) else None
        charter = map_charter_class(raw_class)
        fp = fingerprint({"name": name, "class": raw_class, "address": address, "city": city})
        rows.append(
            {
                "legal_name": name,
                "institution_class_raw": raw_class,
                "institution_class": charter,
                "main_office_address": address,
                "city": city,
                "state": state,
                "holding_company": holding,
                "regulator": regulator,
                "source_status": "CURRENT_SNAPSHOT",
                "source_url": source_url,
                "source_as_of": source_as_of,
                "source_published": published,
                "row_fingerprint": fp,
                "public_eligibility": "internal_only",
            }
        )
    return rows


def load_fdic_nj() -> list[dict[str, Any]]:
    if not FDIC_NJ.exists():
        return []
    payload = json.loads(FDIC_NJ.read_text(encoding="utf-8"))
    return payload.get("banks") or []


def norm_name(value: str | None) -> str:
    text = normalize_space(value or "").upper()
    text = re.sub(r"[.,'/]", " ", text)
    text = re.sub(r"\b(THE|INC|LLC|L L C|N A|NATIONAL ASSOCIATION|CORP|CORPORATION|CO|COMPANY)\b", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def match_identity(party: dict[str, Any], fdic_index: dict[str, list[dict[str, Any]]], source_family: str) -> dict[str, Any]:
    name = party.get("legal_name") or ""
    nmls = party.get("nmls_id")
    party_type = party.get("party_type") or "OTHER"
    state_ref = party.get("state_reference")
    result = {
        "match_status": "UNRESOLVED",
        "match_method": "UNMATCHED_OFFICIAL_EVENT",
        "identifier_type": None,
        "identifier_value": None,
        "evidence": {},
        "public_eligibility": "internal_only",
        "unsafe_rejected": False,
    }
    if is_individual_class(party_type):
        if nmls and re.fullmatch(r"\d{3,12}", nmls):
            result.update(
                {
                    "match_status": "EXACT",
                    "match_method": "EXACT_NMLS_PERSON",
                    "identifier_type": "NMLS_PERSON",
                    "identifier_value": nmls,
                    "evidence": {"nmls_id": nmls, "source_label": "NMLS"},
                }
            )
        else:
            result.update(
                {
                    "match_status": "INTERNAL_ONLY_INDIVIDUAL",
                    "match_method": "INDIVIDUAL_NAME_HELD_INTERNAL",
                    "unsafe_rejected": not bool(nmls),
                }
            )
        result["public_eligibility"] = "internal_only"
        result["no_public_person_profile"] = True
        return result
    if nmls and re.fullmatch(r"\d{3,12}", nmls):
        ident_type = "NMLS_BRANCH" if party_type == "BRANCH" else "NMLS_INSTITUTION"
        result.update(
            {
                "match_status": "EXACT",
                "match_method": f"EXACT_{ident_type}",
                "identifier_type": ident_type,
                "identifier_value": nmls,
                "evidence": {"nmls_id": nmls},
            }
        )
        return result
    if state_ref and re.fullmatch(r"\d{7}", state_ref):
        result.update(
            {
                "match_status": "EXACT",
                "match_method": "EXACT_STATE_REFERENCE",
                "identifier_type": "STATE_LICENSE",
                "identifier_value": state_ref,
                "evidence": {"jurisdiction": "NJ", "license_class_context": party_type},
            }
        )
        return result
    key = norm_name(name)
    fdic_hits = fdic_index.get(key) or []
    if source_family == "NJ_DOBI_DEPOSITORY_ENFORCEMENT" and len(fdic_hits) == 1:
        cert = fdic_hits[0].get("fdic_cert")
        result.update(
            {
                "match_status": "EXACT",
                "match_method": "EXACT_FDIC",
                "identifier_type": "FDIC_CERT",
                "identifier_value": str(cert),
                "evidence": {"legal_name": name, "fdic_name": fdic_hits[0].get("name")},
            }
        )
        return result
    if len(fdic_hits) > 1:
        result.update(
            {
                "match_status": "REVIEW_REQUIRED",
                "match_method": "NAME_CITY_SEVERAL_CANDIDATES",
                "evidence": {"candidates": [h.get("fdic_cert") for h in fdic_hits]},
            }
        )
        return result
    result["match_method"] = "NAME_ONLY_REJECTED"
    result["unsafe_rejected"] = True
    result["match_status"] = "UNSAFE_REJECTED" if not ENTITY_HINT_RE.search(name) else "UNRESOLVED"
    if result["match_status"] == "UNSAFE_REJECTED":
        result["match_method"] = "UNSAFE_NAME_ALONE"
    return result


def match_fi_row(row: dict[str, Any], fdic_index: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    key = norm_name(row["legal_name"])
    hits = fdic_index.get(key) or []
    city = (row.get("city") or "").upper()
    if len(hits) == 1:
        return {
            "match_status": "EXACT",
            "match_method": "EXACT_FDIC",
            "identifier_type": "FDIC_CERT",
            "identifier_value": str(hits[0].get("fdic_cert")),
        }
    city_hits = [h for h in hits if city and city in (h.get("headquarters_address") or "").upper()]
    if len(city_hits) == 1:
        return {
            "match_status": "HIGH_CONFIDENCE",
            "match_method": "EXACT_LEGAL_NAME_CITY_CLASS",
            "identifier_type": "FDIC_CERT",
            "identifier_value": str(city_hits[0].get("fdic_cert")),
        }
    if len(hits) > 1:
        return {"match_status": "REVIEW_REQUIRED", "match_method": "NAME_SEVERAL_CANDIDATES"}
    if row.get("city") and row.get("legal_name"):
        return {"match_status": "HIGH_CONFIDENCE" if row.get("institution_class") != "OTHER_OFFICIAL_CLASS" else "UNRESOLVED",
                "match_method": "EXACT_LEGAL_NAME_CITY_CLASS" if row.get("institution_class") != "OTHER_OFFICIAL_CLASS" else "UNMATCHED_LIST_ROW"}
    return {"match_status": "UNRESOLVED", "match_method": "UNMATCHED_LIST_ROW"}


def http_get(url: str, timeout: int = 45) -> tuple[int, bytes, str]:
    req = Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urlopen(req, context=CTX, timeout=timeout) as resp:
        return resp.status, resp.read(), resp.geturl()


def fetch_with_retry(url: str, retries: int = 3) -> dict[str, Any]:
    last_error = None
    for attempt in range(retries):
        try:
            status, body, final_url = http_get(url)
            return {"status": status, "body": body, "final_url": final_url, "error": None}
        except HTTPError as exc:
            return {"status": exc.code, "body": b"", "final_url": url, "error": str(exc.reason)}
        except (URLError, TimeoutError, OSError) as exc:
            last_error = str(exc)
            time.sleep(0.4 * (attempt + 1))
    return {"status": None, "body": b"", "final_url": url, "error": last_error}


def save_html(key: str, body: bytes) -> Path:
    HTML_DIR.mkdir(parents=True, exist_ok=True)
    path = HTML_DIR / f"{key}.html"
    path.write_bytes(body)
    return path


def pdf_filename(url: str) -> str:
    parsed = urlparse(url)
    name = Path(parsed.path).name or sha256_text(url)[:16] + ".pdf"
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)


def extract_pdf_text(data: bytes) -> tuple[str, str]:
    if not data.startswith(b"%PDF"):
        return "", "FAILED"
    literals = re.findall(rb"\(((?:\\.|[^\\)]){4,})\)", data)
    decoded = []
    for raw in literals[:4000]:
        try:
            decoded.append(raw.decode("latin-1", errors="ignore"))
        except Exception:
            continue
    text = normalize_space(" ".join(decoded))
    if len(text) >= 80:
        return text[:20000], "EXTRACTED"
    if b"/Subtype/Image" in data or data.count(b"/Image") > 3:
        return "", "IMAGE_ONLY"
    if len(text) > 0:
        return text[:20000], "EXTRACTED"
    return "", "IMAGE_ONLY"


def discover_sources(year_filter: int | None = None) -> list[dict[str, Any]]:
    rows = []
    probes = [
        ("ocf_hub", OCF_HUB_URL, "NJ_DOBI_OCF_ENFORCEMENT", None),
        ("depository_index", DEPOSITORY_URL, "NJ_DOBI_DEPOSITORY_ENFORCEMENT", None),
        ("rescinded", RESCINDED_URL, "NJ_DOBI_DEPOSITORY_ENFORCEMENT", None),
        ("fi_list", FI_LIST_URL, "NJ_DOBI_FINANCIAL_INSTITUTION_LIST", None),
        ("license_search", LICENSE_SEARCH_URL, "NJ_DOBI_LICENSEE_SEARCH_VERIFICATION", None),
        ("license_banking", LICENSE_BANKING_URL, "NJ_DOBI_LICENSEE_SEARCH_VERIFICATION", None),
    ]
    years = [year_filter] if year_filter else list(range(2006, 2027))
    for year in years:
        probes.append((f"ocf_{year}", OCF_YEAR_URL.format(year=year), "NJ_DOBI_OCF_ENFORCEMENT", year))
        if year <= 2013:
            probes.append((f"archive_{year}", ARCHIVE_YEAR_URL.format(year=year), "NJ_DOBI_OCF_ENFORCEMENT", year))
    for key, url, family, year in probes:
        rec = fetch_with_retry(url)
        coverage = "SOURCE_NOT_ACQUIRED"
        if rec["status"] == 200 and rec["body"]:
            if family == "NJ_DOBI_FINANCIAL_INSTITUTION_LIST":
                coverage = "ACQUIRED_CURRENT_SNAPSHOT"
            elif family == "NJ_DOBI_LICENSEE_SEARCH_VERIFICATION":
                coverage = "SOURCE_AVAILABLE_BY_REQUEST"
            elif key == "depository_index":
                coverage = "ACQUIRED_CURRENT_SNAPSHOT"
            elif key.startswith("ocf_") and year and 2014 <= year <= 2022:
                coverage = "ACQUIRED_COMPLETE"
            elif key.startswith("archive_"):
                coverage = "ACQUIRED_PARTIAL_HISTORY"
            elif key == "rescinded":
                coverage = "ACQUIRED_PARTIAL_HISTORY"
            else:
                coverage = "ACQUIRED_COMPLETE"
            path = save_html(key, rec["body"])
            rec["path"] = path.relative_to(ROOT).as_posix()
            rec["sha256"] = sha256_bytes(rec["body"])
            rec["bytes"] = len(rec["body"])
        else:
            rec["path"] = None
            rec["sha256"] = None
            rec["bytes"] = 0
        if rec["status"] not in {200, 404, None} and rec["status"] and rec["status"] >= 400:
            coverage = "SOURCE_ACCESS_BLOCKED"
        rows.append(
            {
                "key": key,
                "url": url,
                "source_family": family,
                "source_year": year,
                "status": rec["status"],
                "final_url": rec.get("final_url"),
                "bytes": rec.get("bytes") or 0,
                "sha256": rec.get("sha256"),
                "path": rec.get("path"),
                "coverage_state": coverage,
                "error": rec.get("error"),
                "retrieved_at": iso(),
            }
        )
        print(f"{coverage:28} {rec['status']} {key}")
        time.sleep(0.08)
    return rows


def parse_all(discovery: list[dict[str, Any]]) -> dict[str, Any]:
    fdic_banks = load_fdic_nj()
    fdic_index: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for bank in fdic_banks:
        fdic_index[norm_name(bank.get("name"))].append(bank)

    occurrences: list[dict[str, Any]] = []
    documents: dict[str, dict[str, Any]] = {}
    events: dict[str, dict[str, Any]] = {}
    fi_rows: list[dict[str, Any]] = []

    for row in discovery:
        if row.get("status") != 200 or not row.get("path"):
            continue
        path = ROOT / row["path"]
        html = path.read_text(encoding="latin-1", errors="replace")
        family = row["source_family"]
        if family == "NJ_DOBI_OCF_ENFORCEMENT" and (row["key"].startswith("ocf_") or row["key"].startswith("archive_")):
            text = html_to_text(html, row["url"])
            parsed = parse_enforcement_text(
                text,
                source_url=row["url"],
                source_year=row.get("source_year"),
                source_family=family,
                source_page=row["key"],
            )
            occurrences.extend(parsed)
        elif row["key"] == "depository_index":
            occurrences.extend(parse_depository_html(html, row["url"]))
        elif row["key"] == "rescinded":
            occurrences.extend(parse_rescinded_html(html, row["url"]))
        elif family == "NJ_DOBI_FINANCIAL_INSTITUTION_LIST":
            fi_rows.extend(parse_fi_list(html, row["url"]))

    for occ in occurrences:
        for party in occ["parties"]:
            party.update(match_identity(party, fdic_index, occ["source_family"]))
        event_key = f"{DATASET}:{occ['event_id']}"
        existing = events.get(event_key)
        payload = dict(occ)
        payload["duplicate_occurrence"] = False
        if existing:
            existing.setdefault("occurrence_fingerprints", []).append(occ["occurrence_fingerprint"])
            existing.setdefault("source_urls", []).append(occ["source_url"])
            payload["duplicate_occurrence"] = True
        else:
            payload["occurrence_fingerprints"] = [occ["occurrence_fingerprint"]]
            payload["source_urls"] = [occ["source_url"]]
            events[event_key] = payload

    for row in fi_rows:
        row.update(match_fi_row(row, fdic_index))

    return {
        "occurrences": occurrences,
        "events": list(events.values()),
        "documents": list(documents.values()),
        "fi_rows": fi_rows,
        "fdic_nj_catalog_count": len(fdic_banks),
    }


def download_documents(occurrences: list[dict[str, Any]]) -> dict[str, Any]:
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    seen_url: dict[str, dict[str, Any]] = {}
    hash_groups: dict[str, list[str]] = defaultdict(list)
    downloaded = 0
    skipped = 0
    unavailable = 0
    index_only = 0
    for occ in occurrences:
        url = occ.get("document_url")
        if not url:
            occ["acquisition_state"] = "INDEX_ONLY"
            index_only += 1
            continue
        if url in seen_url:
            occ["acquisition_state"] = seen_url[url]["acquisition_state"]
            occ["content_hash"] = seen_url[url].get("content_hash")
            occ["local_pdf"] = seen_url[url].get("local_pdf")
            skipped += 1
            continue
        dest = PDF_DIR / pdf_filename(url)
        if dest.exists():
            data = dest.read_bytes()
            digest = sha256_bytes(data)
            text, extract_state = extract_pdf_text(data)
            rec = {
                "acquisition_state": "SKIPPED_EXISTING_HASH",
                "content_hash": digest,
                "local_pdf": dest.relative_to(ROOT).as_posix(),
                "byte_length": len(data),
                "text_extraction_state": extract_state,
                "extracted_text_hash": sha256_text(text) if text else None,
            }
            skipped += 1
        else:
            rec_http = fetch_with_retry(url)
            data = rec_http["body"]
            if rec_http["status"] == 404:
                occ["acquisition_state"] = "HTTP_404"
                seen_url[url] = {"acquisition_state": "HTTP_404"}
                unavailable += 1
                time.sleep(0.08)
                continue
            if rec_http["status"] != 200 or not data.startswith(b"%PDF"):
                occ["acquisition_state"] = "DOCUMENT_UNAVAILABLE"
                seen_url[url] = {"acquisition_state": "DOCUMENT_UNAVAILABLE"}
                unavailable += 1
                time.sleep(0.08)
                continue
            dest.write_bytes(data)
            digest = sha256_bytes(data)
            text, extract_state = extract_pdf_text(data)
            rec = {
                "acquisition_state": "DOCUMENT_DOWNLOADED",
                "content_hash": digest,
                "local_pdf": dest.relative_to(ROOT).as_posix(),
                "byte_length": len(data),
                "text_extraction_state": extract_state,
                "extracted_text_hash": sha256_text(text) if text else None,
            }
            downloaded += 1
        occ.update(rec)
        seen_url[url] = rec
        hash_groups[rec["content_hash"]].append(url)
        time.sleep(0.08)
    duplicate_content_groups = {h: urls for h, urls in hash_groups.items() if len(set(urls)) > 1}
    return {
        "downloaded": downloaded,
        "skipped_existing_hash": skipped,
        "unavailable": unavailable,
        "index_only": index_only,
        "unique_hashes": len(hash_groups),
        "duplicate_content_groups": duplicate_content_groups,
        "document_links": sum(1 for o in occurrences if o.get("document_url")),
    }


def summarize(discovery: list[dict[str, Any]], parsed: dict[str, Any], docs: dict[str, Any]) -> dict[str, Any]:
    events = parsed["events"]
    occs = parsed["occurrences"]
    parties = [p for e in events for p in e.get("parties") or []]
    fi = parsed["fi_rows"]

    def count_flag(flag: str) -> int:
        return sum(1 for e in events if (e.get("flags") or {}).get(flag))

    class_counts = Counter(e.get("event_class") for e in events)
    status_counts = Counter(e.get("event_status") for e in events)
    party_counts = Counter(p.get("party_type") for p in parties)
    match_counts = Counter(p.get("match_status") for p in parties)
    method_counts = Counter(p.get("match_method") for p in parties)
    fi_class = Counter(r.get("institution_class") for r in fi)
    fi_match = Counter(r.get("match_status") for r in fi)
    ocf_years: dict[str, str] = {}
    for r in discovery:
        if r.get("source_year") is None:
            continue
        if r["key"].startswith("archive_") and r.get("status") == 200:
            ocf_years[str(r["source_year"])] = r["coverage_state"]
        elif r["key"].startswith("ocf_") and r["key"][4:].isdigit():
            ocf_years.setdefault(str(r["source_year"]), r["coverage_state"])
            if r.get("status") == 200:
                ocf_years[str(r["source_year"])] = r["coverage_state"]
    dep_years = sorted(
        {
            e.get("source_year")
            for e in events
            if e.get("source_page") == "bankdivenforce.html" and e.get("source_year")
        }
    )
    dep_years_rescinded = sorted(
        {
            e.get("source_year")
            for e in events
            if e.get("source_page") == "rescinded.html" and e.get("source_year")
        }
    )
    unique_orders = sorted({e.get("order_number") for e in events if e.get("order_number")})
    multi_party = sum(1 for e in events if len(e.get("parties") or []) > 1)
    individual_internal = sum(1 for p in parties if p.get("match_status") == "INTERNAL_ONLY_INDIVIDUAL" or p.get("no_public_person_profile"))
    fi_published = next((r.get("source_published") for r in fi if r.get("source_published")), None)
    license_row = next((r for r in discovery if r["key"] == "license_banking"), None)
    return {
        "ticket": "NJ-LEND-001",
        "contract_version": CONTRACT_VERSION,
        "generated_at": iso(),
        "source_coverage": {
            "discovered_first_year": 2006,
            "latest_year": 2026,
            "ocf_years": ocf_years,
            "depository_years_listed": dep_years,
            "depository_years_rescinded": dep_years_rescinded,
            "institution_list_source_date": fi_published,
            "license_search_access": {
                "http_status": license_row.get("status") if license_row else None,
                "coverage_state": "SOURCE_AVAILABLE_BY_REQUEST",
                "active_only": True,
                "bulk_available": False,
                "automated_sample_size": 0,
            },
            "missing_years": [y for y, s in ocf_years.items() if s == "SOURCE_NOT_ACQUIRED"],
            "blocked_years": [y for y, s in ocf_years.items() if s == "SOURCE_ACCESS_BLOCKED"],
            "partial_history": [y for y, s in ocf_years.items() if s == "ACQUIRED_PARTIAL_HISTORY"],
            "discovery": [
                {k: v for k, v in r.items() if k != "body"}
                for r in discovery
            ],
        },
        "acquisition": {
            "index_occurrences": len(occs),
            "document_links": docs.get("document_links", 0),
            "downloaded_documents": docs.get("downloaded", 0),
            "index_only": docs.get("index_only", 0),
            "unavailable_documents": docs.get("unavailable", 0),
            "unique_hashes": docs.get("unique_hashes", 0),
            "unique_order_numbers": len(unique_orders),
            "duplicate_content_groups": len(docs.get("duplicate_content_groups") or {}),
            "multi_party_orders": multi_party,
            "source_hashes": {r["key"]: r.get("sha256") for r in discovery if r.get("sha256")},
            "raw_ignored_paths": ["data/raw/nj_dobi/"],
            "skipped_existing_hash": docs.get("skipped_existing_hash", 0),
        },
        "event_results": {
            "consent_orders": class_counts.get("CONSENT_ORDER", 0),
            "final_orders": class_counts.get("FINAL_ORDER", 0),
            "cease_and_desist_orders": class_counts.get("CEASE_AND_DESIST", 0) + class_counts.get("CEASE_AND_DESIST_AND_OSC", 0),
            "orders_to_show_cause": class_counts.get("ORDER_TO_SHOW_CAUSE", 0) + class_counts.get("CEASE_AND_DESIST_AND_OSC", 0),
            "revocations": count_flag("revocation"),
            "suspensions": count_flag("suspension"),
            "surrenders": count_flag("surrender"),
            "denials": count_flag("denial"),
            "penalties": sum(1 for e in events if (e.get("amounts") or {}).get("civil_penalty_amount")),
            "restitution": sum(1 for e in events if (e.get("amounts") or {}).get("restitution_amount")),
            "corrective_actions": count_flag("corrective"),
            "other": class_counts.get("OTHER", 0),
            "unclassified": sum(1 for e in events if e.get("event_class") not in EVENT_CLASS_MAP.values() and e.get("event_class") not in {"CONSENT_ORDER", "FINAL_ORDER", "CEASE_AND_DESIST", "ORDER_TO_SHOW_CAUSE", "CEASE_AND_DESIST_AND_OSC", "OTHER"}),
            "status_counts": dict(status_counts),
            "class_counts": dict(class_counts),
        },
        "respondents": {
            "institutions": party_counts.get("INSTITUTION", 0) + party_counts.get("DEPOSITORY_INSTITUTION", 0),
            "mortgage_companies": party_counts.get("MORTGAGE_COMPANY", 0) + party_counts.get("MORTGAGE_BROKER", 0) + party_counts.get("MORTGAGE_SERVICER", 0),
            "branches": party_counts.get("BRANCH", 0),
            "consumer_finance_entities": (
                party_counts.get("CONSUMER_LENDER", 0)
                + party_counts.get("SALES_FINANCE_COMPANY", 0)
                + party_counts.get("MONEY_TRANSMITTER", 0)
                + party_counts.get("CHECK_CASHER", 0)
                + party_counts.get("HOME_REPAIR_FINANCE_COMPANY", 0)
                + party_counts.get("MOTOR_VEHICLE_INSTALLMENT_SELLER", 0)
                + party_counts.get("PAWNBROKER", 0)
            ),
            "individuals": party_counts.get("INDIVIDUAL", 0) + party_counts.get("INDIVIDUAL_MLO", 0) + party_counts.get("QUALIFIED_INDIVIDUAL", 0),
            "other_classes": party_counts.get("OTHER", 0),
            "multi_respondent_events": multi_party,
            "internal_only_individuals": individual_internal,
            "party_type_counts": dict(party_counts),
        },
        "identity_results": {
            "exact_nmls_institution": method_counts.get("EXACT_NMLS_INSTITUTION", 0),
            "exact_nmls_branch": method_counts.get("EXACT_NMLS_BRANCH", 0),
            "exact_nmls_person": method_counts.get("EXACT_NMLS_PERSON", 0),
            "exact_fdic": method_counts.get("EXACT_FDIC", 0),
            "exact_rssd": 0,
            "exact_ncua": 0,
            "exact_state_reference": method_counts.get("EXACT_STATE_REFERENCE", 0),
            "high_confidence": match_counts.get("HIGH_CONFIDENCE", 0),
            "review_required": match_counts.get("REVIEW_REQUIRED", 0),
            "conflicts": match_counts.get("CONFLICT", 0),
            "unresolved": match_counts.get("UNRESOLVED", 0),
            "unsafe_rejected": match_counts.get("UNSAFE_REJECTED", 0),
            "no_public_person_profile_confirmation": True,
            "match_status_counts": dict(match_counts),
            "match_method_counts": dict(method_counts),
        },
        "financial_institution_list": {
            "source_rows": len(fi),
            "classes": dict(fi_class),
            "state_chartered_banks": fi_class.get("STATE_CHARTERED_BANK", 0) + fi_class.get("STATE_CHARTERED_SAVINGS_BANK", 0) + fi_class.get("STATE_CHARTERED_SAVINGS_AND_LOAN", 0),
            "state_chartered_credit_unions": fi_class.get("STATE_CHARTERED_CREDIT_UNION", 0),
            "federal_charters": fi_class.get("FEDERAL_CHARTER_BANK", 0) + fi_class.get("FEDERAL_CHARTER_THRIFT", 0) + fi_class.get("FEDERAL_CHARTER_CREDIT_UNION", 0),
            "exact_crosswalks": fi_match.get("EXACT", 0),
            "high_confidence": fi_match.get("HIGH_CONFIDENCE", 0),
            "review_required": fi_match.get("REVIEW_REQUIRED", 0),
            "conflicts": fi_match.get("CONFLICT", 0),
            "unresolved": fi_match.get("UNRESOLVED", 0),
        },
        "licensee_search": {
            "supported_fields": ["LicenseeName", "LicenseeRefNum", "LicenseType"],
            "sample_size": 0,
            "identity_upgrades": 0,
            "active_only_limitations": True,
            "bulk_availability": False,
            "public_records_request_artifact": "docs/nj-lend-001-dobi-public-records-request.md",
            "notes": "Landing page states the roster is actively licensed only and excludes banking institutions. Mortgage lenders/MLOs are directed to NMLS Consumer Access. Search posts to bnkLicenseeSearchServlet behind Incapsula; this ticket does not bypass WAF/CAPTCHA or enumerate the database.",
        },
        "database": {
            "available": False,
            "production_blocker": "No authorized LenderTrustHub database session in this worktree. Safe dormant acquisition and ingest code may merge without execute.",
        },
        "publication": {
            "new_jersey_route_created": False,
            "sitemap_change": False,
            "indexing_change": False,
            "public_profile_expansion": False,
            "mlo_publication": False,
            "historical_alerts": False,
            "manual_vercel_deployment": False,
        },
    }


def write_json(name: str, payload: Any) -> Path:
    GEN.mkdir(parents=True, exist_ok=True)
    path = GEN / name
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


def existing_nj_baseline() -> dict[str, Any]:
    """Committed-catalog baseline. Graph counts require an authorized database session."""
    fdic = load_fdic_nj()
    hmda_readme = ROOT / "data" / "hmda" / "new-jersey" / "README.md"
    hmda_note = hmda_readme.read_text(encoding="utf-8")[:500] if hmda_readme.exists() else None
    public_nj_profiles = 0
    local = ROOT / "app" / "local-lenders" / "[state]"
    return {
        "graph_queried": False,
        "reason": "No authorized LenderTrustHub database session. Counts below are committed catalog/HMDA/FDIC artifacts, not live graph rows.",
        "nj_nmls_institutions": "unknown_without_db",
        "nj_nmls_branches": "unknown_without_db",
        "nj_nmls_persons_held_internally": "unknown_without_db",
        "nj_state_identifiers": "unknown_without_db",
        "nj_headquartered_entities": "unknown_without_db",
        "nj_presence_entities": "unknown_without_db",
        "state_chartered_banks": "unknown_without_db",
        "state_chartered_credit_unions": "unknown_without_db",
        "existing_federal_enforcement": "unknown_without_db",
        "existing_nj_evidence": "HMDA New Jersey slice committed; no DOBI regulatory observations on origin/main",
        "public_nj_profiles": public_nj_profiles,
        "conflicts_unresolved": "unknown_without_db",
        "committed_fdic_nj_banks": len(fdic),
        "hmda_new_jersey_readme": hmda_note,
        "existing_local_lenders_new_jersey_hubs": True,
        "public_new_jersey_state_enforcement_route": False,
    }


def database_available() -> bool:
    env_path = ROOT / ".env.local"
    if not env_path.exists():
        return False
    text = env_path.read_text(encoding="utf-8", errors="replace")
    return CANONICAL_PROJECT_REF in text


def validate_repo_invariants() -> list[str]:
    errors = []
    if not MIGRATION.exists():
        errors.append("missing migration")
    sql = MIGRATION.read_text(encoding="utf-8")
    if "nj_dobi_orders" in sql or "nj_lenders" in sql:
        errors.append("state-silo table present")
    if "force row level security" not in sql:
        errors.append("RLS not forced")
    if "grant select" in sql.lower() and "anon" in sql.lower():
        errors.append("anon grant")
    if (ROOT / "app" / "new-jersey").exists():
        errors.append("public /new-jersey route created")
    if not CONTRACT_MD.exists() or not CONTRACT_SCHEMA.exists():
        errors.append("missing DOBI contract")
    return errors


def run(mode: str, year: int | None = None, download_pdfs: bool = True) -> dict[str, Any]:
    GEN.mkdir(parents=True, exist_ok=True)
    HTML_DIR.mkdir(parents=True, exist_ok=True)
    if mode in {"discover", "download", "inspect", "dry-run", "execute", "verify"} and not list(HTML_DIR.glob("ocf_2022.html")):
        discovery = discover_sources(year)
    elif mode == "local-input":
        discovery = json.loads((GEN / "discovery.json").read_text(encoding="utf-8")) if (GEN / "discovery.json").exists() else discover_sources(year)
    else:
        if (GEN / "discovery.json").exists() and mode in {"inspect", "dry-run", "execute", "verify", "local-input"}:
            discovery = json.loads((GEN / "discovery.json").read_text(encoding="utf-8"))
        else:
            discovery = discover_sources(year)
    if mode == "discover":
        write_json("discovery.json", discovery)
        return {"mode": mode, "discovery_rows": len(discovery)}

    write_json("discovery.json", discovery)
    parsed = parse_all(discovery)
    docs_meta = {
        "downloaded": 0,
        "skipped_existing_hash": 0,
        "unavailable": 0,
        "index_only": sum(1 for o in parsed["occurrences"] if not o.get("document_url")),
        "unique_hashes": 0,
        "duplicate_content_groups": {},
        "document_links": sum(1 for o in parsed["occurrences"] if o.get("document_url")),
    }
    if mode in {"download", "execute"} and download_pdfs:
        docs_meta = download_documents(parsed["occurrences"])
    elif mode in {"local-input", "inspect", "dry-run", "verify"}:
        for occ in parsed["occurrences"]:
            url = occ.get("document_url")
            if not url:
                occ["acquisition_state"] = "INDEX_ONLY"
                continue
            dest = PDF_DIR / pdf_filename(url)
            if dest.exists():
                data = dest.read_bytes()
                occ["acquisition_state"] = "SKIPPED_EXISTING_HASH"
                occ["content_hash"] = sha256_bytes(data)
                occ["text_extraction_state"] = extract_pdf_text(data)[1]
            elif mode == "download":
                occ["acquisition_state"] = "DOCUMENT_UNAVAILABLE"
        docs_meta["index_only"] = sum(1 for o in parsed["occurrences"] if not o.get("document_url"))
        hashes = [o.get("content_hash") for o in parsed["occurrences"] if o.get("content_hash")]
        docs_meta["unique_hashes"] = len(set(hashes))

    summary = summarize(discovery, parsed, docs_meta)
    summary["existing_nj_baseline"] = existing_nj_baseline()
    summary["mode"] = mode
    summary["invariants"] = validate_repo_invariants()
    summary["database"]["available"] = database_available()
    write_json("occurrences.json", parsed["occurrences"])
    write_json("events.json", parsed["events"])
    write_json("fi-list.json", parsed["fi_rows"])
    write_json("summary.json", summary)
    ledgers = {
        "exact": [p for e in parsed["events"] for p in e["parties"] if p.get("match_status") == "EXACT"],
        "high_confidence": [p for e in parsed["events"] for p in e["parties"] if p.get("match_status") == "HIGH_CONFIDENCE"],
        "review_required": [p for e in parsed["events"] for p in e["parties"] if p.get("match_status") == "REVIEW_REQUIRED"],
        "conflict": [p for e in parsed["events"] for p in e["parties"] if p.get("match_status") == "CONFLICT"],
        "unresolved": [p for e in parsed["events"] for p in e["parties"] if p.get("match_status") == "UNRESOLVED"],
        "unsafe_rejected": [p for e in parsed["events"] for p in e["parties"] if p.get("match_status") == "UNSAFE_REJECTED"],
        "internal_only_individual": [p for e in parsed["events"] for p in e["parties"] if p.get("match_status") == "INTERNAL_ONLY_INDIVIDUAL"],
        "multi_respondent": [e for e in parsed["events"] if len(e.get("parties") or []) > 1],
    }
    write_json("identity-ledgers.json", {k: v[:500] for k, v in ledgers.items()})
    print(json.dumps({"mode": mode, "occurrences": len(parsed["occurrences"]), "events": len(parsed["events"]), "fi_rows": len(parsed["fi_rows"])}, indent=2))
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="NJ-LEND-001 DOBI enforcement ingest")
    parser.add_argument("mode", choices=["discover", "download", "local-input", "inspect", "dry-run", "execute", "verify"])
    parser.add_argument("--year", type=int)
    parser.add_argument("--skip-pdfs", action="store_true")
    args = parser.parse_args()
    run(args.mode, year=args.year, download_pdfs=not args.skip_pdfs)


if __name__ == "__main__":
    main()

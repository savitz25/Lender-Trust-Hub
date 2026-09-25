#!/usr/bin/env python3
"""NV-LEND-001 — Nevada LenderTrustHub state snapshot.

The Nevada Division of Mortgage Lending (MLD) licenses mortgage companies, mortgage loan originators,
mortgage servicers and supplemental mortgage servicers through NMLS, and commercial-only mortgage
companies and MLOs, escrow agencies and agents, covered service providers and exempt company
registrations through its own SRS portal. Both are public search systems with no bulk file, so no
Nevada company census is built here; the national NMLS/HMDA spine is reused.

Stage 1 (--parse; needs gitignored raw captures in data/raw/nevada/private/):
  MLD enforcement year pages 2012-2026 (Order No., Name, License Type, Date, document link) and the
  2019-2026 order PDFs (first pages, text layer only, no OCR) -> data/nevada/nv-lend-001/mld-enforcement-orders.json
  production identity audit of curated LEI->NMLS rows -> data/nevada/nv-lend-001/prod-identity-audit-summary.json
Stage 2 (default): derived JSON + committed HMDA NV partition -> lib/nevada-intelligence/accepted-snapshot.json
  --check rebuilds stage 2 and compares the fingerprint.

Privacy (public repo): individual respondents are never named. Rows naming a person keep the company
party only (or no name at all), and their document links are replaced by a reference.
"""

from __future__ import annotations

import csv
import hashlib
import html as htmllib
import json
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "nevada" / "private"
STAGE = ROOT / "data" / "nevada" / "nv-lend-001"
LIB = ROOT / "lib" / "nevada-intelligence"
ART = ROOT / "artifacts"
HMDA_COUNTY = ROOT / "data" / "hmda" / "by-state" / "NV" / "county_market_summary.csv"
HMDA_LENDER = ROOT / "data" / "hmda" / "by-state" / "NV" / "lender_state_summary.csv"
HMDA_CURATED = ROOT / "data" / "hmda" / "nevada" / "lei_to_nmls_mapping.csv"
HMDA_INDEX = ROOT / "data" / "hmda" / "by-state" / "index.json"
FDIC_NV = ROOT / "lib" / "fdic" / "data" / "nevada.json"
GENERATED_AT = "2026-09-25T19:30:00Z"
CHECK = "--check" in sys.argv
MLD = "https://mld.nv.gov"
ENF_INDEX = f"{MLD}/enforcement/"
YEARS = list(range(2012, 2027))
DOC_YEARS = list(range(2019, 2027))
NRS = {
    "645A": "NRS 645A — Escrow Agencies and Agents",
    "645B": "NRS 645B — Mortgage Companies and Mortgage Loan Originators",
    "645E": "NRS 645E (printed on older orders; the chapter is no longer in the current NRS index)",
    "645F": "NRS 645F — Mortgage Lending and Related Professions",
}
COMPANY_RE = re.compile(
    r"\b(LLC|L\.L\.C\.|Inc\.?|Incorporated|Corp\.?|Corporation|Company|Co\.|Group|Partners|Holdings|Bank|Mortgage|"
    r"Lending|Loans?|Capital|Funding|Financial|Escrow|Services|Enterprises|Ltd\.?|LP|LLP|Investments?|Realty|Properties|"
    r"Solutions|Associates|Homes?|Direct|Network|Credit|Advisors|Consulting|Management|International|Legal|Mediation|"
    r"Systems|Fund|Title|Data|Global|Development|Hospitality|Construction|Foreclosure|Debt|Cash|Flow|Street)\b",
    re.I,
)
# A party is published only when the text before any trade-name clause is a company on its own.
TRADE_NAME_RE = re.compile(r"\s+(?:dba|d/b/a|aka|a/k/a|fka|f/k/a)\s+", re.I)
PERSON_ENTITY_RE = re.compile(r"\b(?:Living Trust|Family Trust|Revocable|Estate of)\b", re.I)
SUFFIX_RE = re.compile(r"^(?:LLC|L\.L\.C\.|Inc\.?|Incorporated|Corp\.?|Corporation|Ltd\.?|LP|LLP|Jr\.?|Sr\.?|II|III|IV|P\.C\.|PC)$", re.I)
ACTION_SUFFIX_RE = re.compile(r"\s*[-–—]?\s*(?:Amended\s+)?(?:Consent Order|Final Order|Order to Cease and Desist|Cease and Desist(?: Order)?|Settlement(?: Agreement)?|Suspension(?: Order)?|Order)\s*$", re.I)


def generic_only(segment: str) -> bool:
    """True for a fragment with no distinctive word: "Company", "Associates LLC", "A", "EAG"."""
    words = re.findall(r"[A-Za-z][A-Za-z.&/'-]*", segment)
    return all(COMPANY_RE.fullmatch(w) or SUFFIX_RE.match(w) or (len(w) <= 4 and w.upper() == w) for w in words)


def party_kind(party: str) -> str:
    head = TRADE_NAME_RE.split(party, maxsplit=1)[0]
    if PERSON_ENTITY_RE.search(head):
        return "person"
    segments = [s for s in re.split(r"\s+&\s+|\s+and\s+", head) if s.strip()]
    for segment in segments:
        if generic_only(segment):
            continue
        if not COMPANY_RE.search(segment):
            return "person"
    return "company" if any(COMPANY_RE.search(s) for s in segments) else "person"


# Credentials printed in an order caption. Company classes are published; individual classes are counted only.
CRED_RE = re.compile(
    r"(Supplemental\s*Mortgage\s*Servicer|Mortgage\s*(?:Broker|Banker|Company|Servicer|Agent|Loan\s*Originator)|Escrow\s*Agenc(?:y|ies)|Escrow\s*Agent)"
    r"\s*Licen[sc]e\s*(?:No\.?|Number|#)?\s*:?\s*(\d{3,6})\b(?:[^0-9]{0,60}?NMLS[^0-9]{0,25}?(\d{4,8}))?",
    re.I,
)
COMPANY_CLASSES = {"mortgage broker", "mortgage banker", "mortgage company", "mortgage servicer", "supplemental mortgage servicer", "escrow agency", "escrow agencies"}


def credentials(text: str, company_parties: list[str]) -> tuple[list[dict], int, int]:
    """Return (published company credentials, withheld individual credentials, other NMLS mentions)."""
    company: dict[tuple, dict] = {}
    persons: set[tuple] = set()
    seen_nmls: set[str] = set()
    for m in CRED_RE.finditer(text):
        cls = " ".join(m.group(1).lower().split())
        cls = re.sub(r"loan\s*originator", "loan originator", cls)
        lic, nmls = m.group(2), m.group(3)
        if nmls:
            seen_nmls.add(nmls)
        # MLD company licenses carry 3-4 digit numbers; individual (agent/MLO) licenses carry 5. A 5-digit number
        # under a company class label is an individual printed with the company's class, so it stays withheld.
        if cls in COMPANY_CLASSES and len(lic) <= 4:
            company.setdefault((cls, lic, nmls), {"licenseClass": cls.title(), "nevadaLicenseNumber": lic, "nmls": nmls})
        else:
            persons.add((cls, lic, nmls))
    tokens = {t.lower() for p in company_parties for t in re.findall(r"[A-Za-z]{5,}", TRADE_NAME_RE.split(p)[0])} - {"mortgage", "lending", "company", "financial", "services", "group", "capital", "holdings", "title", "escrow", "loans", "incorporated", "corporation", "management", "consulting", "partners"}
    other = 0
    for m in re.finditer(r"NMLS[^0-9]{0,25}?(\d{4,8})", text):
        nmls = m.group(1)
        if nmls in seen_nmls:
            continue
        seen_nmls.add(nmls)
        before = text[max(0, m.start() - 60) : m.start()].lower()
        if tokens and any(t in before for t in tokens) and "branch" not in before and "location" not in before:
            company.setdefault(("nmls only", None, nmls), {"licenseClass": None, "nevadaLicenseNumber": None, "nmls": nmls})
        else:
            other += 1
    return list(company.values()), len(persons), other
# Company-only index rows whose document filename names an individual (reviewed by hand).
DOC_URL_WITHHELD = {"MLD-ENF:2019:121"}
ACTION_TYPES = [
    "Consent Order",
    "Order to Cease and Desist",
    "Cease and Desist",
    "Final Order",
    "Settlement",
    "Suspension",
    "Order",
]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def clean(fragment: str) -> str:
    return " ".join(htmllib.unescape(re.sub(r"<[^>]+>", " ", fragment)).split())


def iso(d: str) -> str | None:
    m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})", d.strip())
    if not m:
        return None
    try:
        return date(int(m.group(3)), int(m.group(1)), int(m.group(2))).isoformat()
    except ValueError:
        return None


def action_type(name: str) -> str:
    for t in ACTION_TYPES:
        if re.search(r"\b" + re.escape(t) + r"\b", name, re.I):
            return t
    return "NOT_STATED_IN_INDEX"


def split_respondents(name: str) -> tuple[str, list[str]]:
    """Return the respondent text (without the action suffix) and its parties.

    Parties split on commas and "and"; a bare corporate or generational suffix after a comma
    ("X, LLC", "Y, Jr.") is rejoined to the party before it. "&" never splits a name.
    """
    base = re.split(r"\s+[-–—]\s+|\s*-\s*(?=Consent|Final|Order|Cease)|,\s*(?=Consent Order|Final Order|Order|Cease|Settlement)", name)[0].strip()
    base = ACTION_SUFFIX_RE.sub("", base).strip(" ,")
    base = re.sub(r"\.and\b", ". and", base)
    parts = [p.strip() for p in re.split(r",|\s+and\s+", base) if p.strip()]
    parties: list[str] = []
    for p in parts:
        lead = p.split()[0]
        if parties and (SUFFIX_RE.match(lead) or re.match(r"^(?:dba|d/b/a|aka|a/k/a|fka|f/k/a)$", lead, re.I)):
            parties[-1] = f"{parties[-1]}{',' if SUFFIX_RE.match(lead) else ''} {p}"
        elif parties and generic_only(TRADE_NAME_RE.split(p, maxsplit=1)[0]) and not SUFFIX_RE.match(lead):
            # "X and Company", "A and F Enterprise Inc.": the fragment belongs to the name before it
            parties[-1] = f"{parties[-1]} and {p}"
        elif parties and generic_only(parties[-1]):
            parties[-1] = f"{parties[-1]} and {p}"
        else:
            parties.append(p)
    return base, parties


def parse_year_page(year: int) -> tuple[list[dict], dict]:
    path = RAW / f"enf-{year}.html"
    meta = json.loads((RAW / f"enf-{year}.html.meta.json").read_text(encoding="utf-8"))
    h = path.read_text(encoding="utf-8")
    start = h.find("<main")
    body = h[start:] if start >= 0 else h
    end = body.find("<footer")
    body = body[:end] if end > 0 else body
    rows = []
    for table in re.findall(r"<table[\s\S]*?</table>", body):
        header = None
        for tr in re.findall(r"<tr[\s\S]*?</tr>", table):
            cells = [clean(c) for c in re.findall(r"<t[hd][\s\S]*?</t[hd]>", tr)]
            links = re.findall(r'href="([^"]+)"', tr)
            if header is None:
                header = cells
                continue
            rows.append({"cells": cells, "links": links, "header": header})
    return rows, {"url": meta["url"], "retrieved_at": meta["retrieved_at"], "sha256": meta["sha256"], "status": meta["status"]}


def pdf_text(path: Path, pages: int = 3) -> tuple[str, int | None]:
    try:
        import pypdf

        reader = pypdf.PdfReader(str(path))
        text = " ".join(" ".join((p.extract_text() or "").split()) for p in reader.pages[:pages])
        return text, len(reader.pages)
    except Exception:  # noqa: BLE001 — a scanned or damaged PDF simply has no text layer
        return "", None


def parse() -> None:
    manifest = json.loads((RAW / "orders-manifest.json").read_text(encoding="utf-8"))
    docs = {(d["year"], d["row"], d["link"]): d for d in manifest["documents"]}
    lookups = json.loads((RAW / "nmls-lookups.json").read_text(encoding="utf-8")) if (RAW / "nmls-lookups.json").exists() else {}
    orders = []
    pages_meta = {}
    review: list[dict] = []
    person_surnames: set[str] = set()
    seq = 0
    for year in YEARS:
        rows, meta = parse_year_page(year)
        pages_meta[str(year)] = {**meta, "rows": len(rows)}
        for i, r in enumerate(rows):
            if r["header"] != ["Order No.", "Name", "License Type", "Date"]:
                raise SystemExit(f"{year}: unexpected header {r['header']}")
            order_no, name, code, when = r["cells"][:4]
            base, parties = split_respondents(name)
            kinds = [party_kind(p) for p in parties]
            if kinds and all(k == "company" for k in kinds):
                shape = "COMPANY"
            elif "company" in kinds:
                shape = "COMPANY_AND_PERSON"
            else:
                shape = "PERSON"
            company_parties = [p for p, k in zip(parties, kinds) if k == "company"]
            company_tokens = {t.lower() for p, k in zip(parties, kinds) if k == "company" for t in re.findall(r"[A-Za-z]+", p)}
            for p, k in zip(parties, kinds):
                surname = TRADE_NAME_RE.split(p)[0].split()[-1].strip(".,'\"")
                if k == "person" and len(surname) > 3 and not generic_only(surname) and surname.lower() not in company_tokens:
                    person_surnames.add(surname)
            seq += 1
            row_id = f"MLD-ENF:{year}:{seq}"
            documents = []
            creds: list[dict] = []
            withheld_creds = 0
            other_mentions = 0
            for j, href in enumerate(r["links"]):
                url = MLD + href if href.startswith("/") else href
                d = docs.get((year, i, j))
                text, n_pages = ("", None)
                retrieved = bool(d and d.get("sha256"))
                if retrieved:
                    text, n_pages = pdf_text(RAW / d["file"])
                    c, w, o = credentials(text, company_parties)
                    creds.extend(x for x in c if x not in creds)
                    withheld_creds += w
                    other_mentions += o
                documents.append(
                    {
                        "ref": hashlib.sha256(url.encode("utf-8")).hexdigest()[:16],
                        "url": url if shape == "COMPANY" and row_id not in DOC_URL_WITHHELD else None,
                        "urlWithheld": shape != "COMPANY" or row_id in DOC_URL_WITHHELD,
                        "retrieved": retrieved,
                        "pdfSha256": d.get("sha256") if d else None,
                        "pdfPages": n_pages,
                        "textLayer": bool(text.strip()) if retrieved else None,
                        "inDocumentScope": year in DOC_YEARS,
                    }
                )
            attached = []
            for cred in creds:
                hit = lookups.get(cred["nmls"] or "")
                if hit and hit.get("resultState") == "EXACT_IDENTITY":
                    attached.append({"nmls": cred["nmls"], "publicationState": hit.get("publicationState"), "basis": "EXACT_NMLS_PRINTED_IN_ORDER"})
            orders.append(
                {
                    "id": row_id,
                    "grain": "MLD_ENFORCEMENT_INDEX_ROW",
                    "indexYear": year,
                    "orderNumber": order_no,
                    "dateAsPublished": when,
                    "date": iso(when),
                    "licenseCode": code,
                    "licenseChapter": NRS.get(code, f"NRS {code} (as published)"),
                    "actionTypeFromName": action_type(name),
                    "respondentClass": shape,
                    "respondentAsPublished": base if shape == "COMPANY" else (" and ".join(company_parties) + " and an individual respondent (name withheld)" if company_parties else None),
                    "nameWithheld": shape != "COMPANY",
                    "documents": documents,
                    "companyCredentialsPrinted": creds or None,
                    "individualCredentialsWithheld": withheld_creds,
                    "otherNmlsMentions": other_mentions,
                    "attachment": "EXACT_NMLS" if attached else "STANDALONE",
                    "attachedIdentities": attached or None,
                }
            )
            if "--review" in sys.argv:
                review.append({"id": row_id, "parties": list(zip(parties, kinds)), "urls": r["links"], "creds": creds})
    blob = json.dumps(orders, ensure_ascii=False).lower()
    published_tokens = {t.lower() for o in orders for t in re.findall(r"[A-Za-z]+", o["respondentAsPublished"] or "")}
    # a surname that is also a word of a published company name (e.g. a family-named corporation) is that company's
    leaked = sorted(s for s in person_surnames if s.lower() in blob and s.lower() not in published_tokens)
    if leaked:
        raise SystemExit(f"individual respondent leaked into derived rows: {len(leaked)} surname(s)")
    if review:
        (RAW / "review.json").write_text(json.dumps(review, indent=1, ensure_ascii=False), encoding="utf-8")
    intro = "MLD's Enforcement section links a Summary of Enforcement Actions page for each year from 2012 to 2026 (Order No., Name, License Type, Date, document)."
    consent = clean(re.search(r"<main[\s\S]*?</main>", (RAW / "consent.html").read_text(encoding="utf-8")).group(0))
    consent_meta = json.loads((RAW / "consent.html.meta.json").read_text(encoding="utf-8"))
    (STAGE / "mld-enforcement-orders.json").write_text(
        json.dumps(
            {
                "sourceIndex": ENF_INDEX,
                "indexRetrievedAt": pages_meta["2026"]["retrieved_at"],
                "indexIntro": intro[:600],
                "yearPages": pages_meta,
                "documentScopeYears": DOC_YEARS,
                "documentsManifestRetrievedAt": manifest["retrieved_at"],
                "proposedConsentOrders": {
                    "source": consent_meta["url"],
                    "retrieved_at": consent_meta["retrieved_at"],
                    "statement": "None at this time." if "None at this time" in consent else consent[:200],
                    "count": 0 if "None at this time" in consent else None,
                },
                "orders": orders,
            },
            indent=1,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    audit = json.loads((RAW / "prod-audit.json").read_text(encoding="utf-8"))
    c = Counter((v.get("resultState"), v.get("publicationState")) for v in audit["results"].values())
    (STAGE / "prod-identity-audit-summary.json").write_text(
        json.dumps(
            {
                "observedAt": audit["observed_at"],
                "method": "Read-only exact NMLS lookups of the curated Nevada LEI-to-NMLS rows against production GET /api/specialist-execution/v2?q=NMLS {id}. No writes.",
                "curatedRows": audit["curated_rows"],
                "distinctNmls": audit["distinct_nmls"],
                "exactIdentityPublicProfile": c[("EXACT_IDENTITY", "public_profile")],
                "exactIdentityUnpublishedResearch": c[("EXACT_IDENTITY", "unpublished_research_identity")],
                "publicationRestrictedPerson": c[("PUBLICATION_RESTRICTED", "restricted")],
                "noConfidentMatch": c[("NO_CONFIDENT_MATCH", None)],
                "otherStates": {f"{k[0]}/{k[1]}": n for k, n in c.items() if k not in {("EXACT_IDENTITY", "public_profile"), ("EXACT_IDENTITY", "unpublished_research_identity"), ("PUBLICATION_RESTRICTED", "restricted"), ("NO_CONFIDENT_MATCH", None)}},
                "scope": "Curated HMDA reporters only; not a census of Nevada-licensed companies.",
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def num(row: dict, key: str) -> int:
    raw = (row.get(key) or "0").replace(",", "").strip()
    try:
        return int(float(raw))
    except ValueError:
        return 0


def hmda_block() -> dict:
    rows = list(csv.DictReader(HMDA_COUNTY.open(encoding="utf-8")))
    s = lambda k: sum(num(r, k) for r in rows)  # noqa: E731
    apps, orig, den = s("total_applications"), s("total_originations"), s("denial_count")
    idx = (json.loads(HMDA_INDEX.read_text(encoding="utf-8")).get("by_state") or {}).get("NV") or {}
    leis = {r["lei"].strip() for r in csv.DictReader(HMDA_LENDER.open(encoding="utf-8")) if (r.get("lei") or "").strip()}
    curated = list(csv.DictReader(HMDA_CURATED.open(encoding="utf-8")))
    counties = sorted(
        (
            {
                "county_fips": (r.get("county_fips") or "").zfill(5),
                "county_name": r.get("county_name") or "",
                "applications": num(r, "total_applications"),
                "originations": num(r, "total_originations"),
                "denials": num(r, "denial_count"),
            }
            for r in rows
        ),
        key=lambda c: (-c["applications"], c["county_fips"]),
    )
    return {
        "year": 2025,
        "source": "Committed HMDA 2025 Nevada partition data/hmda/by-state/NV/county_market_summary.csv (reused; not re-ingested).",
        "source_as_of": "HMDA 2025",
        "retrieved_at": None,
        "coverage_state": "KNOWN",
        "applications": apps,
        "originations": orig,
        "denials": den,
        "denials_as_pct_of_total_applications": round(den / apps * 100, 2) if apps else None,
        "purchase_applications": s("purchase_count"),
        "refinance_applications": s("refinance_count"),
        "purpose_other_applications": s("purpose_other_count"),
        "apps_conventional": s("apps_conventional"),
        "apps_fha": s("apps_fha"),
        "apps_va": s("apps_va"),
        "apps_usda_other": s("apps_usda_other"),
        "county_count": len(rows),
        "top_counties": counties[:10],
        "distinct_leis": len(leis),
        "index_json_applications": idx.get("applications"),
        "index_json_originations": idx.get("originations"),
        "curated_lei_to_nmls_rows": len(curated),
        "curated_distinct_nmls": len({"".join(ch for ch in (r.get("nmls_id") or "") if ch.isdigit()) for r in curated} - {""}),
        "lei_nmls_bridge": "REUSED_EXISTING_CURATED_MAP_ONLY — no new NMLS↔LEI bridge in this ticket",
        "application_is_not_lender": True,
        "lei_is_not_nv_license": True,
    }


def build() -> dict:
    enf = json.loads((STAGE / "mld-enforcement-orders.json").read_text(encoding="utf-8"))
    audit = json.loads((STAGE / "prod-identity-audit-summary.json").read_text(encoding="utf-8"))
    orders = enf["orders"]
    hmda = hmda_block()
    fdic = json.loads(FDIC_NV.read_text(encoding="utf-8"))
    if hmda["applications"] != 119768 or hmda["originations"] != 69135 or hmda["denials"] != 20655:
        raise SystemExit(f"Nevada HMDA drifted: {hmda['applications']} / {hmda['originations']} / {hmda['denials']}")
    if hmda["applications"] != hmda["index_json_applications"] or hmda["originations"] != hmda["index_json_originations"]:
        raise SystemExit("Nevada HMDA county totals differ from data/hmda/by-state/index.json")
    scope = [o for o in orders if o["indexYear"] in DOC_YEARS]
    docs = [d for o in orders for d in o["documents"]]
    scope_docs = [d for o in scope for d in o["documents"]]
    by_year = {str(y): sum(1 for o in orders if o["indexYear"] == y) for y in YEARS}
    codes = Counter(o["licenseCode"] for o in orders)
    printed = [o for o in scope if o["companyCredentialsPrinted"]]
    attached = [o for o in orders if o["attachment"] == "EXACT_NMLS"]
    snapshot = {
        "contract_name": "lender-nv-state-intel-v1",
        "version": "1.0.0",
        "ticket": "NV-LEND-001",
        "geography": "NV",
        "publication_status": "published",
        "path": "/nevada",
        "generated_at": GENERATED_AT,
        "source_as_of": {
            "mld_licensing": "NMLS Consumer Access and the Nevada SRS public search (live search; no bulk file)",
            "mld_enforcement": "order dates per index row; index pages retrieved " + enf["indexRetrievedAt"],
            "mld_proposed_consent_orders": enf["proposedConsentOrders"]["retrieved_at"],
            "hmda": "HMDA 2025",
            "fdic": fdic.get("updated"),
        },
        "regulators": {
            "name": "Nevada Department of Business & Industry — Division of Mortgage Lending",
            "short": "MLD",
            "home": f"{MLD}/",
            "searchLicensees": f"{MLD}/industry-info/search-licensees/",
            "srsPublicSearch": "https://licensing-prod-nvmld.state-reg.tylerapp.com/public-search",
            "nmls": "https://www.nmlsconsumeraccess.org/",
            "enforcement": ENF_INDEX,
            "proposedConsentOrders": enf["proposedConsentOrders"]["source"],
            "complaints": f"{MLD}/consumer-info/submit-a-complaint/",
            "complaintForm": "http://hal.nv.gov/form/Complaint_Forms/Complaint_Form",
            "nrs": NRS,
            "nmls_role": "MLD points public verification of mortgage companies, mortgage loan originators, mortgage servicers, supplemental mortgage servicers and NMLS exempt company registrations to NMLS Consumer Access. NMLS is licensing infrastructure, not the Nevada regulator.",
            "srs_role": "MLD's SRS portal is the public search for commercial-only mortgage companies and MLOs, escrow agencies and agents, credit service organizations, covered service organizations and providers, and exempt company registrations.",
        },
        "licenses": {
            "nmls_classes": [
                {"id": "mortgage_company", "label": "Mortgage Company", "grain": "company license", "system": "NMLS", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "mlo", "label": "Mortgage Loan Originator", "grain": "individual license", "system": "NMLS", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "mortgage_servicer", "label": "Mortgage Servicer", "grain": "company license", "system": "NMLS", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "supplemental_mortgage_servicer", "label": "Supplemental Mortgage Servicer", "grain": "company license", "system": "NMLS", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "nmls_exempt_registration", "label": "NMLS Exempt Company Registration", "grain": "company registration", "system": "NMLS", "roster": "NOT_ACQUIRED", "rows": None},
            ],
            "srs_classes": [
                {"id": "commercial_only_mortgage_company", "label": "Commercial Only Mortgage Company", "grain": "company license", "system": "SRS", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "commercial_only_mlo", "label": "Commercial Only Mortgage Loan Originator", "grain": "individual license", "system": "SRS", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "escrow_agency", "label": "Escrow Agency", "grain": "company license", "system": "SRS", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "escrow_agent", "label": "Escrow Agent", "grain": "individual license", "system": "SRS", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "credit_service_organization", "label": "Credit Service Organization", "grain": "company registration", "system": "SRS", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "covered_service_organization", "label": "Covered Service Organization", "grain": "company license", "system": "SRS", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "covered_service_provider", "label": "Covered Service Provider", "grain": "individual license", "system": "SRS", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "srs_exempt_registration", "label": "Exempt Company Registration", "grain": "company registration", "system": "SRS", "roster": "NOT_ACQUIRED", "rows": None},
            ],
            "branch": {"label": "Branch", "grain": "location under a company", "roster": "NOT_ACQUIRED", "rows": None, "branch_is_not_company": True},
            "verification": {"nmls": "KNOWN", "srs": "KNOWN"},
            "bulkRoster": "NOT_ACQUIRED — NMLS Consumer Access is search-only, and the SRS public search is a Next.js application with no export, state-filtered download or public API (probed 2026-09-25 within the time box)",
            "consumerAccessScraped": False,
            "srsScraped": False,
            "commercial_only_is_not_consumer_mortgage_authority": True,
            "no_combined_total": True,
        },
        "existing_coverage_audit": audit,
        "enforcement": {
            "coverage_state": "KNOWN",
            "indexRetrievedAt": enf["indexRetrievedAt"],
            "indexIntro": enf["indexIntro"],
            "yearsListedOnIndex": YEARS,
            "yearsWithPublishedPages": YEARS,
            "documentScopeYears": DOC_YEARS,
            "indexRows": len(orders),
            "rowsByYear": by_year,
            "rowsInDocumentScope": len(scope),
            "documentsLinked": len(docs),
            "rowsWithoutDocumentLink": sum(1 for o in orders if not o["documents"]),
            "documentsRetrievedInScope": sum(1 for d in scope_docs if d["retrieved"]),
            "documentsWithTextLayerInScope": sum(1 for d in scope_docs if d["textLayer"]),
            "licenseCodeCounts": dict(sorted(codes.items())),
            "licenseChapters": NRS,
            "actionTypeFromNameCounts": dict(sorted(Counter(o["actionTypeFromName"] for o in orders).items())),
            "respondentClassCounts": dict(sorted(Counter(o["respondentClass"] for o in orders).items())),
            "rowsWithCompanyCredentialsPrintedInScope": len(printed),
            "distinctCompanyNmlsPrintedInScope": len({c["nmls"] for o in printed for c in o["companyCredentialsPrinted"] if c["nmls"]}),
            "individualCredentialsWithheldInScope": sum(o["individualCredentialsWithheld"] for o in scope),
            "exactNmlsAttachments": len(attached),
            "distinctNmlsAttached": len({a["nmls"] for o in attached for a in o["attachedIdentities"]}),
            "nameOnlyAttachments": 0,
            "ocrPerformed": False,
            "personNamesPublished": False,
            "orders": orders,
            "caveat": (
                "Each row is one line of MLD's Summary of Enforcement Actions (Order No., Name, License Type, Date, document). "
                "The License Type column is the NRS chapter MLD printed, not a class read from the order. The action type comes "
                "from the published name suffix. An index row is an order document, not a finding of a violation on its own; "
                "a Consent Order is a settlement. Individual respondents are not named and their document links are withheld. "
                "Order PDFs were read only for 2019-2026 and only where they carry a text layer (no OCR). A printed NMLS ID is "
                "recorded; no row is attached to an NMLS profile in this ticket, and no name is used to join."
            ),
        },
        "proposed_consent_orders": {**enf["proposedConsentOrders"], "proposed_is_not_final": True},
        "hmda": hmda,
        "complaints": {
            "intake": "KNOWN",
            "intakeNote": "MLD's Compliance Investigation Unit takes complaints about escrow agencies and agents, mortgage companies, MLOs, mortgage servicers and covered service providers by online form, email, mail or fax.",
            "providerLevelRows": None,
            "capability": "NOT_ACQUIRED",
            "outcomes": "REQUEST_ONLY",
            "complaint_is_not_finding": True,
        },
        "depository": {
            "source": "Existing LenderTrustHub FDIC Nevada overlay (lib/fdic/data/nevada.json)",
            "fdic_rows": len(fdic.get("banks") or []),
            "source_as_of": fdic.get("updated"),
            "not_in_mortgage_license_counts": True,
        },
        "identity": {
            "company": "NMLS company ID is the identity. One company can hold mortgage company, servicer and exempt-registration relationships and stays one company. MLD publishes no roster, so no Nevada company is created here.",
            "person": "MLOs, commercial-only MLOs, escrow agents and covered service providers are people; verification is NMLS Consumer Access or the SRS search. No person pages.",
            "branch": "A branch is a location under a company, not a company.",
            "enforcement": "Attached only with a printed NMLS ID, a Nevada license number or another explicit identifier. Printed identifiers are recorded; every row stays standalone in this ticket.",
            "rejected_joins": ["Name-only company match", "Name-only adverse attachment", "License code to NMLS without an accepted bridge", "HMDA LEI to Nevada license"],
        },
        "expansion_ledger": {
            "NET_NEW_CANONICAL_ORGANIZATIONS": 0,
            "NET_NEW_PUBLIC_LENDER_PROFILES": 0,
            "NET_NEW_PUBLIC_PERSON_PAGES": 0,
            "NEW_STANDALONE_ENFORCEMENT_EVENTS": len(orders),
            "GRAPH_WRITES": 0,
            "CLAIM_ELIGIBILITY_BROADENED": False,
        },
        "capability_matrix": [
            {"capability": "MLD mortgage regulation (NMLS and SRS classes)", "state": "KNOWN"},
            {"capability": "NMLS Consumer Access verification", "state": "KNOWN"},
            {"capability": "Nevada SRS public search verification", "state": "KNOWN"},
            {"capability": "Nevada bulk mortgage license roster", "state": "NOT_ACQUIRED"},
            {"capability": "Nevada MLO bulk population", "state": "NOT_ACQUIRED"},
            {"capability": "Nevada branch census", "state": "NOT_ACQUIRED"},
            {"capability": "Escrow agency and agent rosters", "state": "NOT_ACQUIRED"},
            {"capability": "MLD enforcement index 2012-2026", "state": "KNOWN"},
            {"capability": "MLD order documents read 2019-2026", "state": "PARTIAL"},
            {"capability": "MLD proposed consent orders", "state": "KNOWN"},
            {"capability": "MLD complaint intake", "state": "KNOWN"},
            {"capability": "MLD provider-level complaints", "state": "NOT_ACQUIRED"},
            {"capability": "HMDA 2025 Nevada activity", "state": "KNOWN"},
            {"capability": "Name-only enforcement attachment", "state": "UNSUPPORTED"},
            {"capability": "Combined Nevada lender total", "state": "UNSUPPORTED"},
        ],
        "semantic_guardrails": [
            "mortgage company != MLO != branch != servicer != escrow agency != escrow agent != commercial-only license",
            "company identity != license relationship; one NMLS company with several Nevada licenses is one company",
            "license != HMDA activity; HMDA LEI != NMLS; HMDA application != Nevada license",
            "index row != finding; Consent Order = settlement; proposed consent order != final",
            "complaint != enforcement action; missing != zero",
            "no combined Nevada lender total; no ranking; no Trust Score",
        ],
        "noCombinedDenominator": True,
        "noLocalRoutes": True,
        "no_ranking": True,
        "no_trust_score": True,
    }
    blob = json.dumps(snapshot, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    snapshot["fingerprint"] = hashlib.sha256(blob).hexdigest()
    return snapshot


def main() -> int:
    if "--parse" in sys.argv:
        STAGE.mkdir(parents=True, exist_ok=True)
        parse()
    snap = build()
    target = LIB / "accepted-snapshot.json"
    if CHECK:
        committed = json.loads(target.read_text(encoding="utf-8"))
        if committed.get("fingerprint") != snap["fingerprint"]:
            raise SystemExit(f"NV snapshot drifted: builder={snap['fingerprint']} committed={committed.get('fingerprint')}")
        print("fingerprint check OK", snap["fingerprint"])
        return 0
    text = json.dumps(snap, indent=2, ensure_ascii=False) + "\n"
    ART.mkdir(parents=True, exist_ok=True)
    LIB.mkdir(parents=True, exist_ok=True)
    (ART / "nv-lend-001-public-snapshot.json").write_text(text, encoding="utf-8")
    target.write_text(text, encoding="utf-8")
    e = snap["enforcement"]
    print("fingerprint", snap["fingerprint"])
    print("rows", e["indexRows"], e["licenseCodeCounts"], e["respondentClassCounts"], "scope", e["rowsInDocumentScope"], "company creds", e["rowsWithCompanyCredentialsPrintedInScope"], "attached", e["exactNmlsAttachments"])
    print("hmda", snap["hmda"]["applications"], snap["hmda"]["originations"], snap["hmda"]["denials"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

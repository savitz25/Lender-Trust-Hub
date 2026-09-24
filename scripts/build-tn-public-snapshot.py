#!/usr/bin/env python3
"""TN-LEND-001 — Tennessee LenderTrustHub state snapshot.

TDFI regulates mortgage lenders, mortgage loan brokers, mortgage loan servicers, and mortgage loan
originators (Tenn. Code Ann. § 45-13-201(a)); public verification of mortgage companies and MLOs is
NMLS Consumer Access. TDFI publishes no bulk mortgage license roster, so no Tennessee company census
is built here. The national NMLS/HMDA spine is reused.

Stage 1 (--parse; needs gitignored raw captures in data/raw/tennessee/private/):
  TDFI Enforcement Actions index + year pages + linked order PDFs (first-page text only, no OCR)
  -> data/tennessee/tn-lend-001/tdfi-enforcement-orders.json
  production identity audit of curated LEI->NMLS rows -> data/tennessee/tn-lend-001/prod-identity-audit-summary.json
Stage 2 (default): derived JSON + committed HMDA TN partition -> lib/tennessee-intelligence/accepted-snapshot.json
  --check rebuilds stage 2 and compares the fingerprint.
"""

from __future__ import annotations

import csv
import hashlib
import html as htmllib
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "tennessee" / "private"
STAGE = ROOT / "data" / "tennessee" / "tn-lend-001"
LIB = ROOT / "lib" / "tennessee-intelligence"
ART = ROOT / "artifacts"
HMDA_COUNTY = ROOT / "data" / "hmda" / "by-state" / "TN" / "county_market_summary.csv"
HMDA_LENDER = ROOT / "data" / "hmda" / "by-state" / "TN" / "lender_state_summary.csv"
HMDA_CURATED = ROOT / "data" / "hmda" / "tennessee" / "lei_to_nmls_mapping.csv"
HMDA_INDEX = ROOT / "data" / "hmda" / "by-state" / "index.json"
FDIC_TN = ROOT / "lib" / "fdic" / "data" / "tennessee.json"
GENERATED_AT = "2026-09-24T19:48:00Z"
INDEX_RETRIEVED_AT = "2026-09-24T17:08:00Z"
CHECK = "--check" in sys.argv
ENF_INDEX = "https://www.tn.gov/tdfi/enforcement-actions.html"
YEAR_PAGES = {
    2023: "2023-enforcement-actions",
    2022: "2022-enforcement-actions",
    2021: "2021-enforcement-actions",
    2020: "2020-enforcement-actions1",
    2019: "ea-2019",
    2014: "ea-2014",
    2011: "2011-ea",
}
NON_MORTGAGE_TITLE = re.compile(r"quick cash|fast cash|cash xpress|cash depot|money man pawn|auto buyers", re.I)
COMPANY_RE = re.compile(r"\b(LLC|L\.L\.C\.|Inc\.?|Corp|Corporation|Company|Group|Partners|Finance)\b", re.I)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def order_type(title: str) -> str:
    t = title.lower()
    if "agreed order of dismissal" in t:
        return "Agreed Order of Dismissal"
    if "order of dismissal" in t:
        return "Final Order of Dismissal"
    if t.startswith("ecd") or "emergency" in t:
        return "Emergency Cease and Desist"
    if "final order" in t:
        return "Final Order"
    return "Order (title as published)"


def parse() -> None:
    import pypdf

    manifest = json.loads((RAW / "orders-manifest.json").read_text(encoding="utf-8"))
    index = (RAW / "tdfi-enforcement-index.html").read_text(encoding="utf-8")
    index_text = " ".join(htmllib.unescape(re.sub(r"<[^>]+>", " ", index)).split())
    listed_years = sorted({int(y) for y in re.findall(r"\b(20[12]\d)\b", index_text[index_text.find("Emergency Orders") :][:600])}, reverse=True)
    linked_years = sorted(YEAR_PAGES, reverse=True)
    orders = []
    for i, r in enumerate(manifest):
        path = RAW / f"order-{i:02d}.pdf"
        text = ""
        pages = None
        if path.exists():
            rd = pypdf.PdfReader(str(path))
            pages = len(rd.pages)
            text = " ".join(" ".join((p.extract_text() or "").split()) for p in rd.pages)
        title = r["title"]
        lic = re.search(r"License No\. (\d+)\) as a (mortgage lender|mortgage loan broker|mortgage loan servicer)", text)
        nmls = re.findall(r"NMLS[^0-9]{0,20}(\d{3,8})", text)
        docket = re.search(r"(?:APD (?:Case|Docket) No\.?)\s*([0-9.]+-\d+J)", text)
        entered = re.search(r"entered and effective this the (\d+)\w* day of (\w+), (\d{4})", text)
        if NON_MORTGAGE_TITLE.search(title):
            cls = "NON_MORTGAGE_BY_TITLE"
        elif lic:
            cls = lic.group(2).upper().replace(" ", "_")
        elif re.search(r"Tennessee Mortgage Act|Residential Lending, Brokerage", text):
            cls = "MORTGAGE_UNSPECIFIED"
        else:
            cls = "LICENSE_CLASS_NOT_DETERMINED"
        respondent = re.sub(r"^(Final Order(?: of Dismissal)?|Agreed Order of Dismissal|ECD)\s*[-–]\s*|\s*-\s*Agreed Order of Dismissal$", "", title).strip()
        is_company = bool(COMPANY_RE.search(respondent)) and cls != "NON_MORTGAGE_BY_TITLE"
        # Non-mortgage orders are out of scope for this hub; they are counted, not named.
        orders.append(
            {
                "id": f"TDFI-ENF:{r['year']}:{i + 1}",
                "grain": "TDFI_ENFORCEMENT_ORDER_DOCUMENT",
                "indexYear": r["year"],
                "titleAsPublished": title if is_company else None,
                "respondent": respondent if is_company else None,
                "respondentClass": "OUT_OF_SCOPE" if cls == "NON_MORTGAGE_BY_TITLE" else ("COMPANY" if is_company else "PERSON_OR_SOLE_PROPRIETOR"),
                "nameWithheld": not is_company,
                "orderTypeFromTitle": order_type(title),
                "licenseClass": cls,
                "tennesseeLicenseNumber": lic.group(1) if lic else None,
                "nmlsPrinted": sorted(set(nmls)) or None,
                "apdDocket": docket.group(1) if docket else None,
                "orderEntered": f"{entered.group(2)} {entered.group(1)}, {entered.group(3)}" if entered else None,
                "initialOrderLanguage": bool(re.search(r"Initial Order is not a Final Order but shall become a Final Order", text)),
                "textLayer": bool(text.strip()),
                "pdfPages": pages,
                "pdfSha256": sha(path) if path.exists() else None,
                "sourceUrl": r["url"] if is_company else None,
                "yearPage": r["page"],
                "retrievalStatus": "RETRIEVED" if path.exists() else "SOURCE_404",
                "attachment": "STANDALONE",
            }
        )
    (STAGE / "tdfi-enforcement-orders.json").write_text(
        json.dumps(
            {
                "sourceIndex": ENF_INDEX,
                "indexSha256": sha(RAW / "tdfi-enforcement-index.html"),
                "indexRetrievedAt": INDEX_RETRIEVED_AT,
                "indexStatement": "Emergency Orders and Final Orders issued as a result of a formal administrative action may be published on this website. These Orders have been subject to the opportunity for a hearing.",
                "yearsListedOnIndex": listed_years,
                "yearsWithPublishedPages": linked_years,
                "yearsListedWithoutPages": [y for y in listed_years if y not in linked_years],
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
                "method": "Read-only exact NMLS lookups of the curated Tennessee LEI-to-NMLS rows against production GET /api/specialist-execution/v2?q=NMLS {id}. No writes.",
                "curatedRows": audit["curated_rows"],
                "distinctNmls": audit["distinct_nmls"],
                "exactIdentityPublicProfile": c[("EXACT_IDENTITY", "public_profile")],
                "exactIdentityUnpublishedResearch": c[("EXACT_IDENTITY", "unpublished_research_identity")],
                "publicationRestrictedPerson": c[("PUBLICATION_RESTRICTED", "restricted")],
                "noConfidentMatch": c[("NO_CONFIDENT_MATCH", None)],
                "scope": "Curated HMDA reporters only; not a census of Tennessee-licensed companies.",
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
    idx = (json.loads(HMDA_INDEX.read_text(encoding="utf-8")).get("by_state") or {}).get("TN") or {}
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
        "source": "Committed HMDA 2025 Tennessee partition data/hmda/by-state/TN/county_market_summary.csv (reused; not re-ingested).",
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
        "curated_lei_to_nmls_rows": len(curated),
        "curated_distinct_nmls": len({"".join(ch for ch in (r.get("nmls_id") or "") if ch.isdigit()) for r in curated} - {""}),
        "lei_nmls_bridge": "REUSED_EXISTING_CURATED_MAP_ONLY — no new NMLS↔LEI bridge in this ticket",
        "application_is_not_lender": True,
        "lei_is_not_tn_license": True,
    }


def build() -> dict:
    enf = json.loads((STAGE / "tdfi-enforcement-orders.json").read_text(encoding="utf-8"))
    audit = json.loads((STAGE / "prod-identity-audit-summary.json").read_text(encoding="utf-8"))
    orders = enf["orders"]
    hmda = hmda_block()
    fdic = json.loads(FDIC_TN.read_text(encoding="utf-8"))
    if hmda["applications"] != 302219 or hmda["originations"] != 175419 or hmda["applications"] != hmda["index_json_applications"]:
        raise SystemExit(f"Tennessee HMDA drifted: {hmda['applications']} / {hmda['originations']}")
    classes = Counter(o["licenseClass"] for o in orders)
    mortgage = [o for o in orders if o["licenseClass"].startswith("MORTGAGE")]
    snapshot = {
        "contract_name": "lender-tn-state-intel-v1",
        "version": "1.0.0",
        "ticket": "TN-LEND-001",
        "geography": "TN",
        "publication_status": "published",
        "path": "/tennessee",
        "generated_at": GENERATED_AT,
        "source_as_of": {
            "tdfi_licensing": "NMLS Consumer Access (live search; no bulk file)",
            "tdfi_enforcement": "order entry dates per document; index retrieved " + enf["indexRetrievedAt"],
            "hmda": "HMDA 2025",
            "fdic": fdic.get("updated"),
        },
        "regulators": {
            "name": "Tennessee Department of Financial Institutions",
            "short": "TDFI",
            "division": "Compliance Division",
            "statute": "Tennessee Residential Lending, Brokerage and Servicing Act (Tenn. Code Ann. § 45-13-201(a))",
            "regulated": "https://www.tn.gov/tdfi/who-we-regulate.html",
            "mortgage": "https://www.tn.gov/tdfi/mortgage-consumer-lending/mortgage.html",
            "mlo": "https://www.tn.gov/tdfi/mortgage-consumer-lending/mlo.html",
            "enforcement": ENF_INDEX,
            "complaints": "https://www.tn.gov/tdfi/consumer-resources.html",
            "complaintForm": "https://stateoftennessee.formstack.com/forms/consumer_complaint",
            "reverseMortgage": "https://www.tn.gov/tdfi/mortgage-consumer-lending/mortgage/reverse-mortgage.html",
            "nonprofitExemption": "https://www.tn.gov/tdfi/mortgage-consumer-lending/mortgage/mort-non-profit.html",
            "nmls": "https://www.nmlsconsumeraccess.org/",
            "nmls_role": "TDFI requires mortgage filings through NMLS and points public verification of mortgage companies and MLOs to NMLS Consumer Access. NMLS is licensing infrastructure, not the Tennessee regulator.",
        },
        "licenses": {
            "classes": [
                {"id": "lender", "label": "Mortgage lender", "grain": "company license", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "broker", "label": "Mortgage loan broker", "grain": "company license", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "servicer", "label": "Mortgage loan servicer", "grain": "company license", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "mlo", "label": "Mortgage loan originator", "grain": "individual license", "roster": "NOT_ACQUIRED", "rows": None},
                {"id": "branch", "label": "Branch", "grain": "location under a company", "roster": "NOT_ACQUIRED", "rows": None},
            ],
            "verification": "NMLS Consumer Access (KNOWN)",
            "bulkRoster": "NOT_ACQUIRED — TDFI's regulated-entities page sends mortgage companies and MLOs to NMLS Consumer Access; no Tennessee export was found",
            "consumerAccessScraped": False,
            "adjacentCategoriesDeferred": ["Reverse Mortgage authority", "Nonprofit exempt from mortgage licensing"],
            "no_combined_total": True,
        },
        "existing_coverage_audit": audit,
        "enforcement": {
            "coverage_state": "PARTIAL",
            "indexStatement": enf["indexStatement"],
            "yearsListedOnIndex": enf["yearsListedOnIndex"],
            "yearsWithPublishedPages": enf["yearsWithPublishedPages"],
            "yearsListedWithoutPages": enf["yearsListedWithoutPages"],
            "ordersListed": len(orders),
            "ordersRetrieved": sum(1 for o in orders if o["retrievalStatus"] == "RETRIEVED"),
            "licenseClassCounts": dict(sorted(classes.items())),
            "mortgageRelatedOrders": len(mortgage),
            "exactNmlsAttachments": 0,
            "exactTennesseeLicenseNumbersPrinted": sum(1 for o in orders if o["tennesseeLicenseNumber"]),
            "nameOnlyAttachments": 0,
            "ocrPerformed": False,
            "personNamesPublished": False,
            "orders": orders,
            "caveat": (
                "Each row is one order document linked from the TDFI Enforcement Actions pages. Order titles are kept as TDFI "
                "published them. An Initial Order states it is not a Final Order until the appeal period passes. A dismissal is not "
                "a finding. License class comes only from the order text; scanned orders without a text layer were not OCR'd, so "
                "their class is not determined. No order printed an NMLS ID, so none is attached to an NMLS profile. 2024-2026 are "
                "listed on the index without published pages; that is unknown, not zero."
            ),
        },
        "hmda": hmda,
        "complaints": {
            "intake": "KNOWN",
            "intakeNote": "TDFI Consumer Resources requires a formal written complaint (online form).",
            "providerLevelRows": None,
            "capability": "REQUEST_ONLY",
            "historicalConsumersStatementUsedAsCount": False,
            "complaint_is_not_finding": True,
        },
        "depository": {
            "source": "Existing LenderTrustHub FDIC Tennessee overlay (lib/fdic/data/tennessee.json)",
            "fdic_rows": len(fdic.get("banks") or []),
            "source_as_of": fdic.get("updated"),
            "not_in_mortgage_license_counts": True,
        },
        "identity": {
            "company": "NMLS company ID is the identity. TDFI publishes no separate company roster, so no Tennessee company is created here.",
            "person": "MLO verification is NMLS Consumer Access. No person pages.",
            "enforcement": "Attached only with a printed NMLS ID or an accepted Tennessee-license-to-NMLS bridge. None exists, so every order is standalone.",
            "rejected_joins": ["Name-only company match", "Name-only adverse attachment", "Tennessee license number to NMLS without an accepted bridge"],
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
            {"capability": "TDFI mortgage regulation (lender, broker, servicer, MLO)", "state": "KNOWN"},
            {"capability": "NMLS Consumer Access verification", "state": "KNOWN"},
            {"capability": "Tennessee bulk mortgage license roster", "state": "NOT_ACQUIRED"},
            {"capability": "Tennessee MLO bulk population", "state": "NOT_ACQUIRED"},
            {"capability": "Tennessee branch census", "state": "NOT_ACQUIRED"},
            {"capability": "TDFI enforcement orders linked 2011-2023", "state": "PARTIAL"},
            {"capability": "TDFI enforcement 2024-2026", "state": "UNKNOWN"},
            {"capability": "License class of scanned orders", "state": "UNKNOWN"},
            {"capability": "TDFI provider-level complaints", "state": "REQUEST_ONLY"},
            {"capability": "HMDA 2025 Tennessee activity", "state": "KNOWN"},
            {"capability": "Reverse mortgage and nonprofit exemption lists", "state": "NOT_ACQUIRED"},
            {"capability": "Name-only enforcement attachment", "state": "UNSUPPORTED"},
            {"capability": "Combined Tennessee lender total", "state": "UNSUPPORTED"},
        ],
        "semantic_guardrails": [
            "lender != broker != servicer != MLO != branch",
            "license != HMDA activity; HMDA LEI != NMLS",
            "Initial Order != Final Order until it becomes final",
            "dismissal != finding; complaint != finding",
            "missing != zero; unknown year != zero orders",
            "no combined Tennessee lender total; no ranking; no Trust Score",
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
            raise SystemExit(f"TN snapshot drifted: builder={snap['fingerprint']} committed={committed.get('fingerprint')}")
        print("fingerprint check OK", snap["fingerprint"])
        return 0
    text = json.dumps(snap, indent=2, ensure_ascii=False) + "\n"
    ART.mkdir(parents=True, exist_ok=True)
    LIB.mkdir(parents=True, exist_ok=True)
    (ART / "tn-lend-001-public-snapshot.json").write_text(text, encoding="utf-8")
    target.write_text(text, encoding="utf-8")
    e = snap["enforcement"]
    print("fingerprint", snap["fingerprint"])
    print("orders", e["ordersListed"], e["licenseClassCounts"], "years listed", e["yearsListedOnIndex"], "no pages", e["yearsListedWithoutPages"])
    print("hmda", snap["hmda"]["applications"], snap["hmda"]["originations"], snap["hmda"]["denials"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

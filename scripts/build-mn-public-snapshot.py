#!/usr/bin/env python3
"""MN-LEND-001 — Minnesota Department of Commerce mortgage licensing over the existing NMLS/HMDA spine.

No Minnesota company census is built here; the national NMLS/HMDA spine is reused.

Stage 1 (--parse; needs gitignored captures in data/raw/minnesota/private/, retrieved 2026-09-26):
  Commerce License Lookup page (routes both mortgage classes to NMLS Consumer Access)
  CARDS (Commerce Actions and Regulatory Documents Search) Enforcement Actions, Industry type
    "Mortgage", signed 2022-01-01..2026-09-26: the complete result set (50 rows; the 2022-2023 and
    2024-2026 halves return 18 + 32 with no further pages). Company order PDFs were read for the
    printed caption license number and NMLS ID; 22 of 37 returned HTTP 429 and were not read.
    Individuals' orders were not downloaded. Individual respondents are never written.
  2025 Minnesota Statutes chapters 58 and 58A (Office of the Revisor of Statutes), verbatim excerpts.
  Production identity audit: read-only exact NMLS lookups of the curated Minnesota LEI-to-NMLS rows
    and of NMLS IDs printed in the orders (GET /api/specialist-execution/v2?q=NMLS {id}).
  Writes data/minnesota/mn-lend-001/*.json (committed).
Stage 2 (default): derived JSON + committed HMDA MN partition -> lib/minnesota-intelligence/accepted-snapshot.json
  and artifacts/mn-lend-001-public-snapshot.json. --check compares both.
"""
from __future__ import annotations

import csv
import hashlib
import html
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "minnesota" / "private"
STAGE = ROOT / "data" / "minnesota" / "mn-lend-001"
SNAP = ROOT / "lib" / "minnesota-intelligence" / "accepted-snapshot.json"
ART = ROOT / "artifacts" / "mn-lend-001-public-snapshot.json"
HMDA_COUNTY = ROOT / "data" / "hmda" / "by-state" / "MN" / "county_market_summary.csv"
HMDA_LENDER = ROOT / "data" / "hmda" / "by-state" / "MN" / "lender_state_summary.csv"
HMDA_CURATED = ROOT / "data" / "hmda" / "minnesota" / "lei_to_nmls_mapping.csv"
HMDA_INDEX = ROOT / "data" / "hmda" / "by-state" / "index.json"
# County names only (the by-state partition leaves county_name blank); counts come from HMDA_COUNTY.
HMDA_COUNTY_NAMES = ROOT / "data" / "hmda" / "minnesota" / "county_market_summary_mn.csv"
GENERATED_AT = "2026-09-26T16:30:00Z"
RETRIEVED_AT = "2026-09-26T15:05:00Z"
CARDS = "https://cards.web.commerce.state.mn.us/enforcement-actions"
CARDS_QUERY = CARDS + "?doSearch=true&industry=Mortgage&signedFromDate=2022-01-01&signedToDate=2026-09-26"
LICENSE_LOOKUP = "https://mn.gov/commerce/licensing/license-lookup/"
REVISOR = "https://www.revisor.mn.gov/statutes/cite/"
CONSUMER_ACCESS = "https://www.nmlsconsumeraccess.org/"
COMPANY_RE = re.compile(
    r"\b(LLC|L\.L\.C|INC|INCORPORATED|CORP|CORPORATION|MORTGAGE|LENDERS|LOANS?|SERVICING|SRVICING|FINANCIAL|EQUITY|RATE|FIN|MANAGEMENT|BROKERS|COMPANY|BANK|LENDING)\b",
    re.I,
)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def text_of(fragment: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", fragment)).split())


def page_text(path: Path) -> str:
    raw = path.read_text(encoding="utf-8", errors="replace")
    return text_of(re.sub(r"<script.*?</script>|<style.*?</style>", "", raw, flags=re.S))


def quote(text: str, start: str, end: str) -> str:
    i = text.find(start)
    if i < 0:
        raise SystemExit(f"missing source sentence: {start!r}")
    j = text.find(end, i)
    if j < 0:
        raise SystemExit(f"missing sentence end: {end!r}")
    return text[i : j + len(end)]


def iso(mdy: str) -> str:
    m, d, y = mdy.split("/")
    return f"{y}-{int(m):02d}-{int(d):02d}"


def parse_cards(path: Path) -> list[dict]:
    raw = path.read_text(encoding="utf-8")
    body = raw[raw.find("<tbody") : raw.find("</tbody>")]
    rows = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", body, re.S):
        cells = re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)
        items = lambda c: [text_of(x) for x in re.findall(r"<li>(.*?)</li>", c, re.S)]  # noqa: E731
        link = re.findall(r'<a href="([^"]+)"[^>]*>([^<]+)</a>', cells[0])
        rows.append(
            {
                "document": link[0][1].strip(),
                "documentUrl": "https://cards.web.commerce.state.mn.us" + html.unescape(link[0][0]).replace("{", "%7B").replace("}", "%7D"),
                "industry": text_of(cells[1]),
                "respondents": items(cells[2]),
                "signed": iso(text_of(cells[3])),
                "actionTypes": items(cells[4]),
                "penalty": text_of(cells[5]) or None,
                "allegation": text_of(cells[6]) or None,
                "state": text_of(cells[8]) or None,
            }
        )
    return rows


def order_identifiers(document: str, respondent: str) -> dict:
    import pdfplumber

    path = RAW / "orders" / f"{document}.pdf"
    if not path.exists() or path.stat().st_size < 2000:
        return {"documentRead": False, "reason": "HTTP 429 from CARDS at retrieval; not read"}
    with pdfplumber.open(path) as pdf:
        text = " ".join(" ".join((p.extract_text() or "") for p in pdf.pages[:4]).split())
    printed = [(m.start(), m.group(1)) for m in re.finditer(r"NMLS[^0-9]{0,30}?(\d{3,8})", text)]
    distinct = sorted({n for _, n in printed}, key=int)
    chosen = None
    basis = None
    if len(distinct) == 1:
        chosen, basis = distinct[0], "SINGLE_NMLS_PRINTED_IN_ORDER"
    elif distinct:
        # Multi-respondent orders print one NMLS ID per named company; take the ID printed nearest after
        # the respondent's own distinctive name word. The ID is still exact and printed in the order.
        words = [w for w in re.findall(r"[A-Za-z]{4,}", respondent) if w.upper() not in {"LOAN", "LLC", "SERVICING", "SRVICING", "ASSET", "MANAGEMENT", "MORTGAGE", "COMMUNITY"}] or re.findall(r"[A-Za-z]{4,}", respondent)
        key = words[0].lower()
        best = None
        for pos, n in printed:
            window = text[max(0, pos - 260) : pos].lower()
            k = window.rfind(key)
            if k >= 0 and (best is None or len(window) - k < best[0]):
                best = (len(window) - k, n)
        if best:
            chosen, basis = best[1], "NMLS_PRINTED_FOR_THIS_RESPONDENT_IN_MULTIPARTY_ORDER"
    # Scanned captions are OCR text: "Llcense", "MN-M0-", "Resldentlal Mortgage Orlginator" are tolerated.
    lic = re.search(r"L[il1]cense\s*No[.,]?\s*:?\s*(MN\s*-\s*M[O0S]\s*-\s*\d{3,10}|\d{6,10})", text, re.I)
    license_printed = None
    license_class = None
    if lic:
        license_printed = re.sub(r"\s+", "", lic.group(1)).upper().replace("MN-M0-", "MN-MO-")
        license_class = "RESIDENTIAL_MORTGAGE_ORIGINATOR" if "-MO-" in license_printed else "RESIDENTIAL_MORTGAGE_SERVICER" if "-MS-" in license_printed else None
    caption = text[:600].lower()
    residential = r"r[ea]s[il1]d[ea]nt[il1]a[l1]\s+mortgage\s+"
    if license_class is None and re.search(residential + r"serv[il1]cer", caption):
        license_class = "RESIDENTIAL_MORTGAGE_SERVICER"
    if license_class is None and re.search(residential + r"or[il1]g[il1]nator", caption):
        license_class = "RESIDENTIAL_MORTGAGE_ORIGINATOR"
    return {
        "documentRead": True,
        "sha256": sha(path),
        "nmlsPrintedForRespondent": chosen,
        "nmlsBasis": basis,
        "nmlsIdsPrintedInOrder": len(distinct),
        "minnesotaLicensePrinted": license_printed,
        "licenseClassPrinted": license_class,
        "multistateOrder": "multi-state" in text.lower() or "multistate" in text.lower() or "the states, listed" in text.lower(),
    }


def parse() -> None:
    STAGE.mkdir(parents=True, exist_ok=True)
    lookup = page_text(RAW / "license-lookup.html")
    for needle in ("Mortgage Originator and Servicer Companies, Residential", "Mortgage Loan Originators, Individuals"):
        if needle not in lookup:
            raise SystemExit(f"license lookup page no longer lists {needle!r}")
    full = parse_cards(RAW / "cards-mortgage.html")
    halves = parse_cards(RAW / "cards-mortgage-a.html") + parse_cards(RAW / "cards-mortgage-b.html")
    if sorted(r["document"] for r in full) != sorted(r["document"] for r in halves):
        raise SystemExit("CARDS full window and split windows disagree")
    audit = json.loads((RAW / "prod-audit.json").read_text(encoding="utf-8"))
    enf_audit = audit["enforcement_results"]
    actions = []
    for i, r in enumerate(sorted(full, key=lambda x: (x["signed"], x["document"]), reverse=True), 1):
        if len(r["respondents"]) != 1:
            raise SystemExit(f"{r['document']} has {len(r['respondents'])} respondents")
        party = r["respondents"][0]
        company = bool(COMPANY_RE.search(party))
        ids = order_identifiers(r["document"], party) if company else {"documentRead": False, "reason": "individual respondent; document not downloaded"}
        nmls = ids.get("nmlsPrintedForRespondent")
        spine = enf_audit.get(nmls) if nmls else None
        attach = "EXACT_NMLS" if spine and spine.get("resultState") == "EXACT_IDENTITY" else "STANDALONE"
        actions.append(
            {
                "id": f"MN-CARDS:{r['document']}",
                "document": r["document"],
                "industryAsPublished": r["industry"],
                "respondentClass": "COMPANY" if company else "PERSON",
                "respondentAsPublished": party if company else None,
                "signedDate": r["signed"],
                "actionTypeAsPublished": r["actionTypes"][0] if r["actionTypes"] else None,
                "penaltyAsPublished": r["penalty"],
                "allegationAsPublished": r["allegation"] if company else None,
                "respondentState": r["state"] if company else None,
                "documentUrl": r["documentUrl"] if company else None,
                "orderText": {k: v for k, v in ids.items() if k != "nmlsBasis"} | ({"nmlsBasis": ids["nmlsBasis"]} if ids.get("nmlsBasis") else {}),
                "attachment": attach,
                "attachedIdentity": (
                    {"nmls": nmls, "basis": "EXACT_NMLS_PRINTED_IN_ORDER", "publicationState": spine.get("publicationState")}
                    if attach == "EXACT_NMLS"
                    else None
                ),
                "nmlsPrintedNotInSpine": nmls if (nmls and attach == "STANDALONE") else None,
            }
        )
    (STAGE / "commerce-enforcement-actions.json").write_text(
        json.dumps(
            {
                "source": CARDS,
                "query": CARDS_QUERY,
                "queryDescription": "CARDS Enforcement Actions, Industry type Mortgage, signed 2022-01-01 to 2026-09-26",
                "retrievedAt": RETRIEVED_AT,
                "resultSha256": sha(RAW / "cards-mortgage.html"),
                "completeness": "Complete result set: no further page token; the 2022-2023 and 2024-2026 windows return 18 + 32 = 50 rows.",
                "personNamesPublished": False,
                "actions": actions,
            },
            indent=1,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
        newline="\n",
    )
    c = Counter((v.get("resultState"), v.get("publicationState")) for v in audit["results"].values())
    (STAGE / "prod-identity-audit-summary.json").write_text(
        json.dumps(
            {
                "observedAt": audit["observed_at"],
                "method": "Read-only exact NMLS lookups of the curated Minnesota LEI-to-NMLS rows against production GET /api/specialist-execution/v2?q=NMLS {id}. No writes.",
                "curatedRows": audit["curated_rows"],
                "distinctNmls": audit["distinct_nmls"],
                "exactIdentityPublicProfile": c[("EXACT_IDENTITY", "public_profile")],
                "exactIdentityUnpublishedResearch": c[("EXACT_IDENTITY", "unpublished_research_identity")],
                "publicationRestrictedPerson": c[("PUBLICATION_RESTRICTED", "restricted")],
                "noConfidentMatch": c[("NO_CONFIDENT_MATCH", None)],
                "scope": "Curated HMDA reporters only; not a census of Minnesota-licensed companies.",
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
        newline="\n",
    )
    law = {}
    specs = {
        "58.03": [("classes", "The commissioner may issue the following classes of license", "residential mortgage servicer license.")],
        "58.04": [
            ("originator_required", "(a) No person shall act as a residential mortgage originator", "procedures provided in this chapter."),
            ("business_form", "(b) A licensee must be either a partnership", "prescribed under section 58.08 ."),
            ("financial_institution_exempt", "(2) a financial institution as defined in section 58.02, subdivision 10 ;", "subdivision 10 ;"),
        ],
        "58.08": [("originator_bond", "An applicant for a residential mortgage originator license must file with the department a surety bond in the amount of $125,000", "authorized to do so in this state.")],
        "58.09": [("term", "Licenses for residential mortgage originators and residential mortgage servicers issued under this chapter expire on December 31", "renewable on January 1 of each year after that date.")],
        "58.12": [("powers", "(1) bar a person from engaging in residential mortgage origination or servicing;", "revoke an exemption or certificate of exemption.")],
        "58A.03": [
            ("mlo_required", "An individual, unless specifically exempted from this chapter under subdivision 2, shall not engage in the business of a mortgage loan originator", "obtaining and maintaining a license under this chapter."),
            ("mlo_employed", "An individual may not engage in the mortgage loan business unless the individual is employed and supervised by an entity", "exempt from licensing under chapter 58."),
            ("mlo_nmls", "A licensed mortgage loan originator must register with and maintain a valid unique identifier", "Nationwide Multistate Licensing System and Registry."),
        ],
        "58A.045": [("term", "Licenses for mortgage loan originators issued under this chapter expire on December 31", "renewable on January 1 of each year after that date.")],
    }
    for section, pairs in specs.items():
        path = RAW / f"st-{section}.html"
        text = page_text(path)
        edition = re.search(r"(\d{4}) Minnesota Statutes", path.read_text(encoding="utf-8", errors="replace"))
        law[section] = {
            "url": REVISOR + section,
            "edition": edition.group(0) if edition else None,
            "sha256": sha(path),
            "text": {k: quote(text, a, b) for k, a, b in pairs},
        }
    (STAGE / "statute-context.json").write_text(
        json.dumps(
            {
                "retrievedAt": RETRIEVED_AT,
                "licenseLookup": {
                    "url": LICENSE_LOOKUP,
                    "sha256": sha(RAW / "license-lookup.html"),
                    "mortgageEntries": {
                        "Mortgage Originator and Servicer Companies, Residential": CONSUMER_ACCESS,
                        "Mortgage Loan Originators, Individuals": CONSUMER_ACCESS,
                    },
                    "note": "Commerce's License Lookup sends both mortgage license classes to NMLS Consumer Access; Commerce publishes no downloadable mortgage roster. Other mn.gov/commerce pages returned a bot-manager CAPTCHA to automated requests and were not retrieved.",
                },
                "statutes": law,
            },
            indent=1,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
        newline="\n",
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
    idx = (json.loads(HMDA_INDEX.read_text(encoding="utf-8")).get("by_state") or {}).get("MN") or {}
    leis = {r["lei"].strip() for r in csv.DictReader(HMDA_LENDER.open(encoding="utf-8")) if (r.get("lei") or "").strip()}
    curated = list(csv.DictReader(HMDA_CURATED.open(encoding="utf-8")))
    names = {(r.get("county_fips") or "").zfill(5): (r.get("county_name") or "").strip() for r in csv.DictReader(HMDA_COUNTY_NAMES.open(encoding="utf-8"))}
    counties = sorted(
        (
            {
                "county_fips": (r.get("county_fips") or "").zfill(5),
                "county_name": r.get("county_name") or names.get((r.get("county_fips") or "").zfill(5), ""),
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
        "source": "Committed HMDA 2025 Minnesota partition data/hmda/by-state/MN/county_market_summary.csv (reused; not re-ingested).",
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
        "lei_is_not_mn_license": True,
    }


def build() -> dict:
    enf = json.loads((STAGE / "commerce-enforcement-actions.json").read_text(encoding="utf-8"))
    audit = json.loads((STAGE / "prod-identity-audit-summary.json").read_text(encoding="utf-8"))
    law = json.loads((STAGE / "statute-context.json").read_text(encoding="utf-8"))
    hmda = hmda_block()
    if hmda["applications"] != hmda["index_json_applications"] or hmda["originations"] != hmda["index_json_originations"]:
        raise SystemExit("Minnesota HMDA county totals differ from data/hmda/by-state/index.json")
    actions = enf["actions"]
    if any(len(a["id"]) == 0 for a in actions) or len({a["id"] for a in actions}) != len(actions):
        raise SystemExit("action ids")
    st = law["statutes"]
    if any(v["edition"] != "2025 Minnesota Statutes" for v in st.values()):
        raise SystemExit("statute edition")
    by_year = Counter(a["signedDate"][:4] for a in actions)
    company = [a for a in actions if a["respondentClass"] == "COMPANY"]
    read = [a for a in company if a["orderText"].get("documentRead")]
    snapshot = {
        "contract_name": "lender-mn-state-intel-v1",
        "version": "1.0.0",
        "ticket": "MN-LEND-001",
        "geography": "MN",
        "publication_status": "published",
        "path": "/minnesota",
        "generated_at": GENERATED_AT,
        "source_as_of": {
            "licensing": "NMLS Consumer Access (live search; no bulk file)",
            "statutes": "2025 Minnesota Statutes",
            "commerce_enforcement": f"signed dates per action; CARDS query retrieved {RETRIEVED_AT}",
            "hmda": "HMDA 2025",
        },
        "regulators": {
            "state": "Minnesota Department of Commerce",
            "infrastructure": "NMLS (Nationwide Multistate Licensing System & Registry) — licensing and verification system, not the regulator",
            "license_lookup": LICENSE_LOOKUP,
            "consumer_access": CONSUMER_ACCESS,
            "enforcement_search": CARDS,
            "depository_note": "Banks and credit unions (financial institutions as defined in Minn. Stat. 58.02, subd. 10) are exempt from residential mortgage originator licensing and are regulated under other frameworks, so the Commerce/NMLS license population is not every Minnesota mortgage lender.",
        },
        "licenses": {
            "classes": [
                {"id": "residential_mortgage_originator", "label": "Residential Mortgage Originator", "grain": "company license (Minn. Stat. ch. 58)", "roster": "NOT_ACQUIRED", "rows": None, "verification": "KNOWN — NMLS Consumer Access", "license_prefix_printed": "MN-MO"},
                {"id": "residential_mortgage_servicer", "label": "Residential Mortgage Servicer", "grain": "company license (Minn. Stat. ch. 58)", "roster": "NOT_ACQUIRED", "rows": None, "verification": "KNOWN — NMLS Consumer Access", "license_prefix_printed": "MN-MS"},
                {"id": "mortgage_loan_originator", "label": "Mortgage Loan Originator", "grain": "individual license (Minn. Stat. ch. 58A)", "roster": "NOT_ACQUIRED", "rows": None, "verification": "KNOWN — NMLS Consumer Access", "license_prefix_printed": None},
                {"id": "branch", "label": "Branch", "grain": "location under a company", "roster": "NOT_ACQUIRED", "rows": None, "verification": "NMLS Consumer Access", "license_prefix_printed": None},
                {"id": "exempt_certificate", "label": "Certificate of exemption", "grain": "exempt person under Minn. Stat. 58.05", "roster": "NOT_ACQUIRED", "rows": None, "verification": "Commerce", "license_prefix_printed": None},
            ],
            "consumerAccessScraped": False,
            "bulkRoster": "NOT_ACQUIRED — Commerce's License Lookup sends both mortgage classes to NMLS Consumer Access; no Minnesota export was found",
            "no_combined_total": True,
            "one_company_can_hold_several": True,
            "law": {k: v["text"] for k, v in st.items()},
            "law_sources": {k: {"url": v["url"], "sha256": v["sha256"]} for k, v in st.items()},
            "bond_fee_capital_are_not_quality": True,
        },
        "existing_coverage_audit": audit,
        "enforcement": {
            "coverage_state": "KNOWN",
            "source": enf["source"],
            "query": enf["query"],
            "queryDescription": enf["queryDescription"],
            "retrievedAt": enf["retrievedAt"],
            "completeness": enf["completeness"],
            "window": ["2022-01-01", "2026-09-26"],
            "rows": len(actions),
            "rowsByYear": dict(sorted(by_year.items())),
            "companyRows": len(company),
            "personRows": len(actions) - len(company),
            "actionTypesAsPublished": dict(sorted(Counter(a["actionTypeAsPublished"] for a in actions).items())),
            "companyOrdersRead": len(read),
            "companyOrdersNotRead429": len(company) - len(read),
            "exactNmlsAttachments": sum(1 for a in actions if a["attachment"] == "EXACT_NMLS"),
            "nmlsPrintedNotInSpine": sum(1 for a in actions if a["nmlsPrintedNotInSpine"]),
            "licenseClassPrinted": dict(sorted(Counter(a["orderText"].get("licenseClassPrinted") or "not printed / not read" for a in company).items())),
            "nameOnlyAttachments": 0,
            "personNamesPublished": False,
            "ocrPerformed": False,
            "consent_order_is_settlement": True,
            "industry_filter_is_commerce_classification": True,
            "orders": actions,
        },
        "hmda": hmda,
        "complaints": {
            "intake": "KNOWN",
            "intakeNote": "Commerce takes consumer complaints about mortgage originators, servicers and loan originators; the complaint page itself returned a bot-manager CAPTCHA to automated retrieval and was not captured.",
            "providerLevelRows": None,
            "capability": "NOT_ACQUIRED",
            "outcomes": "REQUEST_ONLY",
            "complaint_is_not_enforcement": True,
        },
        "identity": {
            "company": "NMLS company ID is the identity. Minnesota publishes no company roster, so no Minnesota company is created here; one company holding an originator and a servicer license stays one company.",
            "person": "MLO verification is NMLS Consumer Access. No person pages.",
            "enforcement": "Attached only with the NMLS ID printed in the order for that respondent and an exact match in the existing identity spine. Otherwise standalone.",
            "rejected_joins": ["Name-only company match", "Name-only adverse attachment", "HMDA LEI to Minnesota license", "Person NMLS to company NMLS"],
        },
        "expansion_ledger": {
            "NET_NEW_CANONICAL_ORGANIZATIONS": 0,
            "NET_NEW_PUBLIC_LENDER_PROFILES": 0,
            "NET_NEW_PUBLIC_PERSON_PAGES": 0,
            "NEW_STANDALONE_ENFORCEMENT_EVENTS": sum(1 for a in actions if a["attachment"] == "STANDALONE"),
            "GRAPH_WRITES": 0,
            "CLAIM_ELIGIBILITY_BROADENED": False,
        },
        "capability_matrix": [
            {"capability": "Minnesota Commerce mortgage regulation (originator, servicer, MLO)", "state": "KNOWN"},
            {"capability": "Company verification (NMLS Consumer Access)", "state": "KNOWN"},
            {"capability": "MLO verification (NMLS Consumer Access)", "state": "KNOWN"},
            {"capability": "Servicer verification (NMLS Consumer Access)", "state": "KNOWN"},
            {"capability": "Minnesota bulk company roster", "state": "NOT_ACQUIRED"},
            {"capability": "Minnesota MLO roster", "state": "NOT_ACQUIRED"},
            {"capability": "Minnesota branch population", "state": "NOT_ACQUIRED"},
            {"capability": "Commerce mortgage enforcement index 2022-2026 (CARDS)", "state": "KNOWN"},
            {"capability": "Order text identifiers (company orders)", "state": "PARTIAL"},
            {"capability": "Commerce mortgage enforcement before 2022", "state": "NOT_ACQUIRED"},
            {"capability": "Commerce provider-level complaints", "state": "NOT_ACQUIRED"},
            {"capability": "Complaint outcomes", "state": "REQUEST_ONLY"},
            {"capability": "HMDA 2025 Minnesota activity", "state": "KNOWN"},
            {"capability": "Name-only enforcement attachment", "state": "UNSUPPORTED"},
            {"capability": "Combined Minnesota lender total", "state": "UNSUPPORTED"},
        ],
        "semantic_guardrails": [
            "Commerce is the regulator; NMLS is licensing infrastructure",
            "residential mortgage originator != residential mortgage servicer != mortgage loan originator (person) != branch",
            "license != HMDA activity; HMDA LEI != NMLS; HMDA application != Minnesota license",
            "banks and credit unions are outside the Commerce originator license population",
            "consent order != adjudicated violation; complaint != enforcement",
            "bond, fee and capital requirements are not quality indicators",
        ],
        "noCombinedDenominator": True,
        "noLocalRoutes": True,
        "no_ranking": True,
        "no_trust_score": True,
        "fingerprint": "",
    }
    body = {k: v for k, v in snapshot.items() if k not in ("generated_at", "fingerprint")}
    snapshot["fingerprint"] = hashlib.sha256(json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()
    return snapshot


def main() -> int:
    if "--parse" in sys.argv:
        parse()
    snap = build()
    text = json.dumps(snap, indent=2, ensure_ascii=False) + "\n"
    if "--check" in sys.argv:
        for path in (SNAP, ART):
            if path.read_text(encoding="utf-8").replace("\r\n", "\n") != text:
                print(f"{path.relative_to(ROOT)} drifted from the builder", file=sys.stderr)
                return 1
        print("MN-LEND-001 snapshot check OK", snap["fingerprint"])
        return 0
    for path in (SNAP, ART):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8", newline="\n")
    e = snap["enforcement"]
    print("fingerprint", snap["fingerprint"])
    print("enforcement", e["rows"], e["rowsByYear"], "company", e["companyRows"], "person", e["personRows"], "read", e["companyOrdersRead"], "attach", e["exactNmlsAttachments"], "notInSpine", e["nmlsPrintedNotInSpine"])
    print("classes", e["licenseClassPrinted"])
    print("hmda", snap["hmda"]["applications"], snap["hmda"]["originations"], snap["hmda"]["denials"], snap["hmda"]["distinct_leis"], snap["hmda"]["county_count"])
    return 0


if __name__ == "__main__":
    sys.exit(main())

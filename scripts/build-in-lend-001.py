"""IN-LEND-001: freeze Indiana DFI Mortgage Lender roster + Securities Division Loan Broker Act orders.

Stdlib only. Reads the gitignored raw acquisitions in data/raw/indiana/ and writes
lib/indiana-intelligence/evidence.json (company grain only: no street addresses,
phones, individual respondents or individual NMLS IDs).

  python scripts/build-in-lend-001.py          # rebuild from raw
  python scripts/build-in-lend-001.py --check  # verify committed JSON fingerprint (CI-safe)
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "indiana"
OUT = ROOT / "lib" / "indiana-intelligence" / "evidence.json"
FINGERPRINT = "457d96fd39db234bf79e2425df00a9ba88f705d21d910185c4a43cd2f2cec903"

DFI_LISTING = "https://extranet.dfi.in.gov/ConsumerCredit/CompanyListing/13?handler=CompaniesInLicenseType"
DFI_DETAIL = "https://extranet.dfi.in.gov/ConsumerCredit/EntityDetails/{}"
SOS_INDEX = "https://lcm.securities.sos.in.gov/admin-actions-search"
NEWREZ = "https://www.csbs.org/sites/default/files/external-link-files/NewRez%20Final%20Agreement%20with%20attachments%20-%20redacted.pdf"

# Loan Broker Act (IC 23-2.5) orders, 2022-2026, company respondents only. Company NMLS is the
# identifier the order prints for the company itself; control-person / individual NMLS IDs withheld.
# exactIdentity: production /api/specialist-execution/v2 "NMLS <id>" returned EXACT_IDENTITY
# (unpublished research identity) on 2026-09-29; no public profile, no write.
LB_ORDERS = [
    ("24-0011 CA", "Davis Financial Group, LLC", "1959015", "Indianapolis, IN", "Unlicensed loan-broker activity after license non-renewal", 6000, 250, 1, False, "842dcc7f337aa13b20ebaf1424b02e5d5044b39521c612802614cb1cbf81d77f"),
    ("24-0016 CA", "Mortgage City Inc.", "131377", "Kokomo, IN", "Loan Broker Examination: loan broker agreement and borrower-file deficiencies", 1500, 0, 0, False, "373ec677591aecca79fac58267d47ff76b5416698ce36e92af8aa695a1a469c8"),
    ("24-0021 CA", "Magnolia Mortgage, LLC", "874579", "New Albany, IN", "Loan Broker Examination: required loan broker forms not maintained", 1000, 0, 0, False, "9da57388bbd080040683b521aa4316685b8bf09e49f3e3c7bbb206bfe00fafb0"),
    ("24-0022 CA", "RCMP Inc.", "1821008", "Monticello, IN", "Loan Broker Examination: general ledger, loan broker agreement and compliance-program deficiencies", 1500, 0, 0, True, "c481c42a85fc797db4064e7cbdf39e848d40e7de8f7ad9ca4b72dc9b37c8f78a"),
    ("25-0014 CA", "Insight Financial, Inc.", "345499", "Merrillville, IN", "Loan Broker Examination: inaccurate loan broker agreements", 1500, 0, 0, False, "9f61ce8a87847b81c0b94f6eecc0b25e56bcf851ec5c2f2c3fd48ee2fd2f4e34"),
    ("25-0013 CA", "CHRM Financial, LLC", "1720228", "Greenwood, IN", "Loan Broker Examination: advertising omitted NMLS identifiers and equal-housing notice", 1500, 0, 0, False, "18d000ce09fe4ba4aa49ea3c94dac4ceb33f61f65d7e6c1ce72cc16ac6a1ae5b"),
    ("25-0018 CA", "LJI Wealth Management, LLC", "150502", "Indianapolis, IN", "Loan Broker Examination: missing or unsigned loan broker agreements", 1500, 0, 0, True, "1e89bd0167b2eb59bfb91fc97dbbe90d4edd1be8e55e0af20a7c8dd2a3a0635f"),
    ("25-0019 CA", "New Life Mortgage Corp.", "141870", "Greenwood, IN", "Loan Broker Examination: Loan Broker Act and rule deficiencies", 2500, 0, 0, True, "e425544bf45dc928251bcd381a9831bcb11b557a361b5ee3856c3aef3e1f0639"),
    ("25-0024 CA", "Optimum Mortgage Company, LLC", "128568", "Carmel, IN", "Loan Broker Examination: advertising omitted NMLS identifiers and equal-housing notice", 1000, 0, 0, True, "58c51f47c27e46d7d2eb79bb50a3399be57c82780a1aad837da4e04575e40308"),
    ("25-0025 CA", "Heartland Mortgage Group Corp", "267466", "Indianapolis, IN", "Loan Broker Examination: general ledger not maintained monthly", 1500, 0, 0, True, "4b41d7fd4db5a167ab75a50e149b5ba2b1aa0008855fdc7f5fa6a95ad898d32a"),
    ("26-0001 CA", "Midwest Bankers Mortgage Services, Inc.", "148890", "Indianapolis, IN", "Loan Broker Examination: advertising omitted NMLS identifiers", 1500, 0, 0, True, "46e57b4675505b7f38143858b838004c59231e667ffbecaf71120746e3318bb0"),
    ("26-0010 CA", "NEXA Mortgage, LLC", "1660690", "Branch office examination (Evansville, IN)", "Loan Broker Examination of an Indiana branch office", 5000, 250, 0, True, "10aa4b3674f07c0d08f2e1a7fb8355019f3accf3997c6cdaf46ec38ed54d0623"),
]
# Index-tagged "Loan Broker" but the order text cites only the Uniform Securities Act (IC 23-19);
# both involve individual respondents. Counted, not published by name, not in the Loan Broker Act layer.
TAGGED_NOT_ILBA = ["26-0004 CA", "26-0014 CA"]


def clean(s: str) -> str:
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s))).strip()


def dfi_roster():
    listing = (RAW / "dfi" / "mortgage-lender-listing.html").read_text(encoding="utf8", errors="ignore")
    body = listing[listing.find("<tbody"):listing.find("</tbody>")]
    rows = re.findall(r"<tr>([\s\S]*?)</tr>", body)
    seen, records = set(), []
    for r in rows:
        tds = [clean(t) for t in re.findall(r"<td[^>]*>([\s\S]*?)</td>", r)]
        eid = re.search(r"EntityDetails/(\d+)", r).group(1)
        if eid in seen:
            continue
        seen.add(eid)
        name, dba, _street, city_state_zip, _phone = tds
        detail = (RAW / "dfi" / "details" / f"{eid}.html").read_text(encoding="utf8", errors="ignore")
        lic = []
        for tb in re.findall(r"<tbody[\s\S]*?</tbody>", detail):
            for tr in re.findall(r"<tr[\s\S]*?</tr>", tb):
                cells = [clean(x) for x in re.findall(r"<td[^>]*>([\s\S]*?)</td>", tr)]
                if len(cells) == 5:
                    lic.append(cells)
        active = [c for c in lic if c[0] == "Mortgage Lender" and c[4] == "Activated"]
        assert len(active) == 1, (eid, lic)
        m = re.match(r"(.*?),\s*([A-Z]{2})\s+[\d-]+$", city_state_zip)
        city, state = (m.group(1).strip(), m.group(2)) if m else (re.sub(r"\s*\d[\d -]*$", "", city_state_zip), None)
        records.append({
            "dfiEntityId": eid,
            "name": name,
            "dba": dba or None,
            "city": city,
            "state": state,
            "licenseClass": "Mortgage Lender",
            "licenseNumber": active[0][1],
            "issued": "-".join([active[0][2][6:], active[0][2][:2], active[0][2][3:5]]),
            "status": "Activated",
            "holderGrain": "company",
            "nmls": None,
        })
    assert len({r["licenseNumber"] for r in records}) == len(records)
    return len(rows), records


def sos_orders():
    index = []
    for p in (1, 2):
        index += json.loads((RAW / "sos" / f"admin-actions-index-p{p}.json").read_text(encoding="utf8"))["response"]["data"]
    assert len({r["id"] for r in index}) == len(index) == 1747
    tagged = {r["cause_name"]: r for r in index if "loan_broker" in r["entity_types"] and r["date_issued"] >= "2022-01-01"}
    assert sorted(tagged) == sorted([o[0] for o in LB_ORDERS] + TAGGED_NOT_ILBA), sorted(tagged)
    out = []
    for cause, company, nmls, place, basis, penalty, costs, withheld, exact, sha in LB_ORDERS:
        row = tagged[cause]
        key = re.sub(r"[^a-z]", "", company.lower())[:10]
        assert key in re.sub(r"[^a-z]", "", row["respondents"].lower()), (cause, company)
        pdf = next((RAW / "sos" / "orders" / cause.replace(" ", "_")).glob("*.pdf"))
        assert hashlib.sha256(pdf.read_bytes()).hexdigest() == sha, cause
        out.append({
            "cause": cause, "indexDate": row["date_issued"][:10], "respondent": company, "grain": "company",
            "nmls": nmls, "location": place,
            "actions": sorted(a.replace("_", " ") for a in row["actions"]),
            "statute": "Indiana Loan Broker Act (IC 23-2.5)", "basis": basis,
            "civilPenaltyUsd": penalty, "investigativeCostsUsd": costs, "scope": "Indiana-only",
            "individualRespondentsWithheld": withheld, "exactExistingResearchIdentity": exact,
            "pdfSha256": sha,
        })
    counts = {
        "indexRows": len(index), "loanBrokerTagged2022to2026": len(tagged),
        "taggedButSecuritiesActOnly": len(TAGGED_NOT_ILBA),
        "byYear": dict(sorted(Counter(r["date_issued"][:4] for r in tagged.values()).items())),
    }
    return out, counts


def fingerprint(obj) -> str:
    return hashlib.sha256(json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def build():
    listing_rows, roster = dfi_roster()
    orders, counts = sos_orders()
    newrez_sha = hashlib.sha256((RAW / "dfi" / "newrez.pdf").read_bytes()).hexdigest()
    result = {
        "ticket": "IN-LEND-001",
        "dfi": {
            "source": DFI_LISTING, "detailSource": DFI_DETAIL.format("<listed id>"),
            "retrievedAt": "2026-09-29T19:01:27Z", "sourceAsOf": None,
            "listingRows": listing_rows, "distinctEntities": len(roster),
            "licenseClass": "Mortgage Lender", "activeLicenseRows": len(roster),
            "rowsWithPrintedNmls": 0, "streetAddressesPublished": 0, "phonesPublished": 0,
            "records": roster,
        },
        "sosLoanBrokerOrders": {
            "source": SOS_INDEX, "retrievedAt": "2026-09-29T19:05:36Z",
            "window": ["2022-01-01", "2026-09-29"], **counts,
            "rows": orders,
        },
        "multistate": [{
            "respondent": "NewRez LLC", "grain": "company", "nmls": "3013",
            "action": "Multistate Settlement Agreement and Consent Order (mortgage servicing, force-placed insurance)",
            "effectiveBy": "2026-08", "multistateTotalUsd": 15500000, "indianaPerStatePaymentUsd": 61686.09,
            "indianaRole": "Listed as a Participating State in Appendix A; the Indiana signatory agency is not in the extractable text.",
            "source": NEWREZ, "sourceHost": "CSBS", "pdfSha256": newrez_sha, "exactExistingResearchIdentity": False,
        }],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"fingerprint": fingerprint(result), "dfiRows": len(roster), "listingRows": listing_rows, "orders": len(orders), **counts}))


def check():
    data = json.loads(OUT.read_text(encoding="utf-8"))
    got = fingerprint(data)
    assert got == FINGERPRINT, f"fingerprint drift: {got}"
    print("IN-LEND-001 evidence fingerprint OK", got)


if __name__ == "__main__":
    check() if "--check" in sys.argv else build()

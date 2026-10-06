"""Freeze separate Missouri mortgage company, branch, MLO, HMDA, and order observations."""
import csv
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "data/missouri/mo-lend-001"
broker = json.loads((BASE / "mortgage-broker-directory.json").read_text(encoding="utf-8"))
mlo = json.loads((BASE / "mlo-directory.json").read_text(encoding="utf-8"))
orders = json.loads((BASE / "dof-removal-prohibition-index.json").read_text(encoding="utf-8"))
with (ROOT / "data/hmda/missouri/lender_state_summary_mo.csv").open(encoding="utf-8-sig", newline="") as fh:
    hmda = list(csv.DictReader(fh))

brokers = [r for r in broker["observations"] if r["type"] == "Mortgage Broker"]
branches = [r for r in broker["observations"] if r["type"] == "Mortgage Broker Branch"]
persons = mlo["observations"]
assert len(brokers) + len(branches) == broker["reported_rows"]
assert len(persons) == mlo["reported_rows"]
assert len({r["license_number"] for r in brokers}) == len(brokers)
assert len({r["lei"] for r in hmda}) == len(hmda)
snapshot = {
    "regulator": "Missouri Division of Finance",
    "directoryUrl": "https://finance.mo.gov/banks-0/bank-licensee-search",
    "mortgageLicensingUrl": "https://finance.mo.gov/mortgage-licensing",
    "nmlsUrl": "https://www.nmlsconsumeraccess.org/",
    "ordersUrl": orders["source"],
    "directoryRetrievedAt": broker["retrieved_at"],
    "mloDirectoryRetrievedAt": mlo["retrieved_at"],
    "brokerRows": len(brokers),
    "distinctBrokerLicenseNumbers": len({r["license_number"] for r in brokers}),
    "branchRows": len(branches),
    "branchRowsWithPrintedLicenseNumber": sum(bool(r["license_number"]) for r in branches),
    "distinctPrintedBranchLicenseNumbers": len({r["license_number"] for r in branches if r["license_number"]}),
    "branchRowsWithoutPrintedLicenseNumber": sum(not r["license_number"] for r in branches),
    "mloPersonRows": len(persons),
    "mloRowsWithPrintedLicenseNumber": sum(bool(r["license_number"]) for r in persons),
    "distinctPrintedMloLicenseNumbers": len({r["license_number"] for r in persons if r["license_number"]}),
    "mloRowsWithoutPrintedLicenseNumber": sum(not r["license_number"] for r in persons),
    "hmdaYear": 2025,
    "hmdaLeiStateSummaryRows": len(hmda),
    "hmdaDistinctLei": len({r["lei"] for r in hmda}),
    "ordersRetrievedAt": orders["retrieved_at"],
    "orderIndexRows": orders["index_rows"],
    "orderRowsExplicitlyMentioningChapter443": orders["rows_explicitly_mentioning_chapter_443"],
    "exactOrderAttachments": 0,
    "licenseStatusNote": "Directory is a current-search observation; it does not print a per-row status or effective date. Recheck NMLS and DoF for a named record.",
    "lenderServicerClassRows": "NOT_SEPARATELY_IDENTIFIED",
    "existingCanonicalMatches": "NOT_RECONCILED",
    "netNewEntities": 0,
    "evidenceAttachments": 0,
}
(BASE / "accepted-snapshot.json").write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
print(json.dumps({k: v for k, v in snapshot.items() if isinstance(v, int)}, indent=2))

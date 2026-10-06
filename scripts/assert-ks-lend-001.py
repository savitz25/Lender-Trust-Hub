"""Focused integrity gate for the Kansas lender publication snapshot."""
import json
import pathlib

root = pathlib.Path(__file__).resolve().parents[1]
snapshot = json.loads((root / "data/kansas/hmda-snapshot.json").read_text(encoding="utf-8"))
page = (root / "app/kansas/page.tsx").read_text(encoding="utf-8")

assert snapshot["state"] == "KS"
assert snapshot["countyAggregate"]["rows"] == 105
assert snapshot["countyAggregate"]["applications"] == 94350
assert snapshot["countyAggregate"]["originations"] == 60230
assert snapshot["leiStateSummary"]["applications"] == 94243
assert snapshot["knownReconciliationDifferences"]["countyVsLeiApplications"] == 107
assert snapshot["knownReconciliationDifferences"]["countyVsLenderCountyApplications"] == 2517
assert snapshot["licensing"]["mortgageCompany"] == "NOT_ACQUIRED"
assert snapshot["licensing"]["branch"] == "NOT_ACQUIRED"
assert snapshot["licensing"]["mloPerson"] == "NOT_ACQUIRED"
assert snapshot["licensing"]["graphWrites"] == 0
assert "robots: { index: true, follow: true }" in page
assert "${SITE_URL}/kansas" in page
assert "No current bulk NMLS/OSBC Kansas mortgage roster was acquired" in page
assert "supervised-lender and consumer-credit records are not counted as mortgage companies" in page
assert "HMDA describes activity" in page
assert "rating" not in page.lower()
assert "trust score" not in page.lower()
print("KS-LEND-001 integrity assertions passed")

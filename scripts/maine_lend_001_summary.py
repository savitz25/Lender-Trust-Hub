#!/usr/bin/env python3
"""Rebuild Maine's separated HMDA market and crosswalk summary from committed CSVs."""
from collections import Counter
from pathlib import Path
import csv
import json

ROOT = Path(__file__).resolve().parents[1]
HMDA = ROOT / "data/hmda/by-state/ME"
PRODUCT = ROOT / "data/hmda/maine"
OUT = ROOT / "data/maine-lend-001/summary.json"

def rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))

counties = rows(HMDA / "county_market_summary.csv")
state_leis = rows(HMDA / "lender_state_summary.csv")
activity = rows(HMDA / "lender_activity_by_county.csv")
crosswalk = rows(PRODUCT / "lei_to_nmls_mapping.csv")
confidence = Counter(row["match_confidence"] for row in crosswalk)

summary = {
    "hmda_year": 2025,
    "snapshot_data_freeze_date": "2026-06-02",
    "derived_at": "2026-10-12",
    "geography": "Maine property geography; FIPS state 23",
    "county_market_rows": len(counties),
    "applications": sum(int(row["total_applications"]) for row in counties),
    "originations": sum(int(row["total_originations"]) for row in counties),
    "denials": sum(int(row["denial_count"]) for row in counties),
    "state_summary_lei_rows": len(state_leis),
    "lender_county_activity_rows": len(activity),
    "lei_to_nmls_crosswalk_rows": len(crosswalk),
    "crosswalk_match_confidence_rows": dict(sorted(confidence.items())),
    "distinct_nmls_identifiers_in_crosswalk": len({row["nmls_id"] for row in crosswalk if row["nmls_id"]}),
    "source": "https://ffiec.cfpb.gov/data-publication/snapshot-national-loan-level-dataset/2025",
    "limitations": [
        "HMDA is property-market activity, not Maine licensing or a lender census.",
        "An LEI, NMLS identifier, company license, branch license, and MLO person are distinct identities.",
        "Crosswalk rows are not current-state license verification.",
        "No current BCCP NMLS company, branch, or MLO roster has been acquired.",
    ],
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
print(json.dumps(summary, indent=2))

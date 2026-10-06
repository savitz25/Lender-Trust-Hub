"""Retain IDOB FY2025 mortgage class counts as historical observations."""
import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / "data/iowa/ia-lend-001"
URL = "https://idob.iowa.gov/media/49/download?inline="

def main():
    response = requests.get(URL, timeout=90)
    response.raise_for_status()
    content = response.content
    assert content.startswith(b"%PDF")
    hmda = list(csv.DictReader((ROOT / "data/hmda/iowa/lender_state_summary_ia.csv").open(encoding="utf-8-sig", newline="")))
    assert all(r["state"] == "IA" and r["year"] == "2025" for r in hmda)
    snapshot = {
        "contract": "iowa-banking-fy2025-annual-observations-v1",
        "source": URL,
        "reportPeriodEnd": "2025-06-30",
        "reportPublishedAt": "2025-12-01",
        "retrievedAt": datetime.now(timezone.utc).isoformat(),
        "pdfSha256": hashlib.sha256(content).hexdigest(),
        "reportPage": 6,
        "annualObservations": [
            {"class": "Mortgage banker licenses", "count": 610, "grain": "licenses"},
            {"class": "Mortgage broker licenses", "count": 143, "grain": "licenses"},
            {"class": "Mortgage banker company registrants", "count": 32, "grain": "company registrations"},
            {"class": "Mortgage loan originators", "count": 8083, "grain": "people"},
            {"class": "Closing agents", "count": 97, "grain": "agent licenses"},
        ],
        "hmdaYear": 2025,
        "hmdaStateSummaryRows": len(hmda),
        "hmdaDistinctLei": len({r["lei"] for r in hmda}),
        "graphWrites": 0,
    }
    DEST.mkdir(parents=True, exist_ok=True)
    (DEST / "idob-fy2025-annual-report.pdf").write_bytes(content)
    (DEST / "annual-report-snapshot.json").write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: snapshot[k] for k in ("pdfSha256", "hmdaStateSummaryRows", "hmdaDistinctLei", "retrievedAt")}, indent=2))

if __name__ == "__main__":
    main()

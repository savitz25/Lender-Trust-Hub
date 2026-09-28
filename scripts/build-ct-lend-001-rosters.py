"""Freeze Connecticut DOB's four public mortgage-license workbooks; no NMLS inference."""
from __future__ import annotations

import hashlib
import io
import json
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from openpyxl import load_workbook

SOURCES = {
    "lender": "https://portal.ct.gov/-/media/dob/consumer-credit-licenses/mortgage_lenders.xlsx?hash=D36FE1573A8EA53390CAF9F204CAE8C5&rev=ee02902f32464413b4d1d3aa88e7c348",
    "broker": "https://portal.ct.gov/-/media/dob/consumer-credit-licenses/mortgage_brokers.xlsx?hash=117DA5E495701BE7595BE2C9A0685064&rev=082330e4952a4d7481ec19607b042b0e",
    "correspondent_lender": "https://portal.ct.gov/-/media/dob/consumer-credit-licenses/mortgage_correspondent_lenders.xlsx?hash=60B0806B7C46046D8971323ED0F747DF&rev=58eb54013bf14cacbd879a6a46b86837",
    "servicer": "https://portal.ct.gov/-/media/dob/consumer-credit-licenses/mortgage_servicers.xlsx?hash=547F0446E38E8538400B37D3BBEC5FDA&rev=d9575263f0ae45e888561dcb3400f702",
}
OUT = Path(__file__).resolve().parents[1] / "lib" / "connecticut-intelligence" / "rosters.json"


def build():
    retrieved = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    files = []
    records = []
    for family, url in SOURCES.items():
        request = urllib.request.Request(url, headers={"User-Agent": "LenderTrustHub CT-LEND-001 public workbook snapshot"})
        blob = urllib.request.urlopen(request, timeout=30).read()
        book = load_workbook(io.BytesIO(blob), read_only=True, data_only=True)
        rows = list(book.active.values)
        assert rows[1] == ("Company Name", "Street", "City", "State", "Postal Code", "License Number", "License Name", "Report Current As Of")
        as_of = set()
        before = len(records)
        for row in rows[2:]:
            company, _street, city, state, _postal, number, license_name, report_date = row
            assert company and number and license_name and report_date
            as_of.add(report_date.strftime("%Y-%m-%d"))
            records.append({
                "family": family,
                "companyName": str(company).strip(),
                "licenseNumber": str(number).strip(),
                "licenseName": str(license_name).strip(),
                "holderGrain": "branch" if "Branch License" in license_name else "company",
                "city": str(city).strip() if city else None,
                "state": str(state).strip() if state else None,
                "sourceStatus": "LISTED_AS_LICENSED",
            })
        assert as_of == {"2026-09-02"}, (family, as_of)
        subset = records[before:]
        assert len({r["licenseNumber"] for r in subset}) == len(subset)
        files.append({"family": family, "url": url, "sha256": hashlib.sha256(blob).hexdigest(), "asOf": "2026-09-02", "retrievedAt": retrieved, "rows": len(subset), "byLicenseName": dict(Counter(r["licenseName"] for r in subset))})
    result = {"source": "Connecticut Department of Banking downloadable licensee workbooks", "retrievedAt": retrieved, "files": files, "records": records,
              "nmlsPrintedRows": 0, "nmlsBridges": 0, "nameOnlyJoins": 0, "streetAddressesPublished": 0}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, separators=(",", ":")), encoding="utf-8")
    print(json.dumps({"rows": len(records), "files": [(f["family"], f["rows"], f["byLicenseName"]) for f in files], "retrievedAt": retrieved}))


if __name__ == "__main__":
    build()

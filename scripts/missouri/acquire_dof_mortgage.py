"""Capture Missouri Division of Finance mortgage-broker directory pages.

The site has a separate MLO filter; this script deliberately keeps person rows out.
"""
from __future__ import annotations

import concurrent.futures
import gzip
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data/missouri/mo-lend-001"
FILTER = sys.argv[1] if len(sys.argv) > 1 else "11"
if FILTER not in {"11", "12"}:
    raise SystemExit("type_code must be 11 (broker/branch) or 12 (MLO person)")
RAW = OUT / f"raw-type-{FILTER}"
URL = "https://finance.mo.gov/banks-0/bank-licensee-search"


def fetch(page: int) -> tuple[int, bytes, list[dict[str, str]], int]:
    response = requests.get(URL, params={"type_code": FILTER, "page": page}, timeout=35)
    response.raise_for_status()
    body = response.content
    soup = BeautifulSoup(body, "html.parser")
    label = soup.get_text(" ", strip=True)
    match = re.search(r"Displaying\s+\d+\s+-\s+\d+\s+of\s+(\d+)", label)
    if not match:
        raise ValueError(f"page {page}: no result count")
    table = soup.select_one("table")
    if table is None:
        raise ValueError(f"page {page}: no table")
    rows = []
    for tr in table.select("tbody tr"):
        values = [cell.get_text(" ", strip=True) for cell in tr.select("td")]
        if len(values) != 8:
            raise ValueError(f"page {page}: {len(values)} columns")
        rows.append(dict(zip(("license_number", "name", "address", "city", "state", "zip", "type", "assets"), values)))
    return page, body, rows, int(match.group(1))


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    first = fetch(0)
    count = first[3]
    pages = (count + 24) // 25
    results = [first]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        results.extend(pool.map(fetch, range(1, pages)))
    observations = []
    manifest = []
    for page, body, rows, reported_count in sorted(results):
        if reported_count != count:
            raise ValueError(f"count changed while fetching page {page}: {reported_count} != {count}")
        name = f"page-{page:03d}.html.gz"
        (RAW / name).write_bytes(gzip.compress(body, mtime=0))
        manifest.append({"page": page, "url": f"{URL}?type_code={FILTER}&page={page}", "sha256": hashlib.sha256(body).hexdigest(), "rows": len(rows), "raw": name})
        observations.extend({"source_page": page, **row} for row in rows)
    if len(observations) != count:
        raise ValueError(f"expected {count}, got {len(observations)}")
    output = {
        "source": "Missouri Division of Finance Bank & Licensee Search",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "filter": "Mortgage Broker (MB or BRC)" if FILTER == "11" else "Mortgage Loan Originator (MLO)",
        "type_code": FILTER,
        "reported_rows": count,
        "pages": manifest,
        "observations": observations,
    }
    filename = "mortgage-broker-directory.json" if FILTER == "11" else "mlo-directory.json"
    (OUT / filename).write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"rows": count, "pages": pages, "types": {t: sum(row["type"] == t for row in observations) for t in sorted({row["type"] for row in observations})}, "distinct_license_numbers": len({row["license_number"] for row in observations})}))


if __name__ == "__main__":
    main()

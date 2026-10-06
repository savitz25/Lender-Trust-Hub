"""Save a bounded DoF removal/prohibition order index, without identity joins."""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data/missouri/mo-lend-001"
URL = "https://finance.mo.gov/publications-and-reports/removal-and-prohibition-orders"
response = requests.get(URL, timeout=35)
response.raise_for_status()
raw = response.content
(OUT / "raw-dof-removal-prohibition-orders.html").write_bytes(raw)
soup = BeautifulSoup(raw, "html.parser")
main = soup.find("main")
if main is None:
    raise ValueError("missing main")
rows = []
for p in main.find_all("p"):
    text = p.get_text(" ", strip=True)
    if "Order of Prohibition" not in text and "Order of Revocation" not in text:
        continue
    rows.append({"text": text, "chapter_443_mortgage_mentioned": "Chapter 443" in text})
output = {
    "source": URL,
    "retrieved_at": datetime.now(timezone.utc).isoformat(),
    "sha256": hashlib.sha256(raw).hexdigest(),
    "index_rows": len(rows),
    "rows_explicitly_mentioning_chapter_443": sum(r["chapter_443_mortgage_mentioned"] for r in rows),
    "join_policy": "No person or company joined to a licensee directory record by name. Index summaries may lack stable respondent IDs.",
    "rows": rows,
}
(OUT / "dof-removal-prohibition-index.json").write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"index_rows": len(rows), "chapter_443": output["rows_explicitly_mentioning_chapter_443"]}))

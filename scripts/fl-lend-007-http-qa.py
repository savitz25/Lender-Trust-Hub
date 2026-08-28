#!/usr/bin/env python3
"""HTTP QA for Florida Phase 1. python scripts/fl-lend-007-http-qa.py http://localhost:3015"""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(r"C:\Users\makei\lender-trust-hub-ask-search-009")
BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://localhost:3015"
manifest = json.loads((ROOT / "docs" / "fl-lend-007-phase1-manifest.json").read_text(encoding="utf-8"))
LEAK = ["raw_metadata", "internal_only", "review_before_public", "content_sha256", "identity-resolution", "aggregateRating", "ratingValue"]
NOEVENT = "No attributable Florida OFR final-agency-action observation was found"

def fetch(path: str) -> tuple[int, str, dict]:
    t0 = time.time()
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "FLPUB-QA"})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            body = r.read().decode("utf-8", "replace")
            return r.status, body, {"s": round(time.time() - t0, 3), "bytes": len(body)}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        return e.code, body, {"s": round(time.time() - t0, 3), "bytes": len(body)}

rows = []
for row in manifest["rows"]:
    code, html, meta = fetch(f"/lender/{row['slug']}")
    robots = re.search(r'name="robots" content="([^"]+)"', html)
    canon = re.search(r'rel="canonical" href="([^"]+)"', html)
    leaks = [k for k in LEAK if k in html]
    item = {
        "slug": row["slug"],
        "cohort": row["cohort"],
        "status": code,
        **meta,
        "robots": robots.group(1) if robots else None,
        "canonical": canon.group(1) if canon else None,
        "nmls": row["nmls_id"] in html,
        "h1": bool(re.search(r"<h1", html)),
        "leaks": leaks,
        "ofr_heading": "Regulatory &amp; Enforcement History" in html or "Regulatory & Enforcement History" in html,
        "noevent": NOEVENT in html,
        "servicer_bad": any(x in html.lower() for x in ["certified servicer", "approved servicer", "never services", "clean record", "no violations"]),
        "ratings": any(x in html for x in ("aggregateRating", "ratingValue")),
    }
    rows.append(item)
    print(item["slug"], item["status"], item["robots"], "leaks" if leaks else "noleak", "FAIL" if item["status"] != 200 or leaks or item["ratings"] else "ok")

# fail-closed samples
held = ["2600", "2916", "3013"]
# unknown
unknown = fetch("/lender/definitely-not-a-florida-phase1-slug-xyz")
rocket = fetch("/lender/rocket-mortgage")
internal = fetch("/internal/florida-profile/island-mortgage-inc")

out = {
    "base": BASE,
    "phase1": rows,
    "phase1_200": sum(1 for r in rows if r["status"] == 200),
    "unknown": unknown[0],
    "rocket": rocket[0],
    "internal": internal[0],
}
print(json.dumps({k: out[k] for k in out if k != "phase1"}, indent=2))
(ROOT / "docs" / "fl-lend-007-http-qa.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
ok = out["phase1_200"] == 30 and out["unknown"] == 404 and out["rocket"] == 200 and out["internal"] == 404
print("HTTP_QA_PASS" if ok else "HTTP_QA_FAIL")
sys.exit(0 if ok else 1)

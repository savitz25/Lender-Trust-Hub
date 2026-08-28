#!/usr/bin/env python3
"""Production HTTP QA. python scripts/fl-lend-008-http-qa.py [base]"""
from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(r"C:\Users\makei\lender-trust-hub-ask-search-009")
BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "https://www.lendertrusthub.com"
p2 = json.loads((ROOT / "docs" / "fl-lend-008-phase2-manifest.json").read_text(encoding="utf-8"))
p1 = json.loads((ROOT / "docs" / "fl-lend-007-phase1-manifest.json").read_text(encoding="utf-8"))
LEAK = ["raw_metadata", "review_before_public", "internal_only", "content_sha256", "identity-resolution", "aggregateRating", "ratingValue"]
NOEVENT = "No attributable Florida OFR final-agency-action observation was found"


def fetch(path: str) -> tuple[int, str]:
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "FLEXP-QA"})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def inspect(row: dict, expect_noindex: bool) -> dict:
    code, html = fetch(f"/lender/{row['slug']}")
    robots = re.search(r'name="robots" content="([^"]+)"', html)
    canon = re.search(r'rel="canonical" href="([^"]+)"', html)
    leaks = [k for k in LEAK if k in html]
    robots_v = robots.group(1) if robots else None
    ok = (
        code == 200
        and row["nmls_id"] in html
        and not leaks
        and "aggregateRating" not in html
        and ("Regulatory &amp; Enforcement History" in html or "Regulatory & Enforcement History" in html)
    )
    if expect_noindex:
        ok = ok and robots_v is not None and "noindex" in robots_v.lower()
    else:
        ok = ok and robots_v is not None and "index" in robots_v.lower() and "noindex" not in robots_v.lower()
    if row.get("cohort") in ("C", "C2"):
        ok = ok and NOEVENT in html
    if row.get("cohort") in ("B", "B2"):
        ok = ok and NOEVENT not in html
    return {
        "slug": row["slug"],
        "cohort": row["cohort"],
        "status": code,
        "ok": ok,
        "robots": robots_v,
        "canonical": canon.group(1) if canon else None,
        "leaks": leaks,
        "bytes": len(html),
    }


def main() -> int:
    expect_p2_noindex = "--index" not in sys.argv
    p2_rows = [inspect(r, expect_p2_noindex) for r in p2["rows"]]
    p1_rows = [inspect(r, False) for r in p1["rows"]]
    unknown = fetch("/lender/definitely-not-a-florida-phase2-slug-xyz")[0]
    internal = fetch("/internal/florida-profile/island-mortgage-inc")[0]
    rocket = fetch("/lender/rocket-mortgage")[0]
    florida = fetch("/florida")
    fhtml = florida[1]
    frobots = re.search(r'name="robots" content="([^"]+)"', fhtml)
    canon = re.search(r'rel="canonical" href="([^"]+)"', fhtml)
    out = {
        "base": BASE,
        "phase2_200": sum(1 for r in p2_rows if r["status"] == 200),
        "phase2_ok": sum(1 for r in p2_rows if r["ok"]),
        "phase1_200": sum(1 for r in p1_rows if r["status"] == 200),
        "phase1_ok": sum(1 for r in p1_rows if r["ok"]),
        "unknown": unknown,
        "internal": internal,
        "rocket": rocket,
        "florida": {"status": florida[0], "robots": frobots.group(1) if frobots else None, "canonical": canon.group(1) if canon else None},
        "phase2": p2_rows,
        "phase1": p1_rows,
    }
    (ROOT / "docs" / "fl-lend-008-http-qa.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps({k: out[k] for k in out if k not in ("phase2", "phase1")}, indent=2))
    ok = (
        out["phase2_200"] == 100
        and out["phase2_ok"] == 100
        and out["phase1_200"] == 30
        and out["phase1_ok"] == 30
        and unknown == 404
        and internal == 404
        and rocket == 200
        and out["florida"]["status"] == 200
    )
    print("HTTP_QA_PASS" if ok else "HTTP_QA_FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())

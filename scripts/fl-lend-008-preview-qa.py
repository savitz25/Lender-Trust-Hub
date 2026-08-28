#!/usr/bin/env python3
"""Preview QA via vercel curl. python scripts/fl-lend-008-preview-qa.py <preview-url>"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(r"C:\Users\makei\lender-trust-hub-ask-search-009")
SCOPE = "savitz25-s-projects"
DEP = sys.argv[1] if len(sys.argv) > 1 else ""
manifest = json.loads((ROOT / "docs" / "fl-lend-008-phase2-manifest.json").read_text(encoding="utf-8"))
phase1 = json.loads((ROOT / "docs" / "fl-lend-007-phase1-manifest.json").read_text(encoding="utf-8"))
LEAK = ["raw_metadata", "review_before_public", "content_sha256", "identity-resolution", "aggregateRating", "ratingValue"]
NOEVENT = "No attributable Florida OFR final-agency-action observation was found"
REG = "Regulatory & Enforcement History"


def curl(path: str) -> tuple[int, str]:
    tmp = Path(tempfile.gettempdir()) / "fl008-preview.html"
    hdr = Path(tempfile.gettempdir()) / "fl008-preview.hdr"
    cmd = [
        "npx",
        "vercel",
        "curl",
        path,
        "--deployment",
        DEP,
        "--scope",
        SCOPE,
        "--",
        "-s",
        "-D",
        str(hdr),
        "-o",
        str(tmp),
    ]
    subprocess.run(cmd, cwd=str(ROOT), check=False, shell=True)
    headers = hdr.read_text(encoding="utf-8", errors="replace") if hdr.exists() else ""
    body = tmp.read_text(encoding="utf-8", errors="replace") if tmp.exists() else ""
    m = re.search(r"HTTP/\S+\s+(\d+)", headers)
    code = int(m.group(1)) if m else 0
    return code, body


def main() -> int:
    if not DEP:
        print("usage: python scripts/fl-lend-008-preview-qa.py <preview-deployment-url>")
        return 2
    rows = []
    fail = 0
    for row in manifest["rows"]:
        code, html = curl(f"/lender/{row['slug']}")
        robots = re.search(r'name="robots" content="([^"]+)"', html)
        canon = re.search(r'rel="canonical" href="([^"]+)"', html)
        leaks = [k for k in LEAK if k in html]
        robots_v = robots.group(1) if robots else ""
        ok = (
            code == 200
            and row["nmls_id"] in html
            and "noindex" in robots_v.lower()
            and not leaks
            and "aggregateRating" not in html
            and (REG in html or "Regulatory &amp; Enforcement History" in html)
            and "Sources and freshness" in html
            and "Limitations" in html
        )
        if row["cohort"] == "C2":
            ok = ok and NOEVENT in html
        if row["cohort"] == "B2":
            ok = ok and NOEVENT not in html
        rec = {
            "slug": row["slug"],
            "cohort": row["cohort"],
            "status": code,
            "ok": ok,
            "robots": robots_v,
            "canonical": canon.group(1) if canon else None,
            "leaks": leaks,
            "bytes": len(html),
        }
        rows.append(rec)
        if not ok:
            fail += 1
        print(row["slug"], code, ok, robots_v)
    p1 = curl("/lender/" + phase1["rows"][0]["slug"])
    rocket = curl("/lender/rocket-mortgage")
    unknown = curl("/lender/definitely-not-a-florida-phase2-slug-xyz")
    internal = curl("/internal/florida-profile/island-mortgage-inc")
    out = {
        "deployment": DEP,
        "phase2_ok": sum(1 for r in rows if r["ok"]),
        "phase2_200": sum(1 for r in rows if r["status"] == 200),
        "fail": fail,
        "phase1_sample": p1[0],
        "rocket": rocket[0],
        "unknown": unknown[0],
        "internal": internal[0],
        "rows": rows,
    }
    (ROOT / "docs" / "fl-lend-008-preview-qa.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps({k: out[k] for k in out if k != "rows"}, indent=2))
    return 0 if fail == 0 and out["phase2_200"] == 100 else 1


if __name__ == "__main__":
    raise SystemExit(main())

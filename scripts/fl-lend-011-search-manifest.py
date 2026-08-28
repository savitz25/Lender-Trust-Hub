#!/usr/bin/env python3
"""FL-LEND-011 — prove 130 Florida search eligibility and emit bounded projection."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"C:\Users\makei\lender-trust-hub-ask-search-009")
HELD = {
    "2600", "2916", "3013", "3114", "10287", "18188", "88244", "169063", "205042",
    "238143", "322180", "372178", "391521", "461249", "1028232", "1268485",
    "1359205", "1992052", "2085556", "2286700", "2493643", "2669836",
}


def norm(s: str) -> str:
    out = (s or "").lower().replace("&", " and ")
    buf = []
    for ch in out:
        buf.append(ch if ch.isalnum() else " ")
    return " ".join("".join(buf).split())


def fingerprint(rows: list[dict]) -> str:
    blob = json.dumps(rows, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


def main() -> int:
    nat = json.loads((ROOT / "docs/lend-nat-016-search-index.json").read_text(encoding="utf-8"))
    p1 = json.loads((ROOT / "docs/fl-lend-007-phase1-manifest.json").read_text(encoding="utf-8"))
    p2 = json.loads((ROOT / "docs/fl-lend-008-phase2-manifest.json").read_text(encoding="utf-8"))
    nat_ids = {r["institution_id"] for r in nat["rows"]}
    nat_slugs = {r["slug"] for r in nat["rows"]}
    nat_nmls = {r["nmls"] for r in nat["rows"] if r.get("nmls")}
    p1_ids = {r["institution_id"] for r in p1["rows"]}
    p1_slugs = {r["slug"] for r in p1["rows"]}
    p1_nmls = {str(r["nmls_id"]) for r in p1["rows"]}
    p2_ids = {r["institution_id"] for r in p2["rows"]}
    p2_slugs = {r["slug"] for r in p2["rows"]}
    p2_nmls = {str(r["nmls_id"]) for r in p2["rows"]}
    fl_ids = p1_ids | p2_ids
    fl_slugs = p1_slugs | p2_slugs
    fl_nmls = p1_nmls | p2_nmls
    held_nmls = HELD
    overlap_ids = nat_ids & fl_ids
    overlap_slugs = nat_slugs & fl_slugs
    overlap_nmls = nat_nmls & fl_nmls
    p1p2_ids = p1_ids & p2_ids
    p1p2_slugs = p1_slugs & p2_slugs
    held_i = fl_nmls & held_nmls
    pre = {
        "national_searchable": len(nat["rows"]),
        "florida_phase1": len(p1["rows"]),
        "florida_phase2": len(p2["rows"]),
        "florida_union": len(fl_ids),
        "florida_union_slugs": len(fl_slugs),
        "national_florida_overlap_ids": len(overlap_ids),
        "national_florida_overlap_slugs": len(overlap_slugs),
        "national_florida_overlap_nmls": len(overlap_nmls),
        "phase1_phase2_overlap_ids": len(p1p2_ids),
        "phase1_phase2_overlap_slugs": len(p1p2_slugs),
        "duplicate_florida_ids": len(p1["rows"]) + len(p2["rows"]) - len(fl_ids),
        "duplicate_florida_slugs": len(p1["rows"]) + len(p2["rows"]) - len(fl_slugs),
        "held_intersection": len(held_i),
        "predicted_unique_searchable": len(nat_ids | fl_ids),
        "search_false_on_manifests": p1.get("search") is False and p2.get("search") is False,
    }
    print(json.dumps(pre, indent=2))
    ok = (
        pre["national_searchable"] == 181
        and pre["florida_phase1"] == 30
        and pre["florida_phase2"] == 100
        and pre["florida_union"] == 130
        and pre["florida_union_slugs"] == 130
        and pre["national_florida_overlap_ids"] == 0
        and pre["national_florida_overlap_slugs"] == 0
        and pre["phase1_phase2_overlap_ids"] == 0
        and pre["duplicate_florida_ids"] == 0
        and pre["duplicate_florida_slugs"] == 0
        and pre["held_intersection"] == 0
        and pre["predicted_unique_searchable"] == 311
    )
    print("PREIMPL", "PASS" if ok else "FAIL")
    if not ok:
        return 1

    rows = []
    for r in p1["rows"]:
        rows.append(proj(r, "florida_phase1"))
    for r in p2["rows"]:
        rows.append(proj(r, "florida_phase2"))
    rows.sort(key=lambda r: (r["presentation_name"].lower(), r["nmls"] or "", r["slug"]))
    fp1 = fingerprint(rows)
    fp2 = fingerprint(list(rows))
    assert fp1 == fp2
    projection = {
        "contract": "fl-lend-search-fl-v1",
        "count": 130,
        "fingerprint": fp1,
        "rows": rows,
    }
    (ROOT / "docs/fl-lend-011-florida-search-index.json").write_text(
        json.dumps(projection, indent=2), encoding="utf-8"
    )
    manifest = {
        "task": "FL-LEND-011",
        "contract": "fl-lend-search-fl-v1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "national_searchable": 181,
        "florida_phase1": 30,
        "florida_phase2": 100,
        "florida_union": 130,
        "national_florida_overlap": 0,
        "phase1_phase2_overlap": 0,
        "held_intersection": 0,
        "unique_searchable": 311,
        "projection_fingerprint": fp1,
        "source_manifests": ["fl-lend-007-phase1-v1", "fl-lend-008-phase2-v1"],
        "national_search_index": "lend-nat-016-search-index.json",
        "search": True,
        "ranked": False,
        **pre,
    }
    (ROOT / "docs/fl-lend-011-search-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("FINGERPRINT", fp1)
    return 0


def proj(r: dict, source: str) -> dict:
    name = r["name"]
    return {
        "institution_id": r["institution_id"],
        "slug": r["slug"],
        "canonical_name": name,
        "display_name": name,
        "presentation_name": name,
        "stable_key": r.get("stable_key") or f"nmls-inst:{r['nmls_id']}",
        "historical_names": [],
        "nmls": str(r["nmls_id"]),
        "fdic": None,
        "ncua": None,
        "lei": None,
        "hq_city": None,
        "hq_state": None,
        "depository": "NONBANK",
        "browse_types": ["nonbank"],
        "servicer_role": "NOT ESTABLISHED",
        "evidence": {"hmda": False, "cfpb": False, "enforcement": False, "servicer": False},
        "indexable": True,
        "publication_source": source,
        "florida_classes": list(r.get("classes") or []),
        "normalized_name": norm(name),
    }


if __name__ == "__main__":
    raise SystemExit(main())

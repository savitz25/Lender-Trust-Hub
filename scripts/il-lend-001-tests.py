#!/usr/bin/env python3
from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
snap = json.loads((ROOT / "lib/illinois-intelligence/accepted-snapshot.json").read_text(encoding="utf-8"))
FP = "c6da4761a11c6fccff22fbadb1eac1d2158b2756bfcf6823d622454ddbc5c03d"


def check(cond: bool, msg: str) -> None:
    if not cond:
        raise SystemExit(f"FAIL {msg}")


def sha(obj: object) -> str:
    body = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


check(snap["contract_name"] == "lender-il-state-intel-v1", "contract")
check(snap["fingerprint"] == FP, "fingerprint")
body = {k: v for k, v in snap.items() if k != "fingerprint"}
check(sha(body) == sha(body), "fingerprint twice")
check(sha(body) == FP, "fingerprint body")
check(snap["hmda"]["applications"] == 394488, "apps")
check(snap["hmda"]["originations"] == 231788, "origs")
check(snap["hmda"]["county_count"] == 102, "counties")
check(snap["hmda"]["denials"] == 66742, "denials")
check(snap["hmda"]["applications"] != snap["fdic"]["institution_rows"], "apps != fdic")
check(snap["current_roster"]["count"] is None, "no roster")
check(snap["cfpb"]["mortgage_complaint_rows"] is None, "cfpb missing")
check(snap["fdic"]["institution_rows"] == 387, "fdic")
check(snap["expansion_ledger"]["NET_NEW_CANONICAL_ORGANIZATIONS"] == 0, "no orgs")
check(snap["no_local_illinois_routes"] is True, "no local")
mut = copy.deepcopy(snap)
mut["hmda"]["applications"] = 1
check(sha({k: v for k, v in mut.items() if k != "fingerprint"}) != FP, "mutation apps")
print("il-lend-001-tests.py pass")

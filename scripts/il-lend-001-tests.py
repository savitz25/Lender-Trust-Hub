#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FP = "06c7f10b4756076b57da54c64306fb50fc9666a379855d1e262591652a9f70a4"
OLD_FP = "c6da4761a11c6fccff22fbadb1eac1d2158b2756bfcf6823d622454ddbc5c03d"
spec = importlib.util.spec_from_file_location("build_il", ROOT / "scripts/build-il-public-snapshot.py")
mod = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(mod)


def check(cond: bool, msg: str) -> None:
    if not cond:
        raise SystemExit(f"FAIL {msg}")


snap = mod.json.loads((ROOT / "lib/illinois-intelligence/accepted-snapshot.json").read_text(encoding="utf-8"))
check(snap["contract_name"] == "lender-il-state-intel-v1", "contract")
check(snap["fingerprint"] == FP, "fingerprint")
check(FP != OLD_FP, "fingerprint changed from A1 after provenance/denial semantics")
check(snap["retrieved_at"] is None, "top retrieved_at unknown")
check(snap["retrieved_at_precision"] == "UNKNOWN", "retrieved precision")
check(snap["snapshot_as_of"] is None, "snapshot_as_of not ticket date")
check(snap["generated_at"] not in {"2020-01-01T00:00:00Z", "2099-12-31T23:59:59Z"}, "no synthetic clocks")
check(snap["generated_at"] != snap["retrieved_at"], "generated_at is not retrieval")
check(snap["hmda"]["retrieved_at"] is None, "hmda retrieval unknown")
check(snap["fdic"]["retrieved_at"] is None, "fdic retrieval unknown")
check(snap["hmda"]["source_as_of"] == "HMDA 2025", "hmda vintage")
check(snap["fdic"]["source_as_of"] == "2026-06-26", "fdic overlay as-of")
check(snap["hmda"]["reuse"] == "PRE_EXISTING_REUSED", "hmda reuse")
check(snap["fdic"]["reuse"] == "PRE_EXISTING_REUSED", "fdic reuse")
check(snap["hmda"]["this_ticket_retrieved"] is False, "hmda not retrieved this ticket")
check("denial_rate_pct" not in snap["hmda"], "broad denial_rate_pct removed")
check(snap["hmda"]["denials_as_pct_of_total_applications"] == 16.92, "denial pct")
check(snap["hmda"]["denial_pct_numerator_denial_observations"] == 66742, "denial numerator")
check(snap["hmda"]["denial_pct_denominator_total_applications"] == 394488, "denial denominator")
check(snap["hmda"]["applications"] == 394488, "apps")
check(snap["hmda"]["originations"] == 231788, "origs")
check(snap["hmda"]["county_count"] == 102, "counties")
check(snap["hmda"]["denials"] == 66742, "denials")
check(snap["current_roster"]["count"] is None, "no roster")
check(snap["cfpb"]["mortgage_complaint_rows"] is None, "cfpb missing")
check(snap["fdic"]["institution_rows"] == 387, "fdic")
check(snap["expansion_ledger"]["NET_NEW_CANONICAL_ORGANIZATIONS"] == 0, "no orgs")
check(snap["claim_eligibility"]["broadened"] is False, "claim frozen")
check(mod.semantic_sha(snap) == FP, "committed semantic fingerprint")

totals = mod.load_frozen_inputs()
fp = mod.assert_independent_fingerprint(totals)
check(fp == FP, "independent rebuild fingerprint")
a = mod.build_body("2020-01-01T00:00:00Z", totals)
b = mod.build_body("2099-12-31T23:59:59Z", totals)
check(a["generated_at"] != b["generated_at"], "clocks differ")
check(mod.semantic_sha(a) == mod.semantic_sha(b) == FP, "generatedAt excluded")
check(a["generated_at"] != snap["generated_at"], "synthetic clock not stored")
print("il-lend-001-tests.py pass", FP[:12])

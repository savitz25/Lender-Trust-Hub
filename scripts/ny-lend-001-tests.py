#!/usr/bin/env python3
"""NY-LEND-001A grain tests."""
from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
snap = json.loads((ROOT / "lib/new-york-intelligence/accepted-snapshot.json").read_text(encoding="utf-8"))
FP = "d3a07f5b5d7114e54917ef0aa0d338e81f90f87e2bb0fc9eddabe2fa75eb6b82"


def check(cond: bool, msg: str) -> None:
    if not cond:
        raise SystemExit(f"FAIL {msg}")


def sha(obj: object) -> str:
    body = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


check(snap["contract_name"] == "lender-ny-state-intel-v1", "contract")
check(snap["fingerprint"] == FP, "fingerprint")
check(sha({k: v for k, v in snap.items() if k != "fingerprint"}) == FP, "fingerprint twice")
A = snap["dfs_2024_aggregates"]
check(A["licensed_mortgage_bankers"] == 151, "151 bankers")
check(A["registered_mortgage_brokers"] == 439, "439 brokers")
check(A["registered_mortgage_loan_servicers"] == 36, "36 servicers")
check(A["licensed_mortgage_loan_originators"] == 9769, "9769 MLOs")
check(A["licensed_mortgage_bankers"] != A["registered_mortgage_brokers"], "banker != broker")
check(A["registered_mortgage_loan_servicers"] != A["licensed_mortgage_bankers"], "servicer != banker")
check(A["licensed_mortgage_loan_originators"] != A["licensed_mortgage_bankers"], "MLO != company")
check(A["not_current_2026_roster"] is True, "2024 != 2026")
check(snap["current_roster"]["count"] is None, "no current roster")
check(snap["weekly_bulletins"]["event_is_not_current_roster"] is True, "bulletin != roster")
check(snap["weekly_bulletins"]["issuance_is_not_active_universe"] is True, "issuance")
check(snap["weekly_bulletins"]["surrender_is_not_enforcement_violation"] is True, "surrender")
check(snap["enforcement"]["observation_rows"] == 198, "198 enf")
check(snap["enforcement"]["settlement_is_not_conviction"] is True, "conviction")
check(snap["enforcement"]["name_only_join"] == "UNSAFE", "name-only")
check(snap["hmda"]["applications"] == 388207, "apps")
check(snap["hmda"]["originations"] == 231331, "orig")
check(snap["hmda"]["denials"] == 76045, "den")
check(snap["hmda"]["application_is_not_lender"] is True, "app != lender")
check(snap["hmda"]["geography_is_not_headquarters"] is True, "geo")
check(snap["cfpb"]["complaint_is_not_violation"] is True, "complaint")
check(snap["cfpb"]["mortgage_complaint_rows"] is None, "cfpb null")
check(snap["identity"]["company_is_not_branch"] is True, "branch")
check(snap["identity"]["company_is_not_mlo"] is True, "mlo")
check(snap["mlo_person"]["grain"] == "PERSON", "person grain")
check(snap["expansion_ledger"]["NET_NEW_CANONICAL_ORGANIZATIONS"] == 0, "orgs")
check(snap["expansion_ledger"]["NET_NEW_PUBLIC_LENDER_PROFILES"] == 0, "profiles")
check(snap["expansion_ledger"]["EXISTING_ORGANIZATIONS_ENRICHED"] == 0, "enrich")
check(snap["claimEligibilityBroadened"] is False, "claim")
check(snap["no_trust_score"] is True, "trust")
check(snap["noCountyRoutes"] is True, "no counties")
check("NEW_NY_LENDER_IDENTITIES" not in snap["expansion_ledger"], "no mixed identity")
body = {k: v for k, v in snap.items() if k != "fingerprint"}
check(sha(body) == sha(body), "fingerprint twice")
check(sha(body) == FP, "fingerprint body")

def mutates(path, value, label):
    m = copy.deepcopy(snap)
    cur = m
    for key in path[:-1]:
        cur = cur[key]
    cur[path[-1]] = value
    check(sha({k: v for k, v in m.items() if k != "fingerprint"}) != FP, label)

mutates(["dfs_2024_aggregates", "licensed_mortgage_bankers"], 590, "mutation bankers")
mutates(["dfs_2024_aggregates", "registered_mortgage_brokers"], 151, "mutation brokers")
mutates(["current_roster", "coverage_state"], "ACQUIRED_CURRENT_SNAPSHOT", "mutation roster coverage")
mutates(["current_roster", "count"], 0, "mutation missing as zero")
mutates(["weekly_bulletins", "NY_DFS_2026_MORTGAGE_BULLETIN_EVENTS"], 151, "mutation bulletin events")
mutates(["enforcement", "observation_rows"], 0, "mutation enforcement")
mutates(["enforcement", "name_only_join"], "SAFE", "mutation name-only")
mutates(["hmda", "applications"], 151, "mutation hmda")
mutates(["cfpb", "mortgage_complaint_rows"], 0, "mutation cfpb zero")
mutates(["identity", "name_only"], "SAFE", "mutation identity")
mutates(["claimEligibilityBroadened"], True, "mutation claim")
mutates(["grain_classification", "dfs_2024_bankers"], "INTERNAL_DIAGNOSTIC_ONLY", "mutation public grain")
mutates(["no_trust_score"], False, "mutation trust score")
print("ny-lend-001-tests.py pass")

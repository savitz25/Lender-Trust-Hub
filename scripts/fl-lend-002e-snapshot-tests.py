#!/usr/bin/env python3
"""Deterministic fingerprint + grain tests against last-accepted snapshots."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from importlib.machinery import SourceFileLoader

gen = SourceFileLoader("gen002e", str(ROOT / "scripts" / "fl-lend-002e-generate-snapshots.py")).load_module()

national = json.loads((ROOT / "lib" / "home-intel" / "accepted-snapshot.json").read_text(encoding="utf-8"))
florida = json.loads((ROOT / "lib" / "florida-intelligence" / "accepted-snapshot.json").read_text(encoding="utf-8"))

failed = 0


def check(name: str, cond: bool, detail: str = "") -> None:
    global failed
    if cond:
        print("PASS", name, detail)
    else:
        failed += 1
        print("FAIL", name, detail)


check("n_fp", gen.fingerprint_payload(national) == national["fingerprint"], national["fingerprint"])
check("f_fp", gen.fingerprint_payload(florida) == florida["fingerprint"], florida["fingerprint"])
n2 = dict(national)
n2["generated_at"] = "2099-01-01T00:00:00+00:00"
f2 = dict(florida)
f2["generated_at"] = "2099-01-01T00:00:00+00:00"
check("n_fp_clock", gen.fingerprint_payload(n2) == national["fingerprint"])
check("f_fp_clock", gen.fingerprint_payload(f2) == florida["fingerprint"])
check("n_contract", national["snapshotVersion"] == "lender-home-intel-snapshot-v2")
check("f_contract", florida["contract"] == "lender-fl-state-intel-v2")
check("creds_ne_companies", florida["licensing"]["approved_credentials"] != florida["licensing"]["unique_nmls"])
check("held_ne_3907", florida["licensing"]["held_nmls"] != florida["graph"]["unresolved_source_company_nmls"])
check("branch_grain", florida["graph"]["fl_branch_entities"] != florida["graph"]["fl_branch_license_rows"])
check("mlo_grain", florida["graph"]["fl_lo_nmls"] != florida["graph"]["fl_lo_license_rows"])
check("ppc", national["graph"]["person_public_candidate"] == 0)
check("not_164936_hero", florida["licensing"]["unique_nmls"] != 164936)
check("pub_file", national["publicRender"] == 181 and national["floridaPublic"] == 130)

if failed:
    print("FAILED", failed)
    raise SystemExit(1)
print("PASS fl-lend-002e-snapshot-tests")

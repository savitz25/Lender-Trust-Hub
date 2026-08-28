#!/usr/bin/env python3
"""FL-LEND-002D — build SQL-Editor staging CSVs from audited OFR files. Does not write Production."""
from __future__ import annotations

import csv
import hashlib
import importlib.util
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "generated" / "fl-lend-002d"
PUB = OUT / "public"
PRIV = OUT / "private"
CHUNK = 20000
NS_NOTE = "9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b"


def load_ing():
    spec = importlib.util.spec_from_file_location("ing", ROOT / "scripts" / "fl-lend-002-ingest.py")
    ing = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ing)
    return ing


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> dict:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") if r.get(k, "") is not None else "" for k in fieldnames})
    rec = {"filename": path.name, "relpath": str(path.relative_to(ROOT)).replace("\\", "/"), "row_count": len(rows), "sha256": sha256_file(path), "bytes": path.stat().st_size}
    print("WROTE", rec["relpath"], rec["row_count"], rec["sha256"][:12], flush=True)
    return rec


def chunk_rows(path_prefix: Path, fieldnames: list[str], rows: list[dict], private: bool) -> list[dict]:
    out = []
    if not rows:
        return [write_csv(path_prefix.parent / f"{path_prefix.name}_001.csv", fieldnames, [])]
    n = 0
    for i in range(0, len(rows), CHUNK):
        n += 1
        part = rows[i : i + CHUNK]
        p = path_prefix.parent / f"{path_prefix.name}_{n:03d}.csv"
        out.append(write_csv(p, fieldnames, part))
    return out


def d(v) -> str:
    if v is None:
        return ""
    return str(v)


def main() -> int:
    ing = load_ing()
    src = ing.load_sources()
    companies = sorted(ing.source_company_nmls(src))
    if len(companies) != 10216:
        print("STOP company NMLS", len(companies), "expected 10216")
        return 2

    names: dict[str, str] = {}
    families: dict[str, set[str]] = defaultdict(set)
    keys: dict[str, list[str]] = defaultdict(list)

    for r in src["monthly_mld"]:
        if (r.get("LICENSE TYPE") or "").strip() != "MLD":
            continue
        n = ing.nmls_norm(r.get("NMLS ID"))
        if not n:
            continue
        families[n].add("monthly_mld")
        lic = (r.get("LICENSE NUMBER") or "").strip()
        if lic:
            keys[n].append(f"FL|MONTHLY|MLD|{lic}")
        firm = (r.get("FIRM NAME") or "").strip()
        if firm and len(firm) > len(names.get(n, "")):
            names[n] = firm
    for r in src["monthly_mbr"]:
        if (r.get("LICENSE TYPE") or "").strip() != "MBR":
            continue
        n = ing.nmls_norm(r.get("NMLS ID"))
        if not n:
            continue
        families[n].add("monthly_mbr")
        lic = (r.get("LICENSE NUMBER") or "").strip()
        if lic:
            keys[n].append(f"FL|MONTHLY|MBR|{lic}")
        firm = (r.get("FIRM NAME") or "").strip()
        if firm and len(firm) > len(names.get(n, "")):
            names[n] = firm
    for r in src["nmls_biz"]:
        if (r.get("Branch Id") or "").strip():
            continue
        n = ing.nmls_norm(r.get("Company Id"))
        if not n:
            continue
        families[n].add("nmls_prr")
        lic = (r.get("License Number") or "").strip()
        klass = ing.NMLS_LICENSE_MAP.get((r.get("License Name") or "").strip()) or "UNK"
        if lic:
            keys[n].append(f"FL|NMLS|{klass}|{lic}")
        firm = (r.get("Company Name") or "").strip()
        if firm and len(firm) > len(names.get(n, "")):
            names[n] = firm

    company_rows = [
        {
            "company_nmls_id": n,
            "legal_name": names.get(n, ""),
            "source_families": "|".join(sorted(families.get(n, []))),
            "source_record_keys": "|".join(keys.get(n, [])[:12]),
        }
        for n in companies
    ]

    cred_fields = [
        "company_nmls_id", "license_number", "license_class", "ofr_status",
        "initial_approval_on", "status_effective_on", "source_clock", "source_dataset",
        "source_record_id", "source_observed_on", "firm_name",
        "prim_address1", "prim_address2", "prim_city", "prim_county", "prim_state", "prim_zip",
        "phone", "servicer_flag", "raw_metadata",
    ]
    creds = []

    def add_monthly_co(rows, klass):
        for r in rows:
            if (r.get("LICENSE TYPE") or "").strip() != klass:
                continue
            n = ing.nmls_norm(r.get("NMLS ID"))
            lic = (r.get("LICENSE NUMBER") or "").strip()
            if not n or not lic:
                continue
            creds.append({
                "company_nmls_id": n,
                "license_number": lic,
                "license_class": klass,
                "ofr_status": (r.get("STATUS") or "").strip(),
                "initial_approval_on": d(ing.parse_date(r.get("INTIAL APPROVAL"))),
                "status_effective_on": d(ing.parse_date(r.get("STATUS EFFECTIVE DATE"))),
                "source_clock": "monthly_full",
                "source_dataset": ing.SOURCE_MONTHLY,
                "source_record_id": f"FL|MONTHLY|{klass}|{lic}",
                "source_observed_on": str(ing.MONTHLY_AS_OF),
                "firm_name": (r.get("FIRM NAME") or "").strip(),
                "prim_address1": (r.get("PRIM ADDRESS 1") or "").strip(),
                "prim_address2": (r.get("PRIM ADDRESS 2") or "").strip(),
                "prim_city": (r.get("PRIM CITY") or "").strip(),
                "prim_county": (r.get("COUNTY") or "").strip(),
                "prim_state": (r.get("PRIM STATE") or "").strip(),
                "prim_zip": (r.get("PRIM ZIP") or "").strip(),
                "phone": (r.get("PHONE") or "").strip(),
                "servicer_flag": (r.get("SERVICER") or "").strip(),
                "raw_metadata": "",
            })

    add_monthly_co(src["monthly_mld"], "MLD")
    add_monthly_co(src["monthly_mbr"], "MBR")

    for r in src["nmls_biz"]:
        klass = ing.NMLS_LICENSE_MAP.get((r.get("License Name") or "").strip())
        if klass not in {"MLD", "MBR", "MLS"}:
            continue
        n = ing.nmls_norm(r.get("Company Id"))
        lic = (r.get("License Number") or "").strip()
        if not n or not lic:
            continue
        creds.append({
            "company_nmls_id": n,
            "license_number": lic,
            "license_class": klass,
            "ofr_status": (r.get("License Status") or "").strip(),
            "initial_approval_on": d(ing.parse_date(r.get("Original License Date"))),
            "status_effective_on": d(ing.parse_date(r.get("License Status Date"))),
            "source_clock": "nmls_active",
            "source_dataset": ing.SOURCE_NMLS,
            "source_record_id": f"FL|NMLS|{klass}|{lic}",
            "source_observed_on": str(ing.NMLS_AS_OF),
            "firm_name": (r.get("Company Name") or "").strip(),
            "prim_address1": (r.get("Street") or "").strip(),
            "prim_address2": "",
            "prim_city": (r.get("City") or "").strip(),
            "prim_county": "",
            "prim_state": (r.get("State") or "").strip(),
            "prim_zip": (r.get("Postal Code") or "").strip(),
            "phone": (r.get("Company Contact Phone") or "").strip(),
            "servicer_flag": "",
            "raw_metadata": (r.get("License Name") or "").strip(),
        })

    parents = ing.branch_parent_map(src["nmls_biz"])
    br_fields = [
        "branch_nmls_id", "parent_company_nmls_id", "license_number", "license_class",
        "ofr_status", "source_clock", "source_dataset", "source_record_id", "source_observed_on",
        "firm_name", "address1", "city", "state", "zip", "email", "phone",
    ]
    branches = []
    seen_br = set()
    for r in src["nmls_biz"]:
        klass = ing.NMLS_LICENSE_MAP.get((r.get("License Name") or "").strip())
        bid = ing.nmls_norm(r.get("Branch Id"))
        if klass not in {"MLDB", "MBRB", "MLSB"} or not bid:
            continue
        cid = ing.nmls_norm(r.get("Company Id"))
        lic = (r.get("License Number") or "").strip()
        seen_br.add(bid)
        branches.append({
            "branch_nmls_id": bid,
            "parent_company_nmls_id": parents["parent"].get(bid) or cid or "",
            "license_number": lic,
            "license_class": klass,
            "ofr_status": (r.get("License Status") or "").strip(),
            "source_clock": "nmls_active",
            "source_dataset": ing.SOURCE_NMLS,
            "source_record_id": f"FL|NMLS|{klass}|{lic}",
            "source_observed_on": str(ing.NMLS_AS_OF),
            "firm_name": (r.get("Company Name") or "").strip(),
            "address1": (r.get("Street") or "").strip(),
            "city": (r.get("City") or "").strip(),
            "state": (r.get("State") or "").strip(),
            "zip": (r.get("Postal Code") or "").strip(),
            "email": (r.get("Company Contact Email") or "").strip(),
            "phone": (r.get("Company Contact Phone") or "").strip(),
        })
    def add_monthly_br(rows, klass):
        for r in rows:
            if (r.get("LICENSE TYPE") or "").strip() != klass:
                continue
            bid = ing.nmls_norm(r.get("NMLS ID"))
            lic = (r.get("LICENSE NUMBER") or "").strip()
            if not bid or not lic:
                continue
            branches.append({
                "branch_nmls_id": bid,
                "parent_company_nmls_id": parents["parent"].get(bid, ""),
                "license_number": lic,
                "license_class": klass,
                "ofr_status": (r.get("STATUS") or "").strip(),
                "source_clock": "monthly_full",
                "source_dataset": ing.SOURCE_MONTHLY,
                "source_record_id": f"FL|MONTHLY|{klass}|{lic}",
                "source_observed_on": str(ing.MONTHLY_AS_OF),
                "firm_name": (r.get("FIRM NAME") or "").strip(),
                "address1": (r.get("PRIM ADDRESS 1") or "").strip(),
                "city": (r.get("PRIM CITY") or "").strip(),
                "state": (r.get("PRIM STATE") or "").strip(),
                "zip": (r.get("PRIM ZIP") or "").strip(),
                "email": "",
                "phone": (r.get("PHONE") or "").strip(),
            })
    add_monthly_br(src["monthly_mld"], "MLDB")
    add_monthly_br(src["monthly_mbr"], "MBRB")

    mlo_fields = [
        "individual_nmls_id", "fl_lo_license", "ofr_status", "person_last", "person_first",
        "person_middle", "source_clock", "source_dataset", "source_record_id", "source_observed_on",
        "initial_approval_on", "status_effective_on",
    ]
    mlos = []
    for r in src["monthly_lo"]:
        if (r.get("LICENSE TYPE") or "").strip() != "LO":
            continue
        n = ing.nmls_norm(r.get("NMLS ID"))
        lic = (r.get("LICENSE NUMBER") or "").strip()
        if not lic:
            continue
        mlos.append({
            "individual_nmls_id": n or "",
            "fl_lo_license": lic,
            "ofr_status": (r.get("STATUS") or "").strip(),
            "person_last": (r.get("LAST NAME") or "").strip(),
            "person_first": (r.get("FIRST NAME") or "").strip(),
            "person_middle": (r.get("MIDDLE NAME") or "").strip(),
            "source_clock": "monthly_full",
            "source_dataset": ing.SOURCE_MONTHLY,
            "source_record_id": f"FL|MONTHLY|LO|{lic}",
            "source_observed_on": str(ing.MONTHLY_AS_OF),
            "initial_approval_on": d(ing.parse_date(r.get("INTIAL APPROVAL"))),
            "status_effective_on": d(ing.parse_date(r.get("STATUS EFFECTIVE DATE"))),
        })
    for r in src["nmls_lo"]:
        n = ing.nmls_norm(r.get("Individual Id"))
        lic = (r.get("License Number") or "").strip()
        if not lic:
            continue
        mlos.append({
            "individual_nmls_id": n or "",
            "fl_lo_license": lic,
            "ofr_status": (r.get("License Status") or "").strip(),
            "person_last": (r.get("Individual Last Name") or "").strip(),
            "person_first": (r.get("Individual First Name") or "").strip(),
            "person_middle": (r.get("Individual Middle Name") or "").strip(),
            "source_clock": "nmls_active",
            "source_dataset": ing.SOURCE_NMLS,
            "source_record_id": f"FL|NMLS|LO|{lic}",
            "source_observed_on": str(ing.NMLS_AS_OF),
            "initial_approval_on": d(ing.parse_date(r.get("Original License Date"))),
            "status_effective_on": d(ing.parse_date(r.get("License Status Date"))),
        })

    spon_fields = ["individual_nmls_id", "sponsor_company_nmls_id", "source_dataset", "source_record_id", "source_observed_on", "sponsorship_status"]
    spons = []
    for r in src["nmls_lo"]:
        ind = ing.nmls_norm(r.get("Individual Id"))
        sp = ing.nmls_norm(r.get("Sponsoring Company ID"))
        if not ind or not sp:
            continue
        lic = (r.get("License Number") or "").strip()
        spons.append({
            "individual_nmls_id": ind,
            "sponsor_company_nmls_id": sp,
            "source_dataset": ing.SOURCE_NMLS,
            "source_record_id": f"FL|LO|{ind}|sponsor|{sp}",
            "source_observed_on": str(ing.NMLS_AS_OF),
            "sponsorship_status": (r.get("Sponsorship Status") or "").strip(),
        })

    biz_fields = ["company_nmls_id", "contact_kind", "phone", "email", "address1", "city", "state", "zip", "classification", "source_dataset", "source_record_id", "source_observed_on"]
    biz = []
    seen_co = set()
    for r in src["nmls_biz"]:
        if (r.get("Branch Id") or "").strip():
            continue
        n = ing.nmls_norm(r.get("Company Id"))
        if not n or n in seen_co:
            continue
        seen_co.add(n)
        email = (r.get("Company Contact Email") or "").strip()
        phone = (r.get("Company Contact Phone") or "").strip()
        cemail = (r.get("Complaint Contact Email") or "").strip()
        cphone = (r.get("Complaint Contact Phone") or "").strip()
        addr = (r.get("Street") or "").strip()
        city = (r.get("City") or "").strip()
        st = (r.get("State") or "").strip()
        z = (r.get("Postal Code") or "").strip()
        if email and "@" in email:
            biz.append({"company_nmls_id": n, "contact_kind": "email", "phone": "", "email": email, "address1": addr, "city": city, "state": st, "zip": z, "classification": "review_before_public", "source_dataset": ing.SOURCE_NMLS, "source_record_id": f"FL|NMLS_CO|{n}|email", "source_observed_on": str(ing.NMLS_AS_OF)})
        if len(ing.digits(phone)) >= 10:
            biz.append({"company_nmls_id": n, "contact_kind": "phone", "phone": phone, "email": "", "address1": addr, "city": city, "state": st, "zip": z, "classification": "review_before_public", "source_dataset": ing.SOURCE_NMLS, "source_record_id": f"FL|NMLS_CO|{n}|phone", "source_observed_on": str(ing.NMLS_AS_OF)})
        if cemail and "@" in cemail:
            biz.append({"company_nmls_id": n, "contact_kind": "email", "phone": "", "email": cemail, "address1": addr, "city": city, "state": st, "zip": z, "classification": "review_before_public", "source_dataset": ing.SOURCE_NMLS, "source_record_id": f"FL|NMLS_CO|{n}|complaint_email", "source_observed_on": str(ing.NMLS_AS_OF)})
        if len(ing.digits(cphone)) >= 10:
            biz.append({"company_nmls_id": n, "contact_kind": "phone", "phone": cphone, "email": "", "address1": addr, "city": city, "state": st, "zip": z, "classification": "review_before_public", "source_dataset": ing.SOURCE_NMLS, "source_record_id": f"FL|NMLS_CO|{n}|complaint_phone", "source_observed_on": str(ing.NMLS_AS_OF)})

    pcon_fields = ["individual_nmls_id", "contact_kind", "email", "classification", "source_dataset", "source_record_id", "source_observed_on"]
    pcons = []
    seen_p = set()
    for r in src["nmls_lo"]:
        n = ing.nmls_norm(r.get("Individual Id"))
        if not n:
            continue
        for col in ("Individual Notification Email Address", "Individual Filing Email Address"):
            val = (r.get(col) or "").strip()
            if val and "@" in val:
                sid = f"FL|NMLS_PERSON|{n}|{col}"
                if sid in seen_p:
                    continue
                seen_p.add(sid)
                pcons.append({"individual_nmls_id": n, "contact_kind": "email", "email": val, "classification": "internal_only", "source_dataset": ing.SOURCE_NMLS, "source_record_id": sid, "source_observed_on": str(ing.NMLS_AS_OF)})

    PUB.mkdir(parents=True, exist_ok=True)
    PRIV.mkdir(parents=True, exist_ok=True)
    man = {
        "task": "FL-LEND-002D",
        "uuid_namespace": NS_NOTE,
        "expected": {
            "companies": 10216,
            "branch_nmls_prr": 6690,
            "sponsorship_rows": 53421,
            "dual_mld_mbr": 637,
        },
        "public": {},
        "private": {},
        "counts": {},
    }
    man["public"]["fl_company_nmls.csv"] = write_csv(PUB / "fl_company_nmls.csv", ["company_nmls_id", "legal_name", "source_families", "source_record_keys"], company_rows)
    man["public"]["fl_company_credentials.csv"] = write_csv(PUB / "fl_company_credentials.csv", cred_fields, creds)
    man["public"]["fl_branches.csv"] = write_csv(PUB / "fl_branches.csv", br_fields, branches)
    man["public"]["fl_business_contacts.csv"] = write_csv(PUB / "fl_business_contacts.csv", biz_fields, biz)
    man["private"]["fl_mlo"] = chunk_rows(PRIV / "fl_mlo_private", mlo_fields, mlos, True)
    man["private"]["fl_mlo_sponsorship"] = chunk_rows(PRIV / "fl_mlo_sponsorship_private", spon_fields, spons, True)
    man["private"]["fl_person_contacts"] = chunk_rows(PRIV / "fl_person_contacts_private", pcon_fields, pcons, True)

    dual = 0
    mld_n = {c["company_nmls_id"] for c in creds if c["license_class"] == "MLD"}
    mbr_n = {c["company_nmls_id"] for c in creds if c["license_class"] == "MBR"}
    dual = len(mld_n & mbr_n)
    man["counts"] = {
        "companies": len(company_rows),
        "company_credentials": len(creds),
        "company_cred_by_class_clock": {},
        "branch_rows": len(branches),
        "distinct_branch_nmls_prr": len(seen_br),
        "parent_collisions": len(parents["collisions"]),
        "mlo_credential_rows": len(mlos),
        "sponsorship_rows": len(spons),
        "business_contact_rows": len(biz),
        "person_contact_rows": len(pcons),
        "dual_mld_mbr_nmls": dual,
        "mlo_chunk_rows": sum(x["row_count"] for x in man["private"]["fl_mlo"]),
        "spon_chunk_rows": sum(x["row_count"] for x in man["private"]["fl_mlo_sponsorship"]),
    }
    by = defaultdict(int)
    for c in creds:
        by[f"{c['license_class']}|{c['source_clock']}"] += 1
    man["counts"]["company_cred_by_class_clock"] = dict(by)
    byb = defaultdict(int)
    for b in branches:
        byb[f"{b['license_class']}|{b['source_clock']}"] += 1
    man["counts"]["branch_by_class_clock"] = dict(byb)

    if len(company_rows) != 10216:
        print("STOP companies", len(company_rows))
        return 2
    if len(seen_br) != 6690:
        print("STOP prr branches", len(seen_br), "expected 6690")
        return 2
    if len(spons) != 53421:
        print("STOP sponsorship", len(spons), "expected 53421")
        return 2
    if man["counts"]["mlo_chunk_rows"] != len(mlos):
        print("STOP mlo chunk sum")
        return 2

    (OUT / "manifest.json").write_text(json.dumps(man, indent=2), encoding="utf-8")
    print("WROTE manifest", OUT / "manifest.json", flush=True)
    print(json.dumps(man["counts"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

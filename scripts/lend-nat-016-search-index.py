#!/usr/bin/env python3
"""LEND-NAT-016 — bounded search index for render-enabled national profiles.

Reads lender_profile_intelligence by PK for the 181 render cohort only.
Does not scan CFPB events or HMDA observations. No evidence writes.
"""
from __future__ import annotations

import json
import os
import uuid
from pathlib import Path

import psycopg
from psycopg.rows import dict_row

EXPECTED = "arepfylnilkjmyduhwbz"
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENV = Path(r"C:\Users\makei\move-trust-hub\.env.local")
RENDER = ROOT / "docs" / "lend-nat-014-render-cohort.json"
OUT = ROOT / "docs" / "lend-nat-016-search-index.json"


def load_env() -> None:
    if not DEFAULT_ENV.exists():
        return
    for raw in DEFAULT_ENV.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def locality_artifact(name: str) -> bool:
    n = name or ""
    if " team" in n.lower() or n.lower().endswith(" team"):
        return True
    return " (" in n or " — " in n or " – " in n


def presentation_name(canonical: str, display: str | None) -> str:
    disp = (display or "").strip()
    can = (canonical or "").strip()
    if disp and locality_artifact(disp) and can and not locality_artifact(can):
        return can
    return disp or can


def ids_from_profile(profile: dict, stable: str) -> dict[str, str | None]:
    out: dict[str, str | None] = {"nmls": None, "fdic": None, "ncua": None, "lei": None}
    for ident in profile.get("identity", {}).get("identifiers") or []:
        t = ident.get("identifier_type")
        v = str(ident.get("identifier_value") or "").strip()
        if not v:
            continue
        if t == "NMLS_INSTITUTION":
            out["nmls"] = v
        elif t == "FDIC_CERT":
            out["fdic"] = v
        elif t == "NCUA_CHARTER":
            out["ncua"] = v
        elif t == "LEI":
            out["lei"] = v.upper()
    if not out["lei"] and stable.startswith("gleif-lei:"):
        out["lei"] = stable.split("gleif-lei:", 1)[1].upper()
    if not out["nmls"] and stable.startswith("nmls-inst:"):
        out["nmls"] = stable.split("nmls-inst:", 1)[1]
    if not out["fdic"] and stable.startswith("fdic-cert:"):
        out["fdic"] = stable.split("fdic-cert:", 1)[1]
    return out


def browse_types(row: dict, servicer: str) -> list[str]:
    types: list[str] = []
    dep = row.get("depository")
    if dep == "FDIC":
        types.append("bank")
    elif dep == "NCUA":
        types.append("credit_union")
    elif dep == "NONBANK":
        types.append("nonbank")
    if servicer in ("CONFIRMED", "HISTORICAL"):
        types.append("servicer")
    return types


def main() -> int:
    load_env()
    url = os.environ.get("DATABASE_URL") or ""
    if EXPECTED not in url:
        raise SystemExit("bad DATABASE_URL")
    render = json.loads(RENDER.read_text(encoding="utf-8"))
    rows = render["rows"]
    ids = [uuid.UUID(r["institution_id"]) for r in rows]
    with psycopg.connect(url, connect_timeout=30, row_factory=dict_row) as conn:
        cur = conn.cursor()
        cur.execute(
            "select entity_id::text as entity_id, profile from lender_profile_intelligence where entity_id = any(%s)",
            (ids,),
        )
        profiles = {r["entity_id"]: r["profile"] for r in cur.fetchall()}

    index = []
    missing = []
    for row in rows:
        p = profiles.get(row["institution_id"])
        if not p:
            missing.append(row["slug"])
            continue
        ident = ids_from_profile(p, row["stable_key"])
        identity = p.get("identity") or {}
        geo = p.get("geography") or {}
        hq = geo.get("headquarters") or {}
        names = []
        for n in identity.get("names") or []:
            kind = (n.get("kind") or "").lower()
            nm = (n.get("name") or "").strip()
            if nm and kind in {"historical", "former", "previous", "dba", "trade", "other", "alias", "brand"}:
                names.append(nm)
        servicer = row.get("servicer") or (p.get("coverage") or {}).get("servicer_role") or "NOT ESTABLISHED"
        canonical = (identity.get("canonical_name") or row.get("canonical_name") or "").strip()
        display = identity.get("display_name") or row.get("display_name")
        index.append(
            {
                "institution_id": row["institution_id"],
                "slug": row["slug"],
                "canonical_name": canonical,
                "display_name": display,
                "presentation_name": presentation_name(canonical, display),
                "stable_key": row["stable_key"],
                "historical_names": names,
                "nmls": ident["nmls"],
                "fdic": ident["fdic"],
                "ncua": ident["ncua"],
                "lei": ident["lei"],
                "hq_city": hq.get("city"),
                "hq_state": hq.get("state") or row.get("hq_state"),
                "depository": row.get("depository"),
                "browse_types": browse_types(row, servicer),
                "servicer_role": servicer,
                "evidence": {
                    "hmda": row.get("hmda") == "AVAILABLE",
                    "cfpb": int(row.get("cfpb_n") or 0) > 0,
                    "enforcement": int(row.get("enf_n") or 0) > 0,
                    "servicer": servicer in ("CONFIRMED", "HISTORICAL"),
                },
                "indexable": bool(row.get("index")),
            }
        )

    payload = {
        "cohort_version": render["cohort_version"],
        "count": len(index),
        "indexable_count": sum(1 for r in index if r["indexable"]),
        "hold_count": sum(1 for r in index if not r["indexable"]),
        "missing_snapshots": missing,
        "rows": index,
    }
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print("rows", len(index), "missing", missing, "indexable", payload["indexable_count"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Audit FL-LEND-006 contact classifications for Phase 1 public payload."""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
import importlib.util
import psycopg2
from psycopg2.extras import RealDictCursor

ROOT = Path(r"C:\Users\makei\lender-trust-hub-ask-search-009")
spec = importlib.util.spec_from_file_location("g", ROOT / "scripts" / "fl-lend-006-generate.py")
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)

qa = json.loads((ROOT / "docs" / "fl-lend-006-qa-cohort.json").read_text(encoding="utf-8"))
ids = [r["institution_id"] for r in qa["rows"]]

conn = psycopg2.connect(g.lender_dsn())
conn.set_session(readonly=True, autocommit=True)
cur = conn.cursor(cursor_factory=RealDictCursor)
cur.execute(
    """
    select institution_id, nmls_id, slug, confirmed_ofr_event_count, credential_count, profile
    from lender_state_company_profiles
    where institution_id = any(%s::uuid[])
    """,
    (ids,),
)
rows = [dict(r) for r in cur.fetchall()]
by_id = {r["institution_id"]: r for r in rows}

phone_class = Counter()
contact_class = Counter()
servicer = 0
dual = 0
multi_mld = 0
mbr_only = 0
mld_only = 0
review_creds = 0
personish = []
ofr_pos = []
ofr_zero = []
samples = []

for q in qa["rows"]:
    r = by_id.get(q["institution_id"])
    if not r:
        samples.append({"slug": q["slug"], "missing": True})
        continue
    p = r["profile"]
    creds = p.get("credentialClasses") or []
    classes = [c.get("license_class") for c in creds]
    mld_n = classes.count("MLD")
    mbr_n = classes.count("MBR")
    if mbr_n and mld_n:
        dual += 1
    elif mbr_n and not mld_n:
        mbr_only += 1
    elif mld_n and not mbr_n:
        mld_only += 1
    if mld_n >= 2:
        multi_mld += 1
    if (p.get("servicerEvidence") or {}).get("ofr_mld_servicer_yes_credentials"):
        servicer += 1
    if r["confirmed_ofr_event_count"] >= 1:
        ofr_pos.append(q["slug"])
    else:
        ofr_zero.append(q["slug"])
    for c in creds:
        phone_class[c.get("phone_class") or "missing"] += 1
        contact_class[c.get("contact_class") or "missing"] += 1
        if c.get("contact_class") == "review_before_public" or c.get("phone_class") == "review_before_public":
            review_creds += 1
            personish.append({"slug": q["slug"], "nmls": r["nmls_id"], "firm": c.get("firm_name")})
    samples.append(
        {
            "slug": q["slug"],
            "tag": q["tag"],
            "creds": len(creds),
            "classes": classes,
            "ofr": r["confirmed_ofr_event_count"],
            "servicer": (p.get("servicerEvidence") or {}).get("statement"),
            "phone_classes": [c.get("phone_class") for c in creds],
            "contact_classes": [c.get("contact_class") for c in creds],
            "has_raw_metadata": "raw_metadata" in json.dumps(p),
            "has_review_notes": "identity-resolution" in json.dumps(p).lower(),
        }
    )

# corpus-wide
cur.execute(
    """
    select
      count(*) filter (where jsonb_typeof(profile->'credentialClasses')='array') n,
      count(*) filter (where confirmed_ofr_event_count>=1) ofr_pos,
      count(*) filter (where confirmed_ofr_event_count=0) ofr_zero
    from lender_state_company_profiles
    """
)
corpus = dict(cur.fetchone())

out = {
    "qa_found": len(rows),
    "phone_class": dict(phone_class),
    "contact_class": dict(contact_class),
    "qa_dual": dual,
    "qa_mbr_only": mbr_only,
    "qa_mld_only": mld_only,
    "qa_multi_mld": multi_mld,
    "qa_servicer": servicer,
    "qa_ofr_pos": ofr_pos,
    "qa_ofr_zero": ofr_zero,
    "review_before_public_creds": review_creds,
    "review_examples": personish[:10],
    "corpus": corpus,
    "samples": samples,
}
(ROOT / "docs" / "fl-lend-007-contact-audit.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
print(json.dumps({k: out[k] for k in out if k != "samples"}, indent=2))
print("SAMPLE_N", len(samples))

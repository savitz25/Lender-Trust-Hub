#!/usr/bin/env python3
"""Internal Florida profile lookup. python scripts/fl-lend-006-query.py --nmls 3030"""
from __future__ import annotations
import argparse, json
from pathlib import Path
import importlib.util
import psycopg2
from psycopg2.extras import RealDictCursor

spec = importlib.util.spec_from_file_location("g", Path(__file__).with_name("fl-lend-006-generate.py"))
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)

ap = argparse.ArgumentParser()
ap.add_argument("--nmls")
ap.add_argument("--slug")
args = ap.parse_args()
conn = psycopg2.connect(g.lender_dsn())
conn.set_session(readonly=True, autocommit=True)
cur = conn.cursor(cursor_factory=RealDictCursor)
if args.nmls:
    cur.execute("select nmls_id, slug, has_national_snapshot, confirmed_ofr_event_count, credential_count, public_projection_status, profile from lender_state_company_profiles where nmls_id=%s", (args.nmls,))
else:
    cur.execute("select nmls_id, slug, has_national_snapshot, confirmed_ofr_event_count, credential_count, public_projection_status, profile from lender_state_company_profiles where slug=%s", (args.slug,))
row = cur.fetchone()
if not row:
    raise SystemExit("not found")
print(json.dumps(dict(row), default=str, indent=2)[:4000])

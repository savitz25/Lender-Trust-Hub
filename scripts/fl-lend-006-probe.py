import sys
from pathlib import Path
import importlib.util
from psycopg2.extras import RealDictCursor
import psycopg2

spec = importlib.util.spec_from_file_location("g", Path(__file__).with_name("fl-lend-006-generate.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
conn = psycopg2.connect(m.lender_dsn())
conn.set_session(readonly=True, autocommit=True)
cur = conn.cursor(cursor_factory=RealDictCursor)
cur.execute("select to_regclass('public.lender_state_company_profiles') r")
print("table", cur.fetchone()["r"])
cur.execute("select count(*) n from lender_state_company_profiles")
print("rows", cur.fetchone()["n"])

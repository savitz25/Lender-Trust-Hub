import json, importlib.util
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor

spec = importlib.util.spec_from_file_location("g", Path(__file__).with_name("fl-lend-006-generate.py"))
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)
conn = psycopg2.connect(g.lender_dsn())
conn.set_session(readonly=True, autocommit=True)
cur = conn.cursor(cursor_factory=RealDictCursor)
cur.execute(
    """
    select count(*) n,
           min(computed_at) mn,
           max(computed_at) mx,
           count(*) filter (where computed_at > now() - interval '10 minutes') recent
    from lender_state_company_profiles
    """
)
print(json.dumps(dict(cur.fetchone()), default=str, indent=2))
from urllib.parse import urlparse
p = Path(r"C:\Users\makei\move-trust-hub\.env.local")
raw = None
for line in p.read_text(encoding="utf-8").splitlines():
    if "DATABASE_URL=" in line and "arepfyl" in line:
        raw = line.split("DATABASE_URL=", 1)[1].strip().strip('"').strip("'")
mc = psycopg2.connect(raw)
mc.set_session(readonly=True, autocommit=True)
c = mc.cursor(cursor_factory=RealDictCursor)
c.execute("select to_regclass('public.lender_state_company_profiles') r")
print("move_table", c.fetchone()["r"])
c.execute("select count(*) n from lender_national_entities where entity_kind='institution'")
print("move_institutions", c.fetchone()["n"])

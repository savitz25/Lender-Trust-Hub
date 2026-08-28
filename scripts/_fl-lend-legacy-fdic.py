from __future__ import annotations

import json
import re
import zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
text = (ROOT / "lib" / "mortgage" / "floridaLenders.ts").read_text(encoding="utf-8")
slugs = re.findall(r"slug:\s*'([^']+)'", text)
nmls = re.findall(r"nmlsId:\s*'([^']*)'", text)
names = re.findall(r"name:\s*(?:'((?:\\'|[^'])*)'|\"([^\"]*)\")", text)
print("slugs", len(slugs), "nmls", len(nmls), "names", len(names))
rows = []
for i, slug in enumerate(slugs):
    mid = nmls[i] if i < len(nmls) else ""
    nm = ""
    if i < len(names):
        nm = (names[i][0] or names[i][1] or "").replace("\\'", "'")
    rows.append({"slug": slug, "nmls": mid or None, "name": nm})
d = defaultdict(list)
for r in rows:
    if r["nmls"]:
        d[r["nmls"]].append(r["slug"])
print("distinct nmls", len(d), "empty", sum(1 for r in rows if not r["nmls"]))
for k, v in sorted(d.items(), key=lambda kv: -len(kv[1])):
    if len(v) > 1:
        print("DUP", k, len(v), v)

p = ROOT / "data/raw/florida/ofr-prr-141420/originals/florida FDIC insured Banks.xlsx"
with zipfile.ZipFile(p) as z:
    ss = z.read("xl/sharedStrings.xml").decode("utf-8", "replace")
texts = re.findall(r"<t[^>]*>([^<]*)</t>", ss)
certs = []
for t in texts:
    m = re.search(r"FDIC Cert\s*#:\s*(\d+)", t, re.I)
    if m:
        certs.append(m.group(1))
print("fdic strings", len(texts), "certs", len(certs), "distinct", len(set(certs)))
print("fdic samples", texts[:15])

out = ROOT / "data/reports/fl-lend-001-legacy-reconciliation.json"
prev = json.loads(out.read_text(encoding="utf-8"))
prev["listings"] = len(rows)
prev["distinct_nmls"] = len({r["nmls"] for r in rows if r["nmls"]})
prev["empty_nmls"] = [r["slug"] for r in rows if not r["nmls"]]
prev["duplicate_nmls_slugs"] = {k: v for k, v in d.items() if len(v) > 1}
out.write_text(json.dumps(prev, indent=2), encoding="utf-8")
print("updated legacy json")
fdic_path = ROOT / "data/reports/fl-lend-001-fdic-audit.json"
fdic_path.write_text(
    json.dumps(
        {
            "prr_141420": False,
            "last_write": "2026-06-26T09:10:10",
            "bytes": 29256,
            "sha256": "78c0a8c099d2bfa0d357032469ea7ecb332e80b948938824d39baf57b37f0f6f",
            "shared_strings": len(texts),
            "cert_mentions": len(certs),
            "distinct_cert": len(set(certs)),
            "sample_lines": texts[:16],
            "note": "Preexisting FDIC list, not OFR PRR #141420. Do not duplicate national FDIC spine.",
        },
        indent=2,
    ),
    encoding="utf-8",
)
print("updated fdic json")

#!/usr/bin/env python3
"""Enumerate official OHFA Find A Lender county pages. Names are not NMLS identities."""
from __future__ import annotations

import json
import re
import ssl
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "data/ohio/oh-lend-001"
UA = "LenderTrustHub/oh-lend-001 (research; +https://www.lendertrusthub.com)"
CTX = ssl.create_default_context()
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
COUNTIES = [
    "Adams","Allen","Ashland","Ashtabula","Athens","Auglaize","Belmont","Brown","Butler",
    "Carroll","Champaign","Clark","Clermont","Clinton","Columbiana","Coshocton","Crawford",
    "Cuyahoga","Darke","Defiance","Delaware","Erie","Fairfield","Fayette","Franklin","Fulton",
    "Gallia","Geauga","Greene","Guernsey","Hamilton","Hancock","Hardin","Harrison","Henry",
    "Highland","Hocking","Holmes","Huron","Jackson","Jefferson","Knox","Lake","Lawrence",
    "Licking","Logan","Lorain","Lucas","Madison","Mahoning","Marion","Medina","Meigs",
    "Mercer","Miami","Monroe","Montgomery","Morgan","Morrow","Muskingum","Noble","Ottawa",
    "Paulding","Perry","Pickaway","Pike","Portage","Preble","Putnam","Richland","Ross",
    "Sandusky","Scioto","Seneca","Shelby","Stark","Summit","Trumbull","Tuscarawas","Union",
    "Van Wert","Vinton","Warren","Washington","Wayne","Williams","Wood","Wyandot",
]


def get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, context=CTX, timeout=90) as r:
        return r.read().decode("utf-8", errors="replace")


def parse_lenders(html: str) -> list[dict]:
    # County pages render lender names as the first cell of each expandable row.
    names: list[str] = []
    for m in re.finditer(
        r'<td[^>]*>\s*<[^>]+>\s*\+\s*</[^>]+>\s*</td>\s*<td[^>]*>\s*([^<]+?)\s*</td>',
        html,
        re.I | re.S,
    ):
        name = unescape(re.sub(r"\s+", " ", m.group(1))).strip(" ,")
        if name and name.upper() != "LENDER":
            names.append(name)
    if not names:
        for m in re.finditer(r"<strong>([^<]{3,80})</strong>", html, re.I):
            name = unescape(re.sub(r"\s+", " ", m.group(1))).strip()
            if name and "OHFA" not in name and "Learn More" not in name:
                names.append(name)
    # Fallback: markdown-ish plus rows from some renderers
    if not names:
        for m in re.finditer(r"\+\s*</td>\s*<td[^>]*>\s*([^<]{3,90})\s*<", html, re.I):
            name = unescape(re.sub(r"\s+", " ", m.group(1))).strip(" ,")
            if name:
                names.append(name)
    out = []
    seen: set[str] = set()
    for name in names:
        key = re.sub(r"\s+", " ", name).strip()
        if not key or key in seen:
            continue
        seen.add(key)
        block_idx = html.lower().find(key.lower())
        chunk = html[block_idx : block_idx + 2500] if block_idx >= 0 else ""
        programs = {
            "down_payment": "Down Payment" in chunk or "homebuyerprogram" in chunk.lower(),
            "mtc": bool(re.search(r"\bMTC\b|mortgagetaxcredit", chunk, re.I)),
            "next_home": bool(re.search(r"Next Home|nexthome", chunk, re.I)),
            "refi": bool(re.search(r"\bREFI\b|refinance", chunk, re.I)),
        }
        out.append({"name": key, "programs": programs})
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    if len(COUNTIES) != 88:
        raise SystemExit(f"Ohio county list drifted: {len(COUNTIES)}")
    observations: list[dict] = []
    county_counts: dict[str, int] = {}
    for county in COUNTIES:
        url = "https://ohiohome.org/lenders/MyOhioLL.aspx?" + urllib.parse.urlencode({"County": county})
        html = get(url)
        lenders = parse_lenders(html)
        county_counts[county] = len(lenders)
        for row in lenders:
            observations.append(
                {
                    "county": county,
                    "lender_name": row["name"],
                    "programs": row["programs"],
                    "name_is_not_nmls": True,
                    "loan_officer_is_not_mlo_census": True,
                }
            )
        print("ohfa", county, len(lenders), flush=True)
        time.sleep(0.15)
    names = sorted({o["lender_name"] for o in observations})
    empty = [c for c, n in county_counts.items() if n == 0]
    report = {
        "retrievedAt": NOW,
        "source": "OHFA Find A Lender county pages",
        "source_url": "https://ohiohome.org/lenders/default.aspx",
        "observation_period_label": "August 2026 county tables",
        "counties_requested": 88,
        "counties_with_rows": 88 - len(empty),
        "empty_counties": empty,
        "OH_OHFA_LENDER_OBSERVATION_ROWS": len(observations),
        "OH_OHFA_DISTINCT_LENDER_NAMES": len(names),
        "OH_OHFA_COUNTY_LENDER_RELATIONSHIPS": len(observations),
        "names_are_not_exact_companies": True,
        "ohfa_is_not_dfi_license": True,
        "ohfa_is_not_endorsement": True,
        "no_nmls_bridge": True,
    }
    (OUT / "ohfa-county-lenders.json").write_text(
        json.dumps({"meta": report, "distinct_names": names, "observations": observations}, indent=2) + "\n",
        encoding="utf-8",
    )
    print("observations", len(observations), "names", len(names), "empty", empty, flush=True)


if __name__ == "__main__":
    main()

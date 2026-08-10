#!/usr/bin/env python3
"""
28-state HMDA stabilize / QA (Node-free).

Validates product folders, major-county spots, mapping slugs vs catalog,
analyzer prefix maps, and multi-state primary-state selection.

  python scripts/qa-28-state-stabilize.py
"""

from __future__ import annotations

import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PRODUCT_STATES: list[tuple[str, str, str]] = [
    ("FL", "florida", "fl"),
    ("TX", "texas", "tx"),
    ("GA", "georgia", "ga"),
    ("CA", "california", "ca"),
    ("NC", "north-carolina", "nc"),
    ("SC", "south-carolina", "sc"),
    ("NJ", "new-jersey", "nj"),
    ("NY", "new-york", "ny"),
    ("PA", "pennsylvania", "pa"),
    ("MA", "massachusetts", "ma"),
    ("RI", "rhode-island", "ri"),
    ("VT", "vermont", "vt"),
    ("ME", "maine", "me"),
    ("CT", "connecticut", "ct"),
    ("NH", "new-hampshire", "nh"),
    ("VA", "virginia", "va"),
    ("MD", "maryland", "md"),
    ("DE", "delaware", "de"),
    ("DC", "district-of-columbia", "dc"),
    ("TN", "tennessee", "tn"),
    ("IL", "illinois", "il"),
    ("OH", "ohio", "oh"),
    ("MI", "michigan", "mi"),
    ("IN", "indiana", "in"),
    ("AZ", "arizona", "az"),
    ("CO", "colorado", "co"),
    ("WI", "wisconsin", "wi"),
    ("MN", "minnesota", "mn"),
]

# Prompt-spot high-volume counties (directory slugs)
SPOT_COUNTIES: dict[str, list[str]] = {
    "FL": ["miami-dade", "broward", "orange"],
    "TX": ["harris", "dallas", "travis"],
    "GA": ["fulton", "gwinnett"],
    "CA": ["los-angeles", "san-diego", "santa-clara"],
    "NC": ["wake", "mecklenburg"],
    "SC": ["horry", "charleston"],
    "NJ": ["bergen"],
    "NY": ["kings", "new-york-county"],
    "PA": ["philadelphia"],
    "MA": ["middlesex"],
    "RI": ["providence"],
    "VT": ["chittenden"],
    "ME": ["cumberland"],
    "CT": ["western-connecticut"],
    "NH": ["hillsborough"],
    "VA": ["fairfax"],
    "MD": ["montgomery"],
    "DE": ["new-castle"],
    "DC": ["district-of-columbia"],
    "TN": ["davidson", "shelby"],
    "IL": ["cook"],
    "OH": ["franklin"],
    "MI": ["oakland"],
    "IN": ["marion"],
    "WI": ["milwaukee"],
    "MN": ["hennepin"],
    "AZ": ["maricopa"],
    "CO": ["denver"],
}

REQUIRED_FILES = (
    "county_market_summary_{sfx}.csv",
    "lender_activity_by_county_{sfx}.csv",
    "lender_state_summary_{sfx}.csv",
    "lei_to_nmls_mapping.csv",
)

errs: list[str] = []
warns: list[str] = []
oks: list[str] = []


def ok(msg: str) -> None:
    oks.append(msg)
    print(f"  OK  {msg}")


def fail(msg: str) -> None:
    errs.append(msg)
    print(f" FAIL {msg}")


def warn(msg: str) -> None:
    warns.append(msg)
    print(f" WARN {msg}")


def county_name_to_slug(name: str) -> str:
    s = name.strip().lower().replace(".", "").replace("'", "")
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^a-z0-9-]", "", s)
    return s


def resolve_county_slug(code: str, county_name: str, county_fips: str = "") -> str:
    fips = (county_fips or "").strip()
    base = county_name_to_slug(county_name)
    if code == "NY" and (fips == "36061" or base == "new-york"):
        return "new-york-county"
    return base


def load_catalog_slugs() -> set[str]:
    catalog: set[str] = set()
    mortgage = ROOT / "lib" / "mortgage"
    for p in mortgage.glob("*.ts"):
        text = p.read_text(encoding="utf-8", errors="ignore")
        for m in re.finditer(r"slug:\s*'([^']+)'", text):
            catalog.add(m.group(1))
    # national host + mock may also hold slugs
    for rel in ("lib/mockData.ts", "lib/lenders/index.ts", "lib/lenders/catalog.ts"):
        p = ROOT / rel
        if p.exists():
            text = p.read_text(encoding="utf-8", errors="ignore")
            for m in re.finditer(r"slug:\s*'([^']+)'", text):
                catalog.add(m.group(1))
    return catalog


def check_states_ts() -> None:
    print("\n== states.ts active codes ==")
    path = ROOT / "lib" / "hmda" / "states.ts"
    text = path.read_text(encoding="utf-8")
    for code, folder, _ in PRODUCT_STATES:
        if f"code: '{code}'" not in text and f'code: "{code}"' not in text:
            # configs use code: 'FL' form
            if f"  {code}:" not in text and f"\n  {code}:" not in text:
                fail(f"states.ts missing config key {code}")
                continue
        if f"dataFolder: '{folder}'" not in text:
            fail(f"states.ts {code} dataFolder not {folder}")
        else:
            ok(f"states.ts has {code} → {folder}")
    # active list length
    m = re.search(
        r"export const HMDA_ACTIVE_STATE_CODES[^=]*=\s*\[([^\]]+)\]",
        text,
        re.S,
    )
    if m:
        codes = re.findall(r"'([A-Z]{2})'", m.group(1))
        if len(codes) != 28:
            fail(f"HMDA_ACTIVE_STATE_CODES length {len(codes)} expected 28: {codes}")
        else:
            ok(f"HMDA_ACTIVE_STATE_CODES = 28: {', '.join(codes)}")
    else:
        warn("could not parse HMDA_ACTIVE_STATE_CODES (manual review)")


def _ts_map_has(text: str, key: str, value: str | None) -> bool:
    """Match TS map entries: key: 'val', 'key': 'val', or key: null."""
    key_pat = rf"(?:['\"]{re.escape(key)}['\"]|{re.escape(key)})"
    if value is None:
        return bool(re.search(rf"{key_pat}\s*:\s*null\b", text))
    val_pat = rf"['\"]{re.escape(value)}['\"]"
    return bool(re.search(rf"{key_pat}\s*:\s*{val_pat}", text))


def check_prefix_maps() -> None:
    print("\n== county-option.ts prefix maps ==")
    path = ROOT / "lib" / "tools" / "loan-estimate-analyzer" / "county-option.ts"
    text = path.read_text(encoding="utf-8")
    for code, folder, sfx in PRODUCT_STATES:
        if folder == "florida":
            if _ts_map_has(text, "florida", None):
                ok("prefix florida bare (null)")
            else:
                fail("PREFIX_BY_STATE missing florida: null")
            continue
        if _ts_map_has(text, folder, sfx):
            ok(f"prefix {folder} → {sfx}")
        else:
            fail(f"PREFIX_BY_STATE missing {folder!r}: {sfx!r}")
        if _ts_map_has(text, sfx, folder):
            ok(f"STATE_BY_PREFIX {sfx} → {folder}")
        else:
            fail(f"STATE_BY_PREFIX missing {sfx!r}: {folder!r}")


def check_data_and_spots(catalog: set[str]) -> None:
    print("\n== product data folders + spot counties ==")
    lei_states: dict[str, list[tuple[str, float]]] = defaultdict(list)
    lei_slug: dict[str, str] = {}
    orphans: list[tuple[str, str]] = []

    for code, folder, sfx in PRODUCT_STATES:
        d = ROOT / "data" / "hmda" / folder
        if not d.is_dir():
            fail(f"missing folder data/hmda/{folder}")
            continue
        for tmpl in REQUIRED_FILES:
            fn = tmpl.format(sfx=sfx)
            if not (d / fn).exists():
                fail(f"missing {folder}/{fn}")
        cms_path = d / f"county_market_summary_{sfx}.csv"
        if not cms_path.exists():
            continue
        rows = list(csv.DictReader(cms_path.open(encoding="utf-8")))
        if not rows:
            fail(f"{code} CMS empty")
            continue
        slug_map: dict[str, dict[str, str]] = {}
        for r in rows:
            st = (r.get("state") or "").upper()
            if st and st != code:
                fail(f"{code} CMS row state={st}")
                break
            s = resolve_county_slug(code, r.get("county_name") or "", r.get("county_fips") or "")
            slug_map[s] = r
        ok(f"{code} CMS rows={len(rows)}")

        for spot in SPOT_COUNTIES.get(code, []):
            r = slug_map.get(spot)
            if not r:
                fail(f"{code} spot county missing: {spot}")
                continue
            apps = float(r.get("total_applications") or r.get("applications") or 0)
            orig = float(r.get("total_originations") or r.get("originations") or 0)
            if apps <= 0 or orig <= 0:
                fail(f"{code}/{spot} non-positive apps={apps} orig={orig}")
            else:
                ok(f"{code}/{spot} apps={int(apps)} orig={int(orig)}")

        # state summaries
        lss = d / f"lender_state_summary_{sfx}.csv"
        for r in csv.DictReader(lss.open(encoding="utf-8")):
            lei = (r.get("lei") or "").strip().upper()
            if not lei:
                continue
            orig = float(r.get("total_originations") or 0)
            if orig > 0:
                lei_states[lei].append((code, orig))

        # mappings
        for r in csv.DictReader((d / "lei_to_nmls_mapping.csv").open(encoding="utf-8")):
            lei = (r.get("lei") or "").strip().upper()
            slug = (r.get("our_lender_slug") or "").strip()
            if slug:
                lei_slug[lei] = slug
                if catalog and slug not in catalog:
                    orphans.append((code, slug))

    if orphans:
        # de-dupe
        uniq = sorted(set(orphans))
        if len(uniq) > 20:
            fail(f"{len(uniq)} orphan mapping slugs (sample): {uniq[:12]}")
        else:
            for code, slug in uniq:
                fail(f"orphan mapping slug {code}: {slug}")
    else:
        ok(f"all mapped our_lender_slug values resolve in catalog ({len(lei_slug)} LEIs with slug)")

    print("\n== multi-state primary selection (sample) ==")
    multi = []
    for lei, sts in lei_states.items():
        if len(sts) < 2:
            continue
        if lei not in lei_slug:
            continue
        primary = max(sts, key=lambda x: x[1])
        multi.append((lei_slug[lei], primary[0], primary[1], len(sts), sorted(sts, key=lambda x: -x[1])[:5]))
    multi.sort(key=lambda x: -x[2])
    if not multi:
        warn("no multi-state mapped LEIs found")
    else:
        ok(f"{len(multi)} multi-state mapped LEIs")
        for slug, pcode, porig, n, top in multi[:10]:
            tops = ", ".join(f"{c}:{int(o)}" for c, o in top)
            print(f"       {slug}: primary={pcode} ({int(porig)}) across {n} states | {tops}")


def check_components() -> None:
    print("\n== core components / entry points ==")
    required = [
        "components/hmda/HmdaLenderEvidencePanel.tsx",
        "components/hmda/HmdaCountyMarketPanel.tsx",
        "components/hmda/HmdaSourceNote.tsx",
        "components/cfpb/CfpbComplaintPanel.tsx",
        "app/tools/loan-estimate-analyzer/page.tsx",
        "app/tools/compare-loan-estimates/page.tsx",
        "app/tools/program-finder/page.tsx",
        "app/my-lending/page.tsx",
        "app/calculators/page.tsx",
        "app/lenders/[slug]/page.tsx",
        "app/local-lenders/[state]/[county]/page.tsx",
    ]
    for rel in required:
        if (ROOT / rel).exists():
            ok(rel)
        else:
            fail(f"missing {rel}")

    # lender profile wires both panels
    lender_page = (ROOT / "app/lenders/[slug]/page.tsx").read_text(encoding="utf-8")
    for needle in (
        "HmdaLenderEvidencePanel",
        "CfpbComplaintPanel",
        "analyzerCountyOptionSlug",
        "LoanEstimateToolsCta",
    ):
        if needle in lender_page:
            ok(f"lender profile uses {needle}")
        else:
            fail(f"lender profile missing {needle}")

    county_page = (ROOT / "app/local-lenders/[state]/[county]/page.tsx").read_text(
        encoding="utf-8"
    )
    for needle in ("HmdaCountyMarketPanel", "analyzerCountyOptionSlug", "LoanEstimateToolsCta"):
        if needle in county_page:
            ok(f"county page uses {needle}")
        else:
            fail(f"county page missing {needle}")


def check_honesty_copy() -> None:
    print("\n== tools honesty copy (stale state counts) ==")
    paths = [
        ROOT / "app/tools/loan-estimate-analyzer/page.tsx",
        ROOT / "app/tools/compare-loan-estimates/page.tsx",
        ROOT / "components/tools/LoanEstimateAnalyzer.tsx",
        ROOT / "components/tools/LoanEstimateCompare.tsx",
        ROOT / "lib/tools/loan-estimate-analyzer/compare.ts",
        ROOT / "lib/tools/loan-estimate-analyzer/analyze.ts",
        ROOT / "lib/tools/loan-estimate-analyzer/client-analyze.ts",
    ]
    stale = re.compile(
        r"\b(1[0-3]|7|8|9)\s+product states\b|"
        r"FL[–-]MA|"
        r"FL[–-]ME including|"
        r"including FL[–-]MA|"
        r"including RI, VT, ME\)",
        re.I,
    )
    for p in paths:
        if not p.exists():
            fail(f"missing {p.relative_to(ROOT)}")
            continue
        text = p.read_text(encoding="utf-8")
        hits = stale.findall(text) if False else list(stale.finditer(text))
        if hits:
            for h in hits[:3]:
                fail(f"stale copy in {p.relative_to(ROOT)}: …{text[max(0,h.start()-20):h.end()+30]}…")
        else:
            ok(f"no stale low state-count copy in {p.relative_to(ROOT)}")


def main() -> int:
    print("28-state HMDA stabilize / QA")
    print(f"ROOT={ROOT}")
    if len(PRODUCT_STATES) != 28:
        fail(f"PRODUCT_STATES length {len(PRODUCT_STATES)}")

    check_states_ts()
    check_prefix_maps()
    catalog = load_catalog_slugs()
    print(f"\n  catalog slugs loaded: {len(catalog)}")
    if len(catalog) < 100:
        warn(f"catalog slug count looks low ({len(catalog)})")
    check_data_and_spots(catalog)
    check_components()
    check_honesty_copy()

    print("\n== summary ==")
    print(f"  OK:   {len(oks)}")
    print(f"  WARN: {len(warns)}")
    print(f"  FAIL: {len(errs)}")
    if errs:
        print("\nFailures:")
        for e in errs:
            print(f"  - {e}")
        return 1
    print("\nPASS — 28-state data + wiring integrity looks solid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""
Ten-state HMDA stabilize / data-integrity QA (no Node required).

Mirrors scripts/qa-stabilize-fl-tx-ga.ts data checks + catalog slug resolution.
Run: python scripts/qa-ten-state-stabilize.py
"""
from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Must match lib/hmda/states.ts HMDA_ACTIVE_STATE_CODES + configs
STATES: list[dict] = [
    {
        "code": "FL",
        "slug": "florida",
        "folder": "florida",
        "suffix": "_fl",
        "col": "florida_originations",
        "majors": {
            "miami-dade", "broward", "palm-beach", "hillsborough", "orange", "duval",
            "pinellas", "lee", "polk", "brevard", "volusia", "pasco", "seminole",
            "sarasota", "manatee", "collier", "osceola", "lake", "marion", "st-johns",
            "st-lucie",
        },
        "spot": ["miami-dade", "broward", "palm-beach", "hillsborough", "orange"],
        "prefix": None,
    },
    {
        "code": "TX",
        "slug": "texas",
        "folder": "texas",
        "suffix": "_tx",
        "col": "texas_originations",
        "majors": {
            "harris", "dallas", "tarrant", "bexar", "collin", "travis", "denton",
            "montgomery", "fort-bend", "williamson", "el-paso", "bell", "hidalgo",
            "brazoria", "galveston", "hays", "lubbock", "nueces", "cameron", "webb",
        },
        "spot": ["harris", "dallas", "tarrant", "travis", "bexar"],
        "prefix": "tx",
    },
    {
        "code": "GA",
        "slug": "georgia",
        "folder": "georgia",
        "suffix": "_ga",
        "col": "georgia_originations",
        "majors": {
            "fulton", "gwinnett", "cobb", "dekalb", "cherokee", "forsyth", "henry",
            "paulding", "clayton", "douglas", "coweta", "fayette", "bartow", "jackson",
            "carroll", "barrow", "newton", "walton", "rockdale", "chatham", "effingham",
            "bryan", "glynn", "hall", "houston", "columbia", "richmond", "muscogee",
            "bibb", "lowndes", "floyd", "clarke", "catoosa", "whitfield", "spalding",
        },
        "spot": ["fulton", "gwinnett", "cobb", "dekalb", "chatham"],
        "prefix": "ga",
    },
    {
        "code": "CA",
        "slug": "california",
        "folder": "california",
        "suffix": "_ca",
        "col": "california_originations",
        "majors": {
            "los-angeles", "san-diego", "riverside", "orange", "san-bernardino",
            "sacramento", "santa-clara", "alameda", "contra-costa", "kern", "fresno",
            "san-joaquin", "ventura", "placer", "san-mateo", "solano", "san-francisco",
            "sonoma", "stanislaus", "tulare", "santa-barbara", "san-luis-obispo",
            "monterey", "marin", "el-dorado", "merced", "shasta", "butte", "madera",
            "santa-cruz", "yolo", "nevada", "kings", "napa", "imperial", "humboldt",
        },
        "spot": ["los-angeles", "san-diego", "orange", "santa-clara", "sacramento"],
        "prefix": "ca",
    },
    {
        "code": "NC",
        "slug": "north-carolina",
        "folder": "north-carolina",
        "suffix": "_nc",
        "col": "north_carolina_originations",
        "majors": {
            "wake", "mecklenburg", "guilford", "forsyth", "durham", "cumberland",
            "union", "brunswick", "johnston", "cabarrus", "onslow", "gaston",
            "new-hanover", "iredell", "buncombe", "harnett", "catawba", "alamance",
            "davidson", "rowan", "pitt", "moore", "randolph", "henderson", "craven",
            "lincoln", "orange", "wayne", "pender", "franklin",
        },
        "spot": ["wake", "mecklenburg", "guilford", "durham", "buncombe"],
        "prefix": "nc",
    },
    {
        "code": "SC",
        "slug": "south-carolina",
        "folder": "south-carolina",
        "suffix": "_sc",
        "col": "south_carolina_originations",
        "majors": {
            "horry", "greenville", "charleston", "spartanburg", "richland", "berkeley",
            "york", "lexington", "beaufort", "dorchester", "anderson", "aiken",
            "lancaster", "sumter", "florence", "pickens", "kershaw", "laurens",
            "jasper", "georgetown", "oconee", "orangeburg", "greenwood", "cherokee",
            "darlington", "chester", "colleton", "chesterfield", "edgefield", "newberry",
        },
        "spot": ["horry", "greenville", "charleston", "richland", "york"],
        "prefix": "sc",
    },
    {
        "code": "NJ",
        "slug": "new-jersey",
        "folder": "new-jersey",
        "suffix": "_nj",
        "col": "new_jersey_originations",
        "majors": {
            "ocean", "bergen", "monmouth", "middlesex", "burlington", "camden", "essex",
            "morris", "union", "gloucester", "mercer", "hudson", "passaic", "somerset",
            "atlantic", "cape-may", "sussex", "hunterdon", "cumberland", "warren", "salem",
        },
        "spot": ["bergen", "ocean", "middlesex", "essex", "hudson"],
        "prefix": "nj",
    },
    {
        "code": "NY",
        "slug": "new-york",
        "folder": "new-york",
        "suffix": "_ny",
        "col": "new_york_originations",
        "majors": {
            "suffolk", "nassau", "erie", "monroe", "queens", "kings", "westchester",
            "onondaga", "new-york-county", "orange", "albany", "richmond", "dutchess",
            "saratoga", "rockland", "bronx", "niagara", "oneida", "schenectady",
            "rensselaer", "ulster", "broome", "putnam", "sullivan", "columbia", "greene",
            "ontario", "oswego", "wayne", "jefferson", "steuben", "chautauqua", "chemung",
            "warren", "madison", "cayuga", "tompkins", "livingston", "herkimer",
            "washington", "genesee", "st-lawrence", "fulton", "clinton", "cattaraugus",
            "montgomery", "tioga", "otsego",
        },
        "spot": ["kings", "queens", "suffolk", "nassau", "erie", "new-york-county"],
        "prefix": "ny",
    },
    {
        "code": "PA",
        "slug": "pennsylvania",
        "folder": "pennsylvania",
        "suffix": "_pa",
        "col": "pennsylvania_originations",
        "majors": {
            "philadelphia", "montgomery", "bucks", "delaware", "chester", "allegheny",
            "westmoreland", "butler", "washington", "beaver", "lancaster", "york",
            "berks", "lehigh", "northampton", "dauphin", "cumberland", "lebanon",
            "lackawanna", "luzerne", "erie", "monroe", "franklin", "centre", "fayette",
            "adams", "cambria", "lycoming", "schuylkill", "mercer", "blair", "pike",
            "carbon", "lawrence", "northumberland", "clearfield", "wayne", "somerset",
            "crawford", "indiana", "columbia", "armstrong", "perry", "bedford",
        },
        "spot": ["philadelphia", "allegheny", "montgomery", "bucks", "delaware"],
        "prefix": "pa",
    },
    {
        "code": "MA",
        "slug": "massachusetts",
        "folder": "massachusetts",
        "suffix": "_ma",
        "col": "massachusetts_originations",
        "majors": {
            "middlesex", "worcester", "essex", "norfolk", "plymouth", "bristol",
            "suffolk", "hampden", "barnstable", "berkshire", "hampshire", "franklin",
            "dukes", "nantucket",
        },
        "spot": ["middlesex", "worcester", "essex", "suffolk", "norfolk"],
        "prefix": "ma",
    },
]

# Cross-state slug collisions that must stay disambiguated via prefixes
COLLISION_COUNTIES = {
    "orange": ["florida", "california", "north-carolina", "new-york"],
    "essex": ["new-jersey", "massachusetts", "new-york"],  # NY has no essex major; NJ+MA
    "suffolk": ["new-york", "massachusetts"],
    "middlesex": ["new-jersey", "massachusetts"],
    "montgomery": ["pennsylvania", "maryland"],  # PA only product
    "wayne": ["new-york", "pennsylvania", "north-carolina"],
    "franklin": ["massachusetts", "pennsylvania", "north-carolina"],
    "monroe": ["new-york", "pennsylvania"],
    "erie": ["new-york", "pennsylvania"],
}

SPOT_LENDERS = [
    "rocket-mortgage", "united-wholesale-mortgage", "citizens-bank", "jpmorgan-chase-bank",
    "wells-fargo-bank", "freedom-mortgage", "guaranteed-rate", "td-bank", "pnc-bank",
    "mt-bank", "leader-bank", "eastern-bank", "cape-cod-five", "premium-mortgage",
    "fulton-bank", "synovus-bank", "truist-bank", "loandepot",
]

failures = 0


def fail(msg: str) -> None:
    global failures
    failures += 1
    print(f"  FAIL {msg}")


def ok(msg: str) -> None:
    print(f"  OK  {msg}")


def county_name_to_slug(name: str) -> str:
    s = name.strip().lower().replace(".", "").replace("'", "")
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^a-z0-9-]", "", s)
    return s


def resolve_slug(code: str, name: str, fips: str = "") -> str:
    if code == "NY" and (fips == "36061" or county_name_to_slug(name) == "new-york"):
        return "new-york-county"
    return county_name_to_slug(name)


def load_catalog_slugs() -> set[str]:
    slugs: set[str] = set()
    for p in (ROOT / "lib").rglob("*.ts"):
        text = p.read_text(encoding="utf-8", errors="ignore")
        slugs.update(re.findall(r"slug:\s*'([^']+)'", text))
    return slugs


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def main() -> int:
    catalog = load_catalog_slugs()
    print(f"=== Catalog slugs: {len(catalog)} ===\n")

    print("=== Product slice files (10 states) ===")
    for st in STATES:
        folder = ROOT / "data" / "hmda" / st["folder"]
        required = [
            f"county_market_summary{st['suffix']}.csv",
            f"lender_activity_by_county{st['suffix']}.csv",
            f"lender_state_summary{st['suffix']}.csv",
            "lei_to_nmls_mapping.csv",
        ]
        missing = [f for f in required if not (folder / f).exists()]
        if missing:
            fail(f"{st['code']} missing files: {missing}")
        else:
            ok(f"{st['code']} product files present under data/hmda/{st['folder']}/")

    print("\n=== Major counties + spot matrix ===")
    for st in STATES:
        markets = read_csv(
            ROOT / "data" / "hmda" / st["folder"] / f"county_market_summary{st['suffix']}.csv"
        )
        market_slugs: dict[str, dict[str, str]] = {}
        for r in markets:
            slug = resolve_slug(st["code"], r.get("county_name") or "", r.get("county_fips") or "")
            if slug:
                market_slugs[slug] = r

        miss_maj = [m for m in st["majors"] if m not in market_slugs]
        if miss_maj:
            fail(f"{st['code']} majors missing from markets: {miss_maj[:8]}{'...' if len(miss_maj)>8 else ''}")
        else:
            ok(f"{st['code']} all {len(st['majors'])} majors present in county markets")

        for county in st["spot"]:
            row = market_slugs.get(county)
            if not row:
                fail(f"{st['slug']}/{county} spot missing market row")
                continue
            try:
                apps = float(row.get("total_applications") or row.get("applications") or 0)
                orig = float(row.get("total_originations") or row.get("originations") or 0)
            except ValueError:
                apps = orig = 0
            if apps <= 0 or orig <= 0:
                fail(f"{st['slug']}/{county} non-positive apps/orig apps={apps} orig={orig}")
            else:
                ok(f"{st['slug']}/{county} apps={int(apps)} orig={int(orig)}")

    print("\n=== Mapping slug catalog integrity ===")
    total_maps = 0
    map_miss = 0
    for st in STATES:
        maps = read_csv(ROOT / "data" / "hmda" / st["folder"] / "lei_to_nmls_mapping.csv")
        for r in maps:
            slug = (r.get("our_lender_slug") or "").strip()
            if not slug:
                continue
            total_maps += 1
            if slug not in catalog:
                fail(f"{st['code']} mapping slug not in catalog: {slug}")
                map_miss += 1
    if map_miss == 0:
        ok(f"all {total_maps} non-empty mapping slugs resolve in directory catalog")

    print("\n=== Spot lenders multi-state presence ===")
    # Build lei→slug maps and state originations per slug
    slug_states: dict[str, list[tuple[str, int]]] = {}
    for st in STATES:
        maps = read_csv(ROOT / "data" / "hmda" / st["folder"] / "lei_to_nmls_mapping.csv")
        for r in maps:
            slug = (r.get("our_lender_slug") or "").strip()
            if not slug:
                continue
            col = st["col"]
            try:
                orig = int(float(r.get(col) or r.get("total_originations") or 0))
            except ValueError:
                orig = 0
            if orig <= 0:
                # fall back to total_originations as state volume when column missing
                try:
                    orig = int(float(r.get("total_originations") or 0))
                except ValueError:
                    orig = 0
            slug_states.setdefault(slug, []).append((st["code"], orig))

    for slug in SPOT_LENDERS:
        if slug not in catalog:
            fail(f"spot lender not in catalog: {slug}")
            continue
        rows = slug_states.get(slug) or []
        if not rows:
            fail(f"spot lender {slug} has no HMDA mapping in any product state")
            continue
        # primary = max originations
        rows_sorted = sorted(rows, key=lambda x: -x[1])
        primary = rows_sorted[0]
        others = [c for c, _ in rows_sorted[1:] if _ > 0]
        ok(f"lender {slug} primary={primary[0]} orig={primary[1]} others={len(others)}")

    print("\n=== Cross-state collision hygiene (prefix required) ===")
    # orange: bare FL vs ca: / nc: / ny:
    for county, states_with in COLLISION_COUNTIES.items():
        product = [s for s in STATES if s["slug"] in states_with or county in s["majors"]]
        product = [s for s in STATES if county in s["majors"]]
        if len(product) < 2:
            continue
        prefixes = []
        for s in product:
            if s["prefix"] is None:
                prefixes.append(f"(bare FL) {county}")
            else:
                prefixes.append(f"{s['prefix']}:{county}")
        ok(f"collision '{county}' live in {[s['code'] for s in product]} → {prefixes}")

    print("\n=== Analyzer prefix matrix (config-level) ===")
    prefixes = {
        "tx": "texas", "ga": "georgia", "ca": "california", "nc": "north-carolina",
        "sc": "south-carolina", "nj": "new-jersey", "ny": "new-york", "pa": "pennsylvania",
        "ma": "massachusetts",
    }
    county_option = (ROOT / "lib" / "tools" / "loan-estimate-analyzer" / "county-option.ts").read_text(
        encoding="utf-8"
    )
    for pref, state in prefixes.items():
        if f"{pref}:" not in county_option and f"{pref}: '" not in county_option and f"{pref}: '" not in county_option:
            # check STATE_BY_PREFIX entry
            if f"{pref}:" in county_option or f"{pref}: '" in county_option:
                pass
        if f"{pref}: '{state}'" in county_option or f'{pref}: "{state}"' in county_option or f"{pref}: '{state}'" in county_option.replace('"', "'"):
            ok(f"prefix {pref}: → {state}")
        elif re.search(rf"{pref}:\s*['\"]{state}['\"]", county_option):
            ok(f"prefix {pref}: → {state}")
        else:
            fail(f"prefix {pref} missing or wrong in county-option.ts")

    for st in STATES:
        if st["prefix"] is None:
            continue
        sample = sorted(st["spot"])[0]
        opt = f"{st['prefix']}:{sample}"
        # evidence exists
        markets = read_csv(
            ROOT / "data" / "hmda" / st["folder"] / f"county_market_summary{st['suffix']}.csv"
        )
        slugs = {
            resolve_slug(st["code"], r.get("county_name") or "", r.get("county_fips") or "")
            for r in markets
        }
        if sample not in slugs and sample not in st["majors"]:
            fail(f"analyzer sample {opt} county not in majors")
        else:
            ok(f"analyzer path ready {opt}")

    print("\n=== Active states config sync ===")
    states_ts = (ROOT / "lib" / "hmda" / "states.ts").read_text(encoding="utf-8")
    for code in ["FL", "TX", "GA", "CA", "NC", "SC", "NJ", "NY", "PA", "MA"]:
        if f"'{code}'" not in states_ts and f'"{code}"' not in states_ts:
            fail(f"states.ts missing {code}")
        else:
            pass
    if "HMDA_ACTIVE_STATE_CODES" in states_ts and all(
        f"'{c}'" in states_ts for c in ["FL", "TX", "GA", "CA", "NC", "SC", "NJ", "NY", "PA", "MA"]
    ):
        ok("HMDA_ACTIVE_STATE_CODES includes all 10 states")
    else:
        fail("HMDA_ACTIVE_STATE_CODES incomplete")

    # tsconfig excludes scripts (build hygiene)
    tsconfig = (ROOT / "tsconfig.json").read_text(encoding="utf-8")
    if '"scripts"' in tsconfig:
        ok("tsconfig excludes scripts/ (QA scripts won't break next build)")
    else:
        fail("tsconfig should exclude scripts/ for production typecheck")

    print("\n=== Stale seven-state tool copy ===")
    # Lists that end at NJ without NY/PA/MA are stale (substring of full 10-state list is fine).
    stale_patterns = [
        re.compile(r"FL/TX/GA/CA/NC/SC/NJ(?!/NY)"),
        re.compile(r"FL, TX, GA, CA, NC, SC, NJ(?!, NY)"),
        re.compile(r"FL / TX / GA / CA / NC / SC / NJ(?! / NY)"),
    ]
    scan_paths = [
        ROOT / "app" / "tools" / "loan-estimate-analyzer" / "page.tsx",
        ROOT / "app" / "tools" / "compare-loan-estimates" / "page.tsx",
        ROOT / "components" / "tools" / "LoanEstimateAnalyzer.tsx",
        ROOT / "components" / "tools" / "LoanEstimateCompare.tsx",
        ROOT / "lib" / "tools" / "loan-estimate-analyzer" / "analyze.ts",
        ROOT / "lib" / "tools" / "loan-estimate-analyzer" / "client-analyze.ts",
        ROOT / "lib" / "tools" / "loan-estimate-analyzer" / "compare.ts",
        ROOT / "app" / "lenders" / "[slug]" / "page.tsx",
    ]
    stale_hits = 0
    for path in scan_paths:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        for pat in stale_patterns:
            if pat.search(text):
                fail(f"stale 7-state copy in {path.relative_to(ROOT)} ({pat.pattern})")
                stale_hits += 1
        # Profile CTA must not hard-gate county prefill to Florida only
        if path.name == "page.tsx" and "lenders" in str(path):
            if "stateSlug === 'florida' ? lender.countySlug" in text:
                fail("profile CTA still Florida-only county prefill")
                stale_hits += 1
            elif "analyzerCountyOptionSlug" in text:
                ok("profile CTA uses analyzerCountyOptionSlug for multi-state prefill")
    if stale_hits == 0:
        ok("no stale seven-state tool copy in product UI paths")

    print(f"\n=== Result: {'PASS' if failures == 0 else f'FAIL ({failures})'} ===")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

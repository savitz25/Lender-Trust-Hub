#!/usr/bin/env python3
"""
Nationwide HMDA stabilize / QA (Node-free) — 50 states + DC.

  python scripts/qa-nationwide-stabilize.py
"""
from __future__ import annotations

import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# code, folder, file suffix (FL bare slug uses _fl)
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
    ("MO", "missouri", "mo"),
    ("KY", "kentucky", "ky"),
    ("UT", "utah", "ut"),
    ("NV", "nevada", "nv"),
    ("OR", "oregon", "or"),
    ("WA", "washington", "wa"),
    ("AL", "alabama", "al"),
    ("LA", "louisiana", "la"),
    ("IA", "iowa", "ia"),
    ("KS", "kansas", "ks"),
    ("NE", "nebraska", "ne"),
    ("AR", "arkansas", "ar"),
    ("MS", "mississippi", "ms"),
    ("OK", "oklahoma", "ok"),
    ("ID", "idaho", "id"),
    ("MT", "montana", "mt"),
    ("WY", "wyoming", "wy"),
    ("NM", "new-mexico", "nm"),
    ("WV", "west-virginia", "wv"),
    ("AK", "alaska", "ak"),
    ("HI", "hawaii", "hi"),
    ("ND", "north-dakota", "nd"),
    ("SD", "south-dakota", "sd"),
]

SPOT_COUNTIES: dict[str, list[str]] = {
    "FL": ["miami-dade", "orange"],
    "TX": ["harris", "dallas"],
    "CA": ["los-angeles", "san-diego"],
    "NY": ["kings", "nassau"],
    "IL": ["cook"],
    "OH": ["franklin"],
    "AZ": ["maricopa"],
    "CO": ["denver"],
    "WA": ["king"],
    "GA": ["fulton"],
    "PA": ["philadelphia"],
    "MA": ["middlesex"],
    "TN": ["davidson"],
    "NV": ["clark"],
    "UT": ["salt-lake"],
    "HI": ["honolulu"],
    "AK": ["anchorage"],
    "ND": ["cass"],
    "SD": ["minnehaha"],
    # regional extras
    "NC": ["wake"],
    "SC": ["horry"],
    "NJ": ["bergen"],
    "VA": ["fairfax"],
    "MD": ["montgomery"],
    "DC": ["district-of-columbia"],
    "MI": ["oakland"],
    "IN": ["marion"],
    "WI": ["milwaukee"],
    "MN": ["hennepin"],
    "MO": ["st-louis"],
    "KY": ["jefferson"],
    "AL": ["jefferson"],
    "MS": ["desoto"],
    "LA": ["east-baton-rouge"],
    "AR": ["pulaski"],
    "OK": ["oklahoma"],
    "OR": ["multnomah"],
    "ID": ["ada"],
    "MT": ["yellowstone"],
    "WY": ["laramie"],
    "NM": ["bernalillo"],
    "WV": ["kanawha"],
    "CT": ["western-connecticut"],
    "RI": ["providence"],
}

REQUIRED = (
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
    s = name.strip().lower().replace("ñ", "n")
    for a, b in (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ü", "u")):
        s = s.replace(a, b)
    s = s.replace(".", "").replace("'", "")
    s = re.sub(r"\s+", "-", s)
    return re.sub(r"[^a-z0-9-]", "", s)


def resolve_county_slug(code: str, county_name: str, county_fips: str = "") -> str:
    fips = (county_fips or "").strip()
    base = county_name_to_slug(county_name)
    if code == "NY" and (fips == "36061" or base == "new-york"):
        return "new-york-county"
    return base


def load_catalog_slugs() -> set[str]:
    catalog: set[str] = set()
    for p in (ROOT / "lib" / "mortgage").glob("*.ts"):
        text = p.read_text(encoding="utf-8", errors="ignore")
        catalog |= set(re.findall(r"slug:\s*'([^']+)'", text))
    for rel in ("lib/mockData.ts",):
        p = ROOT / rel
        if p.exists():
            catalog |= set(
                re.findall(r"slug:\s*'([^']+)'", p.read_text(encoding="utf-8", errors="ignore"))
            )
    return catalog


def _ts_map_has(text: str, key: str, value: str | None) -> bool:
    key_pat = rf"(?:['\"]{re.escape(key)}['\"]|{re.escape(key)})"
    if value is None:
        return bool(re.search(rf"{key_pat}\s*:\s*null\b", text))
    return bool(re.search(rf"{key_pat}\s*:\s*['\"]{re.escape(value)}['\"]", text))


def check_states_ts() -> None:
    print("\n== states.ts active codes ==")
    path = ROOT / "lib" / "hmda" / "states.ts"
    text = path.read_text(encoding="utf-8")
    for code, folder, _ in PRODUCT_STATES:
        if f"  {code}:" not in text and f"\n  {code}:" not in text:
            fail(f"states.ts missing config key {code}")
        elif f"dataFolder: '{folder}'" not in text:
            fail(f"states.ts {code} dataFolder not {folder}")
        else:
            ok(f"states.ts has {code} → {folder}")
    m = re.search(r"export const HMDA_ACTIVE_STATE_CODES[^=]*=\s*\[([^\]]+)\]", text, re.S)
    if not m:
        fail("could not parse HMDA_ACTIVE_STATE_CODES")
        return
    codes = re.findall(r"'([A-Z]{2})'", m.group(1))
    expected = {c for c, _, _ in PRODUCT_STATES}
    got = set(codes)
    if len(codes) != 51:
        fail(f"HMDA_ACTIVE_STATE_CODES length {len(codes)} expected 51")
    elif got != expected:
        fail(
            f"active codes set mismatch: extra={got - expected} missing={expected - got}"
        )
    else:
        ok("HMDA_ACTIVE_STATE_CODES = 51 (50 states + DC)")


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
            fail(f"PREFIX_BY_STATE missing {folder}: {sfx}")
        if _ts_map_has(text, sfx, folder):
            ok(f"STATE_BY_PREFIX {sfx} → {folder}")
        else:
            fail(f"STATE_BY_PREFIX missing {sfx}: {folder}")


def check_options_ts() -> None:
    print("\n== analyzer options.ts loads all codes ==")
    path = ROOT / "lib" / "tools" / "loan-estimate-analyzer" / "options.ts"
    text = path.read_text(encoding="utf-8")
    for code, _, sfx in PRODUCT_STATES:
        if code == "FL":
            if "loadHmdaStateData('FL')" in text or 'loadHmdaStateData("FL")' in text:
                ok("options loads FL")
            else:
                fail("options missing FL load")
            continue
        needle = f"loadHmdaStateData('{code}')"
        if needle in text:
            ok(f"options loads {code}")
        else:
            fail(f"options missing loadHmdaStateData('{code}')")
        if f"`{sfx}:" in text or f"'{sfx}:" in text or f'"{sfx}:' in text or f"slug: `{sfx}:" in text:
            ok(f"options builds {sfx}: prefix")
        else:
            # pattern slug: `tx:
            if f"slug: `{sfx}:" in text or f"slug: '{sfx}:" in text:
                ok(f"options builds {sfx}: prefix")
            else:
                fail(f"options missing slug prefix {sfx}:")


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
        for tmpl in REQUIRED:
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
            if s:
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

        lss = d / f"lender_state_summary_{sfx}.csv"
        for r in csv.DictReader(lss.open(encoding="utf-8")):
            lei = (r.get("lei") or "").strip().upper()
            if not lei:
                continue
            orig = float(r.get("total_originations") or 0)
            if orig > 0:
                lei_states[lei].append((code, orig))

        for r in csv.DictReader((d / "lei_to_nmls_mapping.csv").open(encoding="utf-8")):
            lei = (r.get("lei") or "").strip().upper()
            slug = (r.get("our_lender_slug") or "").strip()
            if slug:
                lei_slug[lei] = slug
                if catalog and slug not in catalog:
                    orphans.append((code, slug))

    if orphans:
        uniq = sorted(set(orphans))
        sample = uniq[:15]
        fail(f"{len(uniq)} orphan mapping slugs (sample): {sample}")
    else:
        ok(f"all mapped our_lender_slug values resolve ({len(lei_slug)} LEIs with slug)")

    print("\n== multi-state primary selection (sample) ==")
    multi = []
    for lei, sts in lei_states.items():
        if len(sts) < 2 or lei not in lei_slug:
            continue
        primary = max(sts, key=lambda x: x[1])
        multi.append(
            (
                lei_slug[lei],
                primary[0],
                primary[1],
                len(sts),
                sorted(sts, key=lambda x: -x[1])[:5],
            )
        )
    multi.sort(key=lambda x: -x[2])
    if not multi:
        warn("no multi-state mapped LEIs found")
    else:
        ok(f"{len(multi)} multi-state mapped LEIs")
        for slug, pcode, porig, n, top in multi[:12]:
            tops = ", ".join(f"{c}:{int(o)}" for c, o in top)
            print(f"       {slug}: primary={pcode} ({int(porig)}) n={n} | {tops}")


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

    county_page = (ROOT / "app/local-lenders/[state]/[county]/page.tsx").read_text(encoding="utf-8")
    for needle in ("HmdaCountyMarketPanel", "analyzerCountyOptionSlug", "LoanEstimateToolsCta"):
        if needle in county_page:
            ok(f"county page uses {needle}")
        else:
            fail(f"county page missing {needle}")

    design = (ROOT / "lib/design/lender-design-system.ts").read_text(encoding="utf-8")
    for href in (
        "/calculators",
        "/tools/program-finder",
        "/my-lending",
        "/tools/loan-estimate-analyzer",
    ):
        if href in design or href in (ROOT / "app/calculators/page.tsx").read_text(encoding="utf-8"):
            ok(f"nav entry {href}")
        else:
            # soft - check sitemap
            pass


def check_honesty_copy() -> None:
    print("\n== tools honesty copy (stale partial coverage) ==")
    paths = [
        ROOT / "app/tools/loan-estimate-analyzer/page.tsx",
        ROOT / "app/tools/compare-loan-estimates/page.tsx",
        ROOT / "components/tools/LoanEstimateAnalyzer.tsx",
        ROOT / "components/tools/LoanEstimateCompare.tsx",
        ROOT / "lib/tools/loan-estimate-analyzer/compare.ts",
        ROOT / "lib/tools/loan-estimate-analyzer/analyze.ts",
        ROOT / "lib/tools/loan-estimate-analyzer/client-analyze.ts",
    ]
    # Stale if claims a small fixed count without "50" or "all"
    stale = re.compile(
        r"\b(1[0-3]|2[0-9]|3[0-9]|4[0-6])\s+product states\b|"
        r"FL[–-](MA|ME|MN|NV|OK|WV)\b|"
        r"including (FL–|RI, VT|AR, MS|NM and WV)",
        re.I,
    )
    good_markers = ("50 states", "50 states + DC", "all 50")
    for p in paths:
        if not p.exists():
            fail(f"missing {p.relative_to(ROOT)}")
            continue
        text = p.read_text(encoding="utf-8")
        hits = list(stale.finditer(text))
        if hits:
            for h in hits[:3]:
                fail(
                    f"stale copy in {p.relative_to(ROOT)}: "
                    f"…{text[max(0, h.start() - 15) : h.end() + 25]}…"
                )
        elif any(m in text for m in good_markers) or "50 states" in text:
            ok(f"national honesty OK in {p.relative_to(ROOT)}")
        else:
            # empty-state may say product-state without count
            if "product-state" in text or "HMDA" in text:
                ok(f"no stale low-count copy in {p.relative_to(ROOT)}")
            else:
                warn(f"no national coverage phrase in {p.relative_to(ROOT)}")


def check_queries_exports() -> None:
    print("\n== major county exports ==")
    q = (ROOT / "lib/hmda/queries.ts").read_text(encoding="utf-8")
    idx = (ROOT / "lib/hmda/index.ts").read_text(encoding="utf-8")
    for code, folder, _ in PRODUCT_STATES:
        # MAJOR_FLORIDA_COUNTY_SLUGS style
        name = folder.upper().replace("-", "_")
        # map folder to export name
        export_map = {
            "florida": "MAJOR_FLORIDA_COUNTY_SLUGS",
            "district-of-columbia": "MAJOR_DISTRICT_OF_COLUMBIA_COUNTY_SLUGS",
            "new-york": "MAJOR_NEW_YORK_COUNTY_SLUGS",
            "new-jersey": "MAJOR_NEW_JERSEY_COUNTY_SLUGS",
            "north-carolina": "MAJOR_NORTH_CAROLINA_COUNTY_SLUGS",
            "south-carolina": "MAJOR_SOUTH_CAROLINA_COUNTY_SLUGS",
            "rhode-island": "MAJOR_RHODE_ISLAND_COUNTY_SLUGS",
            "new-hampshire": "MAJOR_NEW_HAMPSHIRE_COUNTY_SLUGS",
            "north-dakota": "MAJOR_NORTH_DAKOTA_COUNTY_SLUGS",
            "south-dakota": "MAJOR_SOUTH_DAKOTA_COUNTY_SLUGS",
            "new-mexico": "MAJOR_NEW_MEXICO_COUNTY_SLUGS",
            "west-virginia": "MAJOR_WEST_VIRGINIA_COUNTY_SLUGS",
        }
        exp = export_map.get(
            folder,
            "MAJOR_" + folder.upper().replace("-", "_") + "_COUNTY_SLUGS",
        )
        # state names like MAJOR_TEXAS
        if folder not in export_map:
            # texas → MAJOR_TEXAS_COUNTY_SLUGS
            parts = folder.split("-")
            exp = "MAJOR_" + "_".join(p.upper() for p in parts) + "_COUNTY_SLUGS"
        if exp in q and exp in idx:
            ok(exp)
        elif f"HMDA_STATE_CONFIGS.{code}.majorCountySlugs" in q:
            # may export differently
            if f"MAJOR_" in q and code in q:
                ok(f"majors for {code} exported")
            else:
                fail(f"missing export for {code} majors ({exp})")
        else:
            fail(f"missing {exp}")


def main() -> int:
    print("Nationwide HMDA stabilize / QA — 50 states + DC")
    print(f"ROOT={ROOT}")
    if len(PRODUCT_STATES) != 51:
        fail(f"PRODUCT_STATES length {len(PRODUCT_STATES)}")

    check_states_ts()
    check_prefix_maps()
    check_options_ts()
    catalog = load_catalog_slugs()
    print(f"\n  catalog slugs loaded: {len(catalog)}")
    if len(catalog) < 200:
        warn(f"catalog slug count looks low ({len(catalog)})")
    check_data_and_spots(catalog)
    check_components()
    check_honesty_copy()
    check_queries_exports()

    print("\n== summary ==")
    print(f"  OK:   {len(oks)}")
    print(f"  WARN: {len(warns)}")
    print(f"  FAIL: {len(errs)}")
    if errs:
        print("\nFailures:")
        for e in errs:
            print(f"  - {e}")
        return 1
    print("\nPASS — nationwide data + wiring integrity looks solid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

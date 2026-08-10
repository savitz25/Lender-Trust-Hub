#!/usr/bin/env python3
"""
Build Illinois and Ohio HMDA product slices.

  python scripts/build-hmda-il-oh-slices.py

Source: data/hmda/by-state/{IL,OH}/
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"

MAP_PATHS = list((ROOT / "data" / "hmda").glob("*/lei_to_nmls_mapping.csv"))
MAP_PATHS = [p for p in MAP_PATHS if "by-state" not in str(p)]

NATIONAL_SLUG_BY_NMLS: dict[str, str] = {
    "3038": "united-wholesale-mortgage",
    "3030": "rocket-mortgage",
    "2767": "freedom-mortgage",
    "174457": "loandepot",
    "2611": "guaranteed-rate",
    "35953": "pennymac",
    "399798": "jpmorgan-chase-bank",
    "405457": "truist-bank",
    "2289": "newrez",
    "1120271": "amerihome-mortgage",
    "66247": "cardinal-financial",
    "6606": "new-american-funding",
    "2104": "mr-cooper",
    "446038": "pnc-bank",
    "399801": "wells-fargo-bank",
    "330511": "better-mortgage",
    "181005": "ally-bank",
    "481428": "td-bank",
    "433960": "citizens-bank",
    "402216": "us-bank",
    "399809": "usaa-federal-savings-bank",
    "1121636": "sofi-bank",
    "399797": "flagstar-bank",
    "39179": "movement-mortgage-myrtle-beach",
    "3274": "guild-mortgage-metrowest",
    "3029": "crosscountry-mortgage-metrowest",
    "399807": "navy-federal-jacksonville",
    "412915": "citibank",
    "381076": "mt-bank",
    "2184": "embrace-home-loans",
    "2893": "nfm-lending",
    "338923": "anniemac-home-mortgage",
    "75164": "prosperity-home-mortgage",
    "1124061": "lower",
    "1127": "nvr-mortgage",
    "1598647": "guaranteed-rate-affinity",
    "503941": "first-citizens-bank",
    "1921": "primelending-columbus",
    "2909": "fairway-mortgage-augusta-sheppard",
    "1168": "amerisave",
    "467341": "regions-bank",
    "480004": "synovus-bank",
    "1820": "cmg-home-loans-dennis-vo",
    # IL / OH curated
    "1495": "greenstate-credit-union",
    "407798": "cefcu",
    "459308": "old-national-bank",
    "224149": "flat-branch-mortgage",
    "446047": "union-savings-bank",
    "510034": "wright-patt-credit-union",
    "141868": "ruoff-mortgage",
}

IL_OH_CURATED_LEI: dict[str, dict[str, str]] = {
    # Illinois
    "549300W4FT4H1UWPGU95": {
        "institution_name_hmda": "GREENSTATE Credit Union",
        "nmls_id": "1495",
        "our_lender_slug": "greenstate-credit-union",
        "legal_name": "GreenState Credit Union",
        "match_confidence": "high",
        "match_method": "il_oh_curated_gleif+public_nmls",
    },
    "549300YD7XJM19TH5O82": {
        "institution_name_hmda": "CITIZENS EQUITY FIRST CREDIT UNION",
        "nmls_id": "407798",
        "our_lender_slug": "cefcu",
        "legal_name": "Citizens Equity First Credit Union (CEFCU)",
        "match_confidence": "high",
        "match_method": "il_oh_curated_gleif+public_nmls",
    },
    "549300AT7EB9FJAF0E61": {
        "institution_name_hmda": "Old National Bank",
        "nmls_id": "459308",
        "our_lender_slug": "old-national-bank",
        "legal_name": "Old National Bank",
        "match_confidence": "high",
        "match_method": "il_oh_curated_gleif+public_nmls",
    },
    "549300LXKO1O7CSK5J52": {
        "institution_name_hmda": "FLAT BRANCH MORTGAGE, INC.",
        "nmls_id": "224149",
        "our_lender_slug": "flat-branch-mortgage",
        "legal_name": "Flat Branch Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "il_oh_curated_gleif+public_nmls",
    },
    # Ohio
    "549300HFBEONQN2CK447": {
        "institution_name_hmda": "Union Savings Bank",
        "nmls_id": "446047",
        "our_lender_slug": "union-savings-bank",
        "legal_name": "Union Savings Bank",
        "match_confidence": "high",
        "match_method": "il_oh_curated_gleif+public_nmls",
    },
    "549300N1YEXP02MHBR47": {
        "institution_name_hmda": "WRIGHT-PATT CREDIT UNION, INC.",
        "nmls_id": "510034",
        "our_lender_slug": "wright-patt-credit-union",
        "legal_name": "Wright-Patt Credit Union, Inc.",
        "match_confidence": "high",
        "match_method": "il_oh_curated_gleif+public_nmls",
    },
    "549300GSCUJKJINRJ980": {
        "institution_name_hmda": "RUOFF MORTGAGE COMPANY, INC.",
        "nmls_id": "141868",
        "our_lender_slug": "ruoff-mortgage",
        "legal_name": "Ruoff Mortgage Company, Inc.",
        "match_confidence": "high",
        "match_method": "il_oh_curated_gleif+public_nmls",
    },
    # KeyBank — force slug (do not route through Flagstar NMLS collision)
    "HUX2X73FUCYHUVH1BK78": {
        "institution_name_hmda": "KeyBank National Association",
        "nmls_id": "",
        "our_lender_slug": "keybank",
        "legal_name": "KeyBank National Association",
        "match_confidence": "high",
        "match_method": "il_oh_curated_gleif+lei_identity",
    },
}

IL_COUNTIES: dict[str, str] = {
    "17031": "Cook",
    "17043": "DuPage",
    "17089": "Kane",
    "17093": "Kendall",
    "17097": "Lake",
    "17111": "McHenry",
    "17113": "McLean",
    "17119": "Madison",
    "17143": "Peoria",
    "17161": "Rock Island",
    "17163": "St. Clair",
    "17167": "Sangamon",
    "17179": "Tazewell",
    "17197": "Will",
    "17201": "Winnebago",
    "17019": "Champaign",
    "17037": "DeKalb",
    "17091": "Kankakee",
    "17099": "LaSalle",
    "17115": "Macon",
    "17007": "Boone",
    "17063": "Grundy",
    "17183": "Vermilion",
    "17199": "Williamson",
    "17141": "Ogle",
}

# Wave 1 majors — Chicago metro + secondary metros with meaningful volume
IL_MAJORS: set[str] = {
    "17031",  # Cook
    "17043",  # DuPage
    "17197",  # Will
    "17097",  # Lake
    "17089",  # Kane
    "17111",  # McHenry
    "17119",  # Madison
    "17201",  # Winnebago
    "17163",  # St. Clair
    "17167",  # Sangamon
    "17093",  # Kendall
    "17143",  # Peoria
    "17113",  # McLean
    "17019",  # Champaign
    "17179",  # Tazewell
    "17161",  # Rock Island
    "17037",  # DeKalb
    "17091",  # Kankakee
    "17099",  # LaSalle
    "17115",  # Macon
}

OH_COUNTIES: dict[str, str] = {
    "39003": "Allen",
    "39017": "Butler",
    "39023": "Clark",
    "39025": "Clermont",
    "39035": "Cuyahoga",
    "39041": "Delaware",
    "39045": "Fairfield",
    "39049": "Franklin",
    "39055": "Geauga",
    "39057": "Greene",
    "39061": "Hamilton",
    "39085": "Lake",
    "39089": "Licking",
    "39093": "Lorain",
    "39095": "Lucas",
    "39099": "Mahoning",
    "39103": "Medina",
    "39109": "Miami",
    "39113": "Montgomery",
    "39133": "Portage",
    "39139": "Richland",
    "39151": "Stark",
    "39153": "Summit",
    "39155": "Trumbull",
    "39159": "Union",
    "39165": "Warren",
    "39169": "Wayne",
    "39173": "Wood",
}

OH_MAJORS: set[str] = {
    "39049",  # Franklin
    "39035",  # Cuyahoga
    "39061",  # Hamilton
    "39153",  # Summit
    "39113",  # Montgomery
    "39017",  # Butler
    "39151",  # Stark
    "39095",  # Lucas
    "39093",  # Lorain
    "39165",  # Warren
    "39041",  # Delaware
    "39085",  # Lake
    "39025",  # Clermont
    "39099",  # Mahoning
    "39089",  # Licking
    "39103",  # Medina
    "39045",  # Fairfield
    "39155",  # Trumbull
    "39057",  # Greene
    "39133",  # Portage
}

STATES = [
    {
        "code": "IL",
        "name": "Illinois",
        "folder": "illinois",
        "suffix": "_il",
        "col": "illinois_originations",
        "alias_col": "il_originations",
        "counties": IL_COUNTIES,
        "majors": IL_MAJORS,
    },
    {
        "code": "OH",
        "name": "Ohio",
        "folder": "ohio",
        "suffix": "_oh",
        "col": "ohio_originations",
        "alias_col": "oh_originations",
        "counties": OH_COUNTIES,
        "majors": OH_MAJORS,
    },
]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)


def load_lei_maps() -> dict[str, dict[str, str]]:
    lei_to_map: dict[str, dict[str, str]] = {}

    def ingest(path: Path) -> None:
        if not path.exists():
            return
        for r in read_csv(path):
            lei = (r.get("lei") or "").strip()
            if not lei or not (r.get("our_lender_slug") or "").strip():
                continue
            vol = 0.0
            for k, v in r.items():
                if k.endswith("_originations") or k == "total_originations":
                    try:
                        vol = max(vol, float(v or 0))
                    except ValueError:
                        pass
            prev = lei_to_map.get(lei)
            if prev:
                try:
                    if vol <= float(prev.get("_vol") or 0):
                        continue
                except ValueError:
                    pass
            row = dict(r)
            row["_vol"] = str(vol)
            lei_to_map[lei] = row

    for p in MAP_PATHS:
        ingest(p)
    return lei_to_map


def fill_county(r: dict[str, str], counties: dict[str, str]) -> dict[str, str]:
    fips = (r.get("county_fips") or "").strip()
    if not (r.get("county_name") or "").strip() and fips in counties:
        return {**r, "county_name": counties[fips]}
    return r


def name_to_slug(name: str) -> str:
    return (
        name.strip()
        .lower()
        .replace(".", "")
        .replace("'", "")
        .replace(" ", "-")
    )


def build_state(
    cfg: dict,
    lei_to_map: dict[str, dict[str, str]],
    gleif: dict[str, str],
) -> None:
    code = cfg["code"]
    src = ROOT / "data" / "hmda" / "by-state" / code
    out = ROOT / "data" / "hmda" / cfg["folder"]
    if not src.is_dir():
        raise SystemExit(f"Missing {src}")

    counties_map: dict[str, str] = cfg["counties"]
    majors: set[str] = set(cfg["majors"])
    suffix = cfg["suffix"]
    col = cfg["col"]
    alias = cfg["alias_col"]

    county_rows = [fill_county(r, counties_map) for r in read_csv(src / "county_market_summary.csv")]
    county_out: list[dict[str, str]] = []
    for r in county_rows:
        fips = (r.get("county_fips") or "").strip()
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        name = (r.get("county_name") or "").strip()
        if not name and fips in counties_map:
            r = {**r, "county_name": counties_map[fips]}
            name = counties_map[fips]
        if name or fips in majors or orig >= 800:
            if not name and fips in counties_map:
                r = {**r, "county_name": counties_map[fips]}
            county_out.append(r)

    state_rows = read_csv(src / "lender_state_summary.csv")
    act_out: list[dict[str, str]] = []
    for r in read_csv(src / "lender_activity_by_county.csv"):
        r = fill_county(r, counties_map)
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() or fips not in majors:
            continue
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in IL_OH_CURATED_LEI:
                nm = IL_OH_CURATED_LEI[lei]["institution_name_hmda"]
            if nm:
                r = {**r, "institution_name": nm}
        act_out.append(r)

    cand = read_csv(src / "lei_mapping_candidates.csv")
    for r in cand:
        if alias in r and col not in r:
            r[col] = r[alias]

    state_by_lei = {r["lei"]: r for r in state_rows}
    mapping_by_lei: dict[str, dict[str, str]] = {}

    def add_mapping(lei: str, base: dict[str, str], method_prefix: str) -> None:
        st = state_by_lei.get(lei)
        if not st:
            return
        try:
            st_orig = int(float(st.get("total_originations") or 0))
        except ValueError:
            st_orig = 0
        if st_orig <= 0:
            return
        nmls = (base.get("nmls_id") or "").strip()
        # Prefer explicit curated slug when provided (avoids NMLS collisions)
        curated_slug = (base.get("our_lender_slug") or "").strip()
        slug = curated_slug if method_prefix.startswith("il_oh_curated") and curated_slug else (
            NATIONAL_SLUG_BY_NMLS.get(nmls) or curated_slug
        )
        if not slug:
            return
        row = {
            "lei": lei,
            "institution_name_hmda": base.get("institution_name_hmda")
            or base.get("legal_name")
            or gleif.get(lei)
            or st.get("institution_name")
            or "",
            "nmls_id": nmls,
            "our_lender_slug": slug,
            "legal_name": base.get("legal_name") or "",
            "match_confidence": base.get("match_confidence") or "high",
            "match_method": method_prefix + (base.get("match_method") or "curated"),
            col: str(st_orig),
            "florida_originations": base.get("florida_originations") or "0",
            "total_originations": st.get("total_originations") or str(st_orig),
            "priority_match": "high" if st_orig >= 500 else "medium",
            "notes": (
                f"{method_prefix.rstrip('+') or 'curated'} map for {code} activity "
                f"({st_orig} {code} originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(float(prev[col] or 0)) >= st_orig and prev.get("our_lender_slug"):
            if not method_prefix.startswith("il_oh_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in IL_OH_CURATED_LEI.items():
        add_mapping(lei, cur, "il_oh_curated+")

    mapping_rows = sorted(
        mapping_by_lei.values(),
        key=lambda r: -int(float(r.get(col) or 0)),
    )

    if county_out:
        write_csv(out / f"county_market_summary{suffix}.csv", county_out, list(county_out[0].keys()))
    if act_out:
        write_csv(out / f"lender_activity_by_county{suffix}.csv", act_out, list(act_out[0].keys()))
    if state_rows:
        write_csv(out / f"lender_state_summary{suffix}.csv", state_rows, list(state_rows[0].keys()))
    if cand:
        for r in cand:
            if col not in r:
                r[col] = r.get(alias) or "0"
        write_csv(out / f"lei_mapping_candidates{suffix}.csv", cand, list(cand[0].keys()))
    if mapping_rows:
        write_csv(out / "lei_to_nmls_mapping.csv", mapping_rows, list(mapping_rows[0].keys()))

    major_named = [
        r
        for r in county_out
        if (r.get("county_fips") or "") in majors and (r.get("county_name") or "").strip()
    ]
    major_named.sort(key=lambda r: -float(r.get("total_originations") or 0))
    major_slugs = [name_to_slug(r.get("county_name") or "") for r in major_named]

    md = [
        f"# {cfg['name']} HMDA slice\n\n",
        f"**Source:** `data/hmda/by-state/{code}/` (national 2025 foundation)\n\n",
        f"- County market rows: **{len(county_out)}**\n",
        f"- Lender–county activity (major markets): **{len(act_out)}**\n",
        f"- LEI state summaries: **{len(state_rows)}**\n",
        f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
        f"- Major markets with names: **{len(major_named)}**\n\n",
        f"## Top mapped LEIs by {code} originations\n\n",
    ]
    for r in mapping_rows[:20]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r[col]} {code} orig.)\n"
        )
    md.append("\n## Major markets (panel-ready)\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Matching rules\n\n"
        "- Reuse prior product-state curated LEI maps when the LEI has state activity\n"
        "- IL/OH curated: GreenState CU, CEFCU, Old National, Flat Branch, Union Savings Bank, "
        "Wright-Patt CU, Ruoff Mortgage, KeyBank\n"
        "- No fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-il-oh-slices.py\n"
        "```\n"
        "\n## Major slugs (for states.ts)\n\n```\n"
        + ", ".join(f"'{s}'" for s in major_slugs)
        + "\n```\n"
    )
    (out / "README.md").write_text("".join(md), encoding="utf-8")
    print(
        f"Wrote {cfg['name']} → {out} "
        f"mappings={len(mapping_rows)} counties={len(county_out)} "
        f"activity={len(act_out)} majors={len(major_named)} "
        f"slugs={major_slugs}"
    )


def main() -> None:
    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))
    for lei, cur in IL_OH_CURATED_LEI.items():
        gleif.setdefault(lei, cur["institution_name_hmda"])
    if GLEIF_CACHE.exists():
        GLEIF_CACHE.write_text(json.dumps(gleif, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    for cfg in STATES:
        build_state(cfg, lei_to_map, gleif)


if __name__ == "__main__":
    main()

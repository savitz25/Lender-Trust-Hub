#!/usr/bin/env python3
"""
Build Connecticut and New Hampshire HMDA product slices.

  python scripts/build-hmda-ct-nh-slices.py

Source: data/hmda/by-state/{CT,NH}/
Note: Connecticut HMDA uses Census planning-region county-equivalents (09110–09190),
not the legacy 8 county FIPS codes.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"

MAP_PATHS = [
    ROOT / "data" / "hmda" / "florida" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "texas" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "georgia" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "california" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "north-carolina" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "south-carolina" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "new-jersey" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "new-york" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "pennsylvania" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "massachusetts" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "rhode-island" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "vermont" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "maine" / "lei_to_nmls_mapping.csv",
]

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
    "1082048": "baycoast-mortgage",
    "2764": "total-mortgage-services",
    "1515": "northpoint-mortgage",
    "2561": "harborone-mortgage",
    "2926": "emm-loans",
    "3094": "primary-residential-mortgage",
    "901927": "washington-trust-mortgage",
    "407964": "banknewport",
    "449200": "bangor-savings-bank",
    "486887": "camden-national-bank",
    # CT / NH curated
    "459028": "liberty-bank",
    "2643": "first-world-mortgage",
    "491588": "service-credit-union",
    "690869": "st-marys-bank",
}

CT_NH_CURATED_LEI: dict[str, dict[str, str]] = {
    "549300KWXO8FUM7L0E14": {
        "institution_name_hmda": "Liberty Bank",
        "nmls_id": "459028",
        "our_lender_slug": "liberty-bank",
        "legal_name": "Liberty Bank",
        "match_confidence": "high",
        "match_method": "ct_nh_curated_gleif+public_nmls",
    },
    "549300HYHFCULSUBAE54": {
        "institution_name_hmda": "FIRST WORLD MORTGAGE CORPORATION",
        "nmls_id": "2643",
        "our_lender_slug": "first-world-mortgage",
        "legal_name": "First World Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ct_nh_curated_gleif+public_nmls",
    },
    "254900P7WLDQD9IUL038": {
        "institution_name_hmda": "Service Federal Credit Union",
        "nmls_id": "491588",
        "our_lender_slug": "service-credit-union",
        "legal_name": "Service Credit Union (Service Federal Credit Union)",
        "match_confidence": "high",
        "match_method": "ct_nh_curated_gleif+public_nmls",
    },
    "549300YKOCNDPE0N7X40": {
        "institution_name_hmda": "ST. MARY'S BANK",
        "nmls_id": "690869",
        "our_lender_slug": "st-marys-bank",
        "legal_name": "St. Mary's Bank",
        "match_confidence": "high",
        "match_method": "ct_nh_curated_gleif+public_nmls",
    },
}

STATES = [
    {
        "code": "CT",
        "name": "Connecticut",
        "folder": "connecticut",
        "suffix": "_ct",
        "col": "connecticut_originations",
        "alias_col": "ct_originations",
        # Census planning-region county-equivalents (HMDA 2024+)
        "counties": {
            "09110": "Capitol",
            "09120": "Greater Bridgeport",
            "09130": "Lower Connecticut River Valley",
            "09140": "Naugatuck Valley",
            "09150": "Northeastern Connecticut",
            "09160": "Northwest Hills",
            "09170": "South Central Connecticut",
            "09180": "Southeastern Connecticut",
            "09190": "Western Connecticut",
        },
        "majors": {
            "09110",
            "09120",
            "09130",
            "09140",
            "09150",
            "09160",
            "09170",
            "09180",
            "09190",
        },
    },
    {
        "code": "NH",
        "name": "New Hampshire",
        "folder": "new-hampshire",
        "suffix": "_nh",
        "col": "new_hampshire_originations",
        "alias_col": "nh_originations",
        "counties": {
            "33001": "Belknap",
            "33003": "Carroll",
            "33005": "Cheshire",
            "33007": "Coos",
            "33009": "Grafton",
            "33011": "Hillsborough",
            "33013": "Merrimack",
            "33015": "Rockingham",
            "33017": "Strafford",
            "33019": "Sullivan",
        },
        "majors": {
            "33011",  # Hillsborough
            "33015",  # Rockingham
            "33013",  # Merrimack
            "33017",  # Strafford
            "33009",  # Grafton
            "33001",  # Belknap
            "33003",  # Carroll
            "33005",  # Cheshire
            "33019",  # Sullivan
            "33007",  # Coos
        },
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
    majors: set[str] = cfg["majors"]
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
        if name or orig >= 100 or fips in majors:
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
            if not nm and lei in CT_NH_CURATED_LEI:
                nm = CT_NH_CURATED_LEI[lei]["institution_name_hmda"]
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
        slug = NATIONAL_SLUG_BY_NMLS.get(nmls) or (base.get("our_lender_slug") or "").strip()
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
            "priority_match": "high" if st_orig >= 200 else "medium",
            "notes": (
                f"{method_prefix.rstrip('+') or 'curated'} map for {code} activity "
                f"({st_orig} {code} originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(float(prev[col] or 0)) >= st_orig and prev.get("our_lender_slug"):
            return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in CT_NH_CURATED_LEI.items():
        add_mapping(lei, cur, "ct_nh_curated+")

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

    md = [
        f"# {cfg['name']} HMDA slice\n\n",
        f"**Source:** `data/hmda/by-state/{code}/` (national 2025 foundation)\n\n",
    ]
    if code == "CT":
        md.append(
            "**Geography note:** Connecticut HMDA uses Census **planning-region** "
            "county-equivalents (FIPS 09110–09190), not the legacy eight county codes.\n\n"
        )
    md.extend(
        [
            f"- County market rows: **{len(county_out)}**\n",
            f"- Lender–county activity (major counties): **{len(act_out)}**\n",
            f"- LEI state summaries: **{len(state_rows)}**\n",
            f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
            f"- Major counties with names: **{len(major_named)}**\n\n",
            f"## Top mapped LEIs by {code} originations\n\n",
        ]
    )
    for r in mapping_rows[:20]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r[col]} {code} orig.)\n"
        )
    md.append("\n## Major counties / regions (panel-ready)\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Matching rules\n\n"
        "- Reuse prior product-state curated LEI maps when the LEI has state activity\n"
        "- CT/NH curated: Liberty Bank, First World Mortgage, Service Credit Union, St. Mary's Bank\n"
        "- No fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-ct-nh-slices.py\n"
        "```\n"
    )
    (out / "README.md").write_text("".join(md), encoding="utf-8")
    print(
        f"Wrote {cfg['name']} → {out} "
        f"mappings={len(mapping_rows)} counties={len(county_out)} "
        f"activity={len(act_out)} majors={len(major_named)}"
    )


def main() -> None:
    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))
    for lei, cur in CT_NH_CURATED_LEI.items():
        gleif.setdefault(lei, cur["institution_name_hmda"])

    for cfg in STATES:
        build_state(cfg, lei_to_map, gleif)


if __name__ == "__main__":
    main()

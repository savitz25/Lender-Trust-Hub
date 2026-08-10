#!/usr/bin/env python3
"""
Build Colorado HMDA product slice.

  python scripts/build-hmda-co-slices.py

Source: data/hmda/by-state/CO/
Does not modify Arizona or other product-state slices.
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
    "1820": "cmg-home-loans-dennis-vo",
    "1124061": "lower",
    "1921": "primelending-columbus",
    "2909": "fairway-mortgage-augusta-sheppard",
    # CO curated
    "405466": "wings-credit-union",
    "717246": "elevations-credit-union",
    "410592": "canvas-credit-union",
    "145502": "vip-mortgage",
    "130676": "homeamerican-mortgage",
    "182334": "american-financing",
    "414674": "alpine-bank",
}

CO_CURATED_LEI: dict[str, dict[str, str]] = {
    "6GK3WNTSHBNJOVP1LV97": {
        "institution_name_hmda": "WINGS CREDIT UNION",
        "nmls_id": "405466",
        "our_lender_slug": "wings-credit-union",
        "legal_name": "Wings Credit Union (merged with Ent Credit Union brand footprint)",
        "match_confidence": "high",
        "match_method": "co_curated_gleif+public_nmls",
    },
    # Colorado FirstBank (Lakewood) — distinct from Tennessee FirstBank
    "5493009V3WNJX9V2GZ85": {
        "institution_name_hmda": "FirstBank",
        "nmls_id": "",
        "our_lender_slug": "firstbank-colorado",
        "legal_name": "FirstBank (Colorado / efirstbank)",
        "match_confidence": "high",
        "match_method": "co_curated_gleif+lei_identity",
    },
    "54930067MGJBFNEN1P47": {
        "institution_name_hmda": "ELEVATIONS",
        "nmls_id": "717246",
        "our_lender_slug": "elevations-credit-union",
        "legal_name": "Elevations Credit Union",
        "match_confidence": "high",
        "match_method": "co_curated_gleif+public_nmls",
    },
    "549300E3QJQLKVB40W93": {
        "institution_name_hmda": "CANVAS CREDIT UNION",
        "nmls_id": "410592",
        "our_lender_slug": "canvas-credit-union",
        "legal_name": "Canvas Credit Union",
        "match_confidence": "high",
        "match_method": "co_curated_gleif+public_nmls",
    },
    "5493008L9O5NV7EAK360": {
        "institution_name_hmda": "BELLCO",
        "nmls_id": "",
        "our_lender_slug": "bellco-credit-union",
        "legal_name": "Bellco Credit Union",
        "match_confidence": "high",
        "match_method": "co_curated_gleif+lei_identity",
    },
    "549300PC4MFWQBNVKG88": {
        "institution_name_hmda": "V.I.P. MORTGAGE, INC.",
        "nmls_id": "145502",
        "our_lender_slug": "vip-mortgage",
        "legal_name": "V.I.P. Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "co_curated_gleif+public_nmls",
    },
    "5493001HHBUTXHS7TZ96": {
        "institution_name_hmda": "HOMEAMERICAN MORTGAGE CORPORATION",
        "nmls_id": "130676",
        "our_lender_slug": "homeamerican-mortgage",
        "legal_name": "HomeAmerican Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "co_curated_gleif+public_nmls",
    },
    "549300ALNLUNS3Y53T24": {
        "institution_name_hmda": "AMERICAN FINANCING CORPORATION",
        "nmls_id": "182334",
        "our_lender_slug": "american-financing",
        "legal_name": "American Financing Corporation",
        "match_confidence": "high",
        "match_method": "co_curated_gleif+public_nmls",
    },
    "OYWNLMHNBQQ7BAH3EE86": {
        "institution_name_hmda": "Alpine Bank",
        "nmls_id": "414674",
        "our_lender_slug": "alpine-bank",
        "legal_name": "Alpine Bank",
        "match_confidence": "high",
        "match_method": "co_curated_gleif+public_nmls",
    },
}

CO_COUNTIES: dict[str, str] = {
    "08001": "Adams",
    "08005": "Arapahoe",
    "08013": "Boulder",
    "08014": "Broomfield",
    "08029": "Delta",
    "08031": "Denver",
    "08035": "Douglas",
    "08037": "Eagle",
    "08039": "Elbert",
    "08041": "El Paso",
    "08043": "Fremont",
    "08045": "Garfield",
    "08059": "Jefferson",
    "08067": "La Plata",
    "08069": "Larimer",
    "08077": "Mesa",
    "08085": "Montrose",
    "08093": "Park",
    "08101": "Pueblo",
    "08107": "Routt",
    "08117": "Summit",
    "08119": "Teller",
    "08123": "Weld",
}

# Wave 1 majors — Front Range metros + secondary volume
CO_MAJORS: set[str] = {
    "08041",  # El Paso
    "08059",  # Jefferson
    "08005",  # Arapahoe
    "08031",  # Denver
    "08001",  # Adams
    "08035",  # Douglas
    "08123",  # Weld
    "08069",  # Larimer
    "08013",  # Boulder
    "08077",  # Mesa
    "08101",  # Pueblo
    "08014",  # Broomfield
    "08045",  # Garfield
    "08037",  # Eagle
    "08117",  # Summit
    "08067",  # La Plata
    "08039",  # Elbert
    "08043",  # Fremont
    "08119",  # Teller
    "08085",  # Montrose
}


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
    return name.strip().lower().replace(".", "").replace("'", "").replace(" ", "-")


def build_state(
    lei_to_map: dict[str, dict[str, str]],
    gleif: dict[str, str],
) -> None:
    code = "CO"
    src = ROOT / "data" / "hmda" / "by-state" / code
    out = ROOT / "data" / "hmda" / "colorado"
    if not src.is_dir():
        raise SystemExit(f"Missing {src}")

    counties_map = CO_COUNTIES
    majors = set(CO_MAJORS)
    suffix = "_co"
    col = "colorado_originations"
    alias = "co_originations"

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
            if not nm and lei in CO_CURATED_LEI:
                nm = CO_CURATED_LEI[lei]["institution_name_hmda"]
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
        curated_slug = (base.get("our_lender_slug") or "").strip()
        slug = (
            curated_slug
            if method_prefix.startswith("co_curated") and curated_slug
            else (NATIONAL_SLUG_BY_NMLS.get(nmls) or curated_slug)
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
            if not method_prefix.startswith("co_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in CO_CURATED_LEI.items():
        add_mapping(lei, cur, "co_curated+")

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
        "# Colorado HMDA slice\n\n",
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
        "- Reuse prior product-state curated LEI maps when the LEI has CO activity\n"
        "- CO curated: Wings CU, FirstBank (CO), Elevations CU, Canvas CU, Bellco CU, "
        "V.I.P. Mortgage, HomeAmerican Mortgage, American Financing, Alpine Bank\n"
        "- FirstBank (CO) and Bellco use LEI identity to avoid cross-state NMLS collisions\n"
        "- No fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-co-slices.py\n"
        "```\n"
        "\n## Major slugs (for states.ts)\n\n```\n"
        + ", ".join(f"'{s}'" for s in major_slugs)
        + "\n```\n"
    )
    (out / "README.md").write_text("".join(md), encoding="utf-8")
    print(
        f"Wrote Colorado → {out} "
        f"mappings={len(mapping_rows)} counties={len(county_out)} "
        f"activity={len(act_out)} majors={len(major_named)} "
        f"slugs={major_slugs}"
    )


def main() -> None:
    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))
    for lei, cur in CO_CURATED_LEI.items():
        gleif.setdefault(lei, cur["institution_name_hmda"])
    if GLEIF_CACHE.exists():
        GLEIF_CACHE.write_text(json.dumps(gleif, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    build_state(lei_to_map, gleif)


if __name__ == "__main__":
    main()

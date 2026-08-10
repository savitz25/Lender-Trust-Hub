#!/usr/bin/env python3
"""
Build Tennessee HMDA product slice.

  python scripts/build-hmda-tn-slices.py

Source: data/hmda/by-state/TN/
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
    "1082048": "baycoast-mortgage",
    "2764": "total-mortgage-services",
    "1515": "northpoint-mortgage",
    "2561": "harborone-mortgage",
    "2926": "emm-loans",
    "3094": "primary-residential-mortgage",
    "86548": "first-heritage-mortgage",
    "1904": "atlantic-bay-mortgage-charleston",
    "405461": "southstate-bank",
    "405455": "ameris-bank",
    "467341": "regions-bank",
    "766529": "first-national-bank-of-pennsylvania",
    "485401": "fulton-bank",
    "417673": "wsfs-bank",
    "1921": "primelending-columbus",
    "2909": "fairway-mortgage-augusta-sheppard",
    "1168": "amerisave",
    "480004": "synovus-bank",
    # TN curated
    "472433": "firstbank-tennessee",
    "34391": "mortgage-investors-group-knoxville",
    "418535": "pinnacle-bank",
    "629700": "first-community-mortgage",
    "167911": "knoxville-tva-employees-credit-union",
    "451452": "ascend-federal-credit-union",
    "402436": "cadence-bank",
    "767482": "wilson-bank-and-trust",
    "460298": "tennessee-valley-federal-credit-union",
}

TN_CURATED_LEI: dict[str, dict[str, str]] = {
    "549300OBO7DOF2KOP535": {
        "institution_name_hmda": "FirstBank",
        "nmls_id": "472433",
        "our_lender_slug": "firstbank-tennessee",
        "legal_name": "FirstBank",
        "match_confidence": "high",
        "match_method": "tn_curated_gleif+public_nmls",
    },
    "549300VNBQD8FDHF7563": {
        "institution_name_hmda": "MORTGAGE INVESTORS GROUP, INC.",
        "nmls_id": "34391",
        "our_lender_slug": "mortgage-investors-group-knoxville",
        "legal_name": "Mortgage Investors Group, Inc.",
        "match_confidence": "high",
        "match_method": "tn_curated_gleif+public_nmls",
    },
    "549300CDOC4F7XSRG390": {
        "institution_name_hmda": "Pinnacle Bank",
        "nmls_id": "418535",
        "our_lender_slug": "pinnacle-bank",
        "legal_name": "Pinnacle Bank",
        "match_confidence": "high",
        "match_method": "tn_curated_gleif+public_nmls",
    },
    "549300R0SXC1JU7ZU290": {
        "institution_name_hmda": "FIRST COMMUNITY MORTGAGE, INC.",
        "nmls_id": "629700",
        "our_lender_slug": "first-community-mortgage",
        "legal_name": "First Community Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "tn_curated_gleif+public_nmls",
    },
    "54930074H8866HTIWU69": {
        "institution_name_hmda": "KNOXVILLE TVA EMPLOYEES CREDIT UNION",
        "nmls_id": "167911",
        "our_lender_slug": "knoxville-tva-employees-credit-union",
        "legal_name": "Knoxville TVA Employees Credit Union",
        "match_confidence": "high",
        "match_method": "tn_curated_gleif+public_nmls",
    },
    "549300E1PJPTI4YS7H26": {
        "institution_name_hmda": "ASCEND FEDERAL CREDIT UNION",
        "nmls_id": "451452",
        "our_lender_slug": "ascend-federal-credit-union",
        "legal_name": "Ascend Federal Credit Union",
        "match_confidence": "high",
        "match_method": "tn_curated_gleif+public_nmls",
    },
    "Q7C315HKI8VX0SSKBS64": {
        "institution_name_hmda": "Cadence Bank",
        "nmls_id": "402436",
        "our_lender_slug": "cadence-bank",
        "legal_name": "Cadence Bank",
        "match_confidence": "high",
        "match_method": "tn_curated_gleif+public_nmls",
    },
    "254900PVWALA7JTBXA31": {
        "institution_name_hmda": "WILSON BANK AND TRUST",
        "nmls_id": "767482",
        "our_lender_slug": "wilson-bank-and-trust",
        "legal_name": "Wilson Bank and Trust",
        "match_confidence": "high",
        "match_method": "tn_curated_gleif+public_nmls",
    },
    "5493007669OVCSCATP45": {
        "institution_name_hmda": "TENNESSEE VALLEY FCU",
        "nmls_id": "460298",
        "our_lender_slug": "tennessee-valley-federal-credit-union",
        "legal_name": "Tennessee Valley Federal Credit Union",
        "match_confidence": "high",
        "match_method": "tn_curated_gleif+public_nmls",
    },
}

# Names for panel majors + fill-in when county_name is empty in partition
TN_COUNTIES: dict[str, str] = {
    "47001": "Anderson",
    "47009": "Blount",
    "47011": "Bradley",
    "47037": "Davidson",
    "47065": "Hamilton",
    "47093": "Knox",
    "47105": "Loudon",
    "47113": "Madison",
    "47119": "Maury",
    "47125": "Montgomery",
    "47141": "Putnam",
    "47147": "Robertson",
    "47149": "Rutherford",
    "47155": "Sevier",
    "47157": "Shelby",
    "47163": "Sullivan",
    "47165": "Sumner",
    "47179": "Washington",
    "47187": "Williamson",
    "47189": "Wilson",
    # Secondary volume band (often ≥ ~1.5k orig)
    "47031": "Coffee",
    "47035": "Cumberland",
    "47043": "Dickson",
    "47059": "Greene",
    "47063": "Hamblen",
    "47089": "Jefferson",
    "47145": "Roane",
    "47167": "Tipton",
}

# Wave-1 majors: high-volume metros + next band with meaningful panels
TN_MAJORS: set[str] = {
    "47037",  # Davidson
    "47157",  # Shelby
    "47093",  # Knox
    "47065",  # Hamilton
    "47149",  # Rutherford
    "47125",  # Montgomery
    "47187",  # Williamson
    "47165",  # Sumner
    "47189",  # Wilson
    "47163",  # Sullivan
    "47009",  # Blount
    "47119",  # Maury
    "47179",  # Washington
    "47155",  # Sevier
    "47011",  # Bradley
    "47147",  # Robertson
    "47113",  # Madison
    "47001",  # Anderson
    "47105",  # Loudon
    "47141",  # Putnam
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
    code = "TN"
    src = ROOT / "data" / "hmda" / "by-state" / code
    out = ROOT / "data" / "hmda" / "tennessee"
    if not src.is_dir():
        raise SystemExit(f"Missing {src}")

    counties_map = TN_COUNTIES
    majors = set(TN_MAJORS)
    suffix = "_tn"
    col = "tennessee_originations"
    alias = "tn_originations"

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
        # Keep all named rows we can label, plus any major FIPS
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
            if not nm and lei in TN_CURATED_LEI:
                nm = TN_CURATED_LEI[lei]["institution_name_hmda"]
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
            "priority_match": "high" if st_orig >= 400 else "medium",
            "notes": (
                f"{method_prefix.rstrip('+') or 'curated'} map for {code} activity "
                f"({st_orig} {code} originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(float(prev[col] or 0)) >= st_orig and prev.get("our_lender_slug"):
            # Prefer curated TN map over prior when both present
            if not method_prefix.startswith("tn_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in TN_CURATED_LEI.items():
        add_mapping(lei, cur, "tn_curated+")

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
        f"# Tennessee HMDA slice\n\n",
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
        "- Reuse prior product-state curated LEI maps when the LEI has TN activity\n"
        "- TN curated: FirstBank, Mortgage Investors Group, Pinnacle Bank, First Community Mortgage, "
        "Knoxville TVA Employees CU, Ascend FCU, Cadence Bank, Wilson Bank & Trust, Tennessee Valley FCU\n"
        "- No fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-tn-slices.py\n"
        "```\n"
        "\n## Major slugs (for states.ts)\n\n```\n"
        + ", ".join(f"'{s}'" for s in major_slugs)
        + "\n```\n"
    )
    (out / "README.md").write_text("".join(md), encoding="utf-8")
    print(
        f"Wrote Tennessee → {out} "
        f"mappings={len(mapping_rows)} counties={len(county_out)} "
        f"activity={len(act_out)} majors={len(major_named)} "
        f"slugs={major_slugs}"
    )


def main() -> None:
    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))
    for lei, cur in TN_CURATED_LEI.items():
        gleif.setdefault(lei, cur["institution_name_hmda"])
    if GLEIF_CACHE.exists():
        GLEIF_CACHE.write_text(json.dumps(gleif, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    build_state(lei_to_map, gleif)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Build Arizona HMDA product slice.

  python scripts/build-hmda-arizona-slice.py

Source: data/hmda/by-state/AZ/
Output: data/hmda/arizona/
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"

MAP_PATHS = list((ROOT / "data" / "hmda").glob("*/lei_to_nmls_mapping.csv"))
MAP_PATHS = [p for p in MAP_PATHS if "by-state" not in str(p)]

# Prefer Arizona directory listings when NMLS collides with other state branches
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
    "3274": "guild-mortgage-west-valley",  # AZ directory listing
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
    "1921": "primelending-columbus",
    "2909": "fairway-mortgage-augusta-sheppard",
    "1168": "amerisave",
    "467341": "regions-bank",
    "480004": "synovus-bank",
    "1820": "cmg-home-loans-dennis-vo",
    "1850": "american-pacific-mortgage-inland-empire",
    "75243": "prmg",
    "401052": "bmo-bank",
    "1025894": "mutual-of-omaha-mortgage",
    "237341": "american-financial-network",
    "2458338": "cmg-home-loans-dennis-vo",
    # AZ curated
    "430888": "desert-financial-credit-union",
    "3089": "nova-home-loans-west-valley",
    "439822": "oneaz-credit-union-east-valley",
}

AZ_CURATED_LEI: dict[str, dict[str, str]] = {
    "549300HFXTV55C2HHM89": {
        "institution_name_hmda": "DESERT FINANCIAL CREDIT UNION",
        "nmls_id": "430888",
        "our_lender_slug": "desert-financial-credit-union",
        "legal_name": "Desert Financial Credit Union",
        "match_confidence": "high",
        "match_method": "az_curated_gleif+public_nmls",
    },
    "549300HIVO8XPBPNVG69": {
        "institution_name_hmda": "NOVA FINANCIAL & INVESTMENT CORPORATION",
        "nmls_id": "3089",
        "our_lender_slug": "nova-home-loans-west-valley",
        "legal_name": "Nova Home Loans (Nova Financial & Investment Corporation)",
        "match_confidence": "high",
        "match_method": "az_curated_gleif+public_nmls",
    },
    "549300EWL25M8JXH2R78": {
        "institution_name_hmda": "OneAZ Credit Union",
        "nmls_id": "439822",
        "our_lender_slug": "oneaz-credit-union-east-valley",
        "legal_name": "OneAZ Credit Union",
        "match_confidence": "high",
        "match_method": "az_curated_gleif+public_nmls",
    },
    # Guild: force AZ directory slug even if prior states used other branch slugs
    "549300LYRWPSYPK6S325": {
        "institution_name_hmda": "Guild Mortgage Company LLC",
        "nmls_id": "3274",
        "our_lender_slug": "guild-mortgage-west-valley",
        "legal_name": "Guild Mortgage Company LLC",
        "match_confidence": "high",
        "match_method": "az_curated_directory_slug",
    },
}

# Full AZ county FIPS → name (for blank county_name fill)
AZ_COUNTIES: dict[str, str] = {
    "04001": "Apache",
    "04003": "Cochise",
    "04005": "Coconino",
    "04007": "Gila",
    "04009": "Graham",
    "04011": "Greenlee",
    "04012": "La Paz",
    "04013": "Maricopa",
    "04015": "Mohave",
    "04017": "Navajo",
    "04019": "Pima",
    "04021": "Pinal",
    "04023": "Santa Cruz",
    "04025": "Yavapai",
    "04027": "Yuma",
}

# Wave-1 high-volume / major metros for panels
AZ_MAJORS: set[str] = {
    "04013",  # Maricopa
    "04019",  # Pima
    "04021",  # Pinal
    "04025",  # Yavapai
    "04015",  # Mohave
    "04027",  # Yuma
    "04005",  # Coconino
    "04003",  # Cochise
    "04017",  # Navajo
    "04007",  # Gila
    "04023",  # Santa Cruz
    "04009",  # Graham
}

COL = "arizona_originations"
ALIAS = "az_originations"
SUFFIX = "_az"
FOLDER = "arizona"
CODE = "AZ"
NAME = "Arizona"


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


def fill_county(r: dict[str, str]) -> dict[str, str]:
    fips = (r.get("county_fips") or "").strip()
    if not (r.get("county_name") or "").strip() and fips in AZ_COUNTIES:
        return {**r, "county_name": AZ_COUNTIES[fips]}
    return r


def name_to_slug(name: str) -> str:
    return (
        name.strip()
        .lower()
        .replace(".", "")
        .replace("'", "")
        .replace(" ", "-")
    )


def main() -> None:
    src = ROOT / "data" / "hmda" / "by-state" / CODE
    out = ROOT / "data" / "hmda" / FOLDER
    if not src.is_dir():
        raise SystemExit(f"Missing {src}")

    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))
    for lei, cur in AZ_CURATED_LEI.items():
        gleif.setdefault(lei, cur["institution_name_hmda"])
    # Refresh a few high-volume AZ names into gleif cache
    extra_gleif = {
        "549300HFXTV55C2HHM89": "DESERT FINANCIAL CREDIT UNION",
        "549300HIVO8XPBPNVG69": "NOVA FINANCIAL & INVESTMENT CORPORATION",
        "549300PC4MFWQBNVKG88": "V.I.P. MORTGAGE, INC.",
        "549300V36YE6JCCEJB76": "Arizona Financial Credit Union",
        "549300EWL25M8JXH2R78": "OneAZ Credit Union",
        "549300Z4HQ7YDKUVEW39": "VANTAGE WEST",
        "549300WYBPIWKK6SQC06": "Bell Bank",
        "5493002IVUY1DY0ZCL83": "COPPER STATE CREDIT UNION",
        "5493001I7Z53NDBE4X59": "ALTITUDE FINANCIAL CORPORATION",
    }
    gleif.update(extra_gleif)
    if GLEIF_CACHE.exists() or True:
        GLEIF_CACHE.parent.mkdir(parents=True, exist_ok=True)
        GLEIF_CACHE.write_text(json.dumps(gleif, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    county_rows = [fill_county(r) for r in read_csv(src / "county_market_summary.csv")]
    county_out: list[dict[str, str]] = []
    for r in county_rows:
        fips = (r.get("county_fips") or "").strip()
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        name = (r.get("county_name") or "").strip()
        if not name and fips in AZ_COUNTIES:
            r = {**r, "county_name": AZ_COUNTIES[fips]}
            name = AZ_COUNTIES[fips]
        if name or fips in AZ_MAJORS or orig >= 400:
            county_out.append(r)

    state_rows = read_csv(src / "lender_state_summary.csv")
    # Enrich institution names on state summary when blank
    enriched_state: list[dict[str, str]] = []
    for r in state_rows:
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in AZ_CURATED_LEI:
                nm = AZ_CURATED_LEI[lei]["institution_name_hmda"]
            if nm:
                r = {**r, "institution_name": nm}
        enriched_state.append(r)
    state_rows = enriched_state

    act_out: list[dict[str, str]] = []
    for r in read_csv(src / "lender_activity_by_county.csv"):
        r = fill_county(r)
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() or fips not in AZ_MAJORS:
            continue
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in AZ_CURATED_LEI:
                nm = AZ_CURATED_LEI[lei]["institution_name_hmda"]
            if nm:
                r = {**r, "institution_name": nm}
        act_out.append(r)

    cand = read_csv(src / "lei_mapping_candidates.csv")
    for r in cand:
        if ALIAS in r and COL not in r:
            r[COL] = r[ALIAS]

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
        if method_prefix.startswith("az_curated") and curated_slug:
            slug = curated_slug
        else:
            slug = NATIONAL_SLUG_BY_NMLS.get(nmls) or curated_slug
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
            COL: str(st_orig),
            "florida_originations": base.get("florida_originations") or "0",
            "total_originations": st.get("total_originations") or str(st_orig),
            "priority_match": "high" if st_orig >= 500 else "medium",
            "notes": (
                f"{method_prefix.rstrip('+') or 'curated'} map for {CODE} activity "
                f"({st_orig} {CODE} originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(float(prev[COL] or 0)) >= st_orig and prev.get("our_lender_slug"):
            if not method_prefix.startswith("az_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in AZ_CURATED_LEI.items():
        add_mapping(lei, cur, "az_curated+")

    mapping_rows = sorted(
        mapping_by_lei.values(),
        key=lambda r: -int(float(r.get(COL) or 0)),
    )

    if county_out:
        write_csv(out / f"county_market_summary{SUFFIX}.csv", county_out, list(county_out[0].keys()))
    if act_out:
        write_csv(out / f"lender_activity_by_county{SUFFIX}.csv", act_out, list(act_out[0].keys()))
    if state_rows:
        write_csv(out / f"lender_state_summary{SUFFIX}.csv", state_rows, list(state_rows[0].keys()))
    if cand:
        for r in cand:
            if COL not in r:
                r[COL] = r.get(ALIAS) or "0"
        write_csv(out / f"lei_mapping_candidates{SUFFIX}.csv", cand, list(cand[0].keys()))
    if mapping_rows:
        write_csv(out / "lei_to_nmls_mapping.csv", mapping_rows, list(mapping_rows[0].keys()))

    major_named = [
        r
        for r in county_out
        if (r.get("county_fips") or "") in AZ_MAJORS and (r.get("county_name") or "").strip()
    ]
    major_named.sort(key=lambda r: -float(r.get("total_originations") or 0))
    major_slugs = [name_to_slug(r.get("county_name") or "") for r in major_named]

    md = [
        f"# {NAME} HMDA slice\n\n",
        f"**Source:** `data/hmda/by-state/{CODE}/` (national 2025 foundation)\n\n",
        f"- County market rows: **{len(county_out)}**\n",
        f"- Lender–county activity (major markets): **{len(act_out)}**\n",
        f"- LEI state summaries: **{len(state_rows)}**\n",
        f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
        f"- Major markets with names: **{len(major_named)}**\n\n",
        f"## Top mapped LEIs by {CODE} originations\n\n",
    ]
    for r in mapping_rows[:20]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r[COL]} {CODE} orig.)\n"
        )
    md.append("\n## Major markets (panel-ready)\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Matching rules\n\n"
        "- Reuse prior product-state curated LEI maps when the LEI has AZ activity\n"
        "- AZ curated: Desert Financial CU, Nova Home Loans, OneAZ CU, Guild West Valley\n"
        "- Precision only — no low-confidence LEI inventing (VIP, Vantage West, etc. deferred)\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-arizona-slice.py\n"
        "```\n"
        "\n## Major slugs (for states.ts)\n\n```\n"
        + ", ".join(f"'{s}'" for s in major_slugs)
        + "\n```\n"
    )
    (out / "README.md").write_text("".join(md), encoding="utf-8")
    print(
        f"Wrote {NAME} → {out} "
        f"mappings={len(mapping_rows)} counties={len(county_out)} "
        f"activity={len(act_out)} majors={len(major_named)} "
        f"slugs={major_slugs}"
    )


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
High-confidence residual regional LEI→slug matching pass.

  python scripts/apply-regional-matching-quality.py

Adds curated maps to product-state lei_to_nmls_mapping.csv files when the LEI
has state activity. Does not invent NMLS IDs; LEI-identity hosts allowed when
public NMLS is ambiguous.
"""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HMDA = ROOT / "data" / "hmda"

# code -> (folder, originations column)
STATES: dict[str, tuple[str, str]] = {
    "TX": ("texas", "texas_originations"),
    "NC": ("north-carolina", "north_carolina_originations"),
    "TN": ("tennessee", "tennessee_originations"),
    "WA": ("washington", "washington_originations"),
    "OR": ("oregon", "oregon_originations"),
    "NV": ("nevada", "nevada_originations"),
    "UT": ("utah", "utah_originations"),
    "CA": ("california", "california_originations"),
    "FL": ("florida", "florida_originations"),
    "GA": ("georgia", "georgia_originations"),
    "AZ": ("arizona", "arizona_originations"),
    "CO": ("colorado", "colorado_originations"),
    "IL": ("illinois", "illinois_originations"),
    "OH": ("ohio", "ohio_originations"),
    "PA": ("pennsylvania", "pennsylvania_originations"),
    "NY": ("new-york", "new_york_originations"),
    "MI": ("michigan", "michigan_originations"),
    "VA": ("virginia", "virginia_originations"),
    "SC": ("south-carolina", "south_carolina_originations"),
    "OK": ("oklahoma", "oklahoma_originations"),
}

# High-confidence residual LEI maps (GLEIF-verified identities).
CURATED: dict[str, dict[str, str]] = {
    "G5AHTAP80NWA3Q8RDC78": {
        "institution_name_hmda": "Frost Bank",
        "nmls_id": "431208",
        "our_lender_slug": "frost-bank",
        "legal_name": "Frost Bank",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+public_nmls",
    },
    "254900Z5QRSHW4Y8CR51": {
        "institution_name_hmda": "CREDIT UNION OF TEXAS",
        "nmls_id": "576560",
        "our_lender_slug": "credit-union-of-texas",
        "legal_name": "Credit Union of Texas",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+public_nmls",
    },
    "549300DMHEHNYZ2OLB41": {
        "institution_name_hmda": "First United Bank and Trust Company",
        "nmls_id": "",
        "our_lender_slug": "first-united-bank-and-trust",
        "legal_name": "First United Bank and Trust Company",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "549300IVURCTJ6QVMD67": {
        "institution_name_hmda": "First Financial Bank",
        "nmls_id": "",
        "our_lender_slug": "first-financial-bank-texas",
        "legal_name": "First Financial Bank (Texas)",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+tx_directory",
    },
    "549300OQMU3ID8QA6M46": {
        "institution_name_hmda": "VELOCIO MORTGAGE L.L.C.",
        "nmls_id": "",
        "our_lender_slug": "velocio-mortgage",
        "legal_name": "Velocio Mortgage L.L.C.",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "549300KHXD7JSQUZIJ22": {
        "institution_name_hmda": "HIGHLANDS RESIDENTIAL MORTGAGE, LTD.",
        "nmls_id": "",
        "our_lender_slug": "highlands-residential-mortgage",
        "legal_name": "Highlands Residential Mortgage, Ltd.",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "5493002QI2ILHHZH8D20": {
        "institution_name_hmda": "KBHS HOME LOANS, LLC",
        "nmls_id": "",
        "our_lender_slug": "kbhs-home-loans",
        "legal_name": "KBHS Home Loans, LLC",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "549300UI36AJZ0WZ4U93": {
        "institution_name_hmda": "TAYLOR MORRISON HOME FUNDING, INC.",
        "nmls_id": "",
        "our_lender_slug": "taylor-morrison-home-funding",
        "legal_name": "Taylor Morrison Home Funding, Inc.",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "549300CY7WNAHKHYSJ73": {
        "institution_name_hmda": "CORNERSTONE CAPITAL BANK, SSB",
        "nmls_id": "",
        "our_lender_slug": "cornerstone-capital-bank",
        "legal_name": "Cornerstone Capital Bank, SSB",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "549300CB67L6KPJLHE19": {
        "institution_name_hmda": "TRIAD FINANCIAL SERVICES, INC.",
        "nmls_id": "",
        "our_lender_slug": "triad-financial-services",
        "legal_name": "Triad Financial Services, Inc.",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "549300PXL1KA5TOL2O82": {
        "institution_name_hmda": "M/I FINANCIAL, LLC",
        "nmls_id": "",
        "our_lender_slug": "mi-financial",
        "legal_name": "M/I Financial, LLC",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "549300VCMRO4ST680C11": {
        "institution_name_hmda": "VILLAGE CAPITAL & INVESTMENT LLC",
        "nmls_id": "",
        "our_lender_slug": "village-capital",
        "legal_name": "Village Capital & Investment LLC",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "5493007VW2EU20PZYU97": {
        "institution_name_hmda": "INSPIRE HOME LOANS INC.",
        "nmls_id": "",
        "our_lender_slug": "inspire-home-loans",
        "legal_name": "Inspire Home Loans Inc.",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "549300K4ZLGS7SRDTL86": {
        "institution_name_hmda": "Equity Prime Mortgage LLC",
        "nmls_id": "",
        "our_lender_slug": "equity-prime-mortgage",
        "legal_name": "Equity Prime Mortgage LLC",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "54930049L5WINET09Q97": {
        "institution_name_hmda": "CLICK N' CLOSE, INC.",
        "nmls_id": "",
        "our_lender_slug": "click-n-close",
        "legal_name": "Click N' Close, Inc.",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "549300YN94MOAVYW0F52": {
        "institution_name_hmda": "GoodLeap, LLC",
        "nmls_id": "",
        "our_lender_slug": "goodleap",
        "legal_name": "GoodLeap, LLC",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "549300T94GSH3C4U5M59": {
        "institution_name_hmda": "ALLIANT CREDIT UNION",
        "nmls_id": "197185",
        "our_lender_slug": "alliant-credit-union",
        "legal_name": "Alliant Credit Union",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+public_nmls",
    },
    "F28JOQ8OBWCFUYM0UX93": {
        "institution_name_hmda": "East West Bank",
        "nmls_id": "",
        "our_lender_slug": "east-west-bank",
        "legal_name": "East West Bank",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "254900TTZ395IC926125": {
        "institution_name_hmda": "SIERRA PACIFIC MORTGAGE COMPANY, INC.",
        "nmls_id": "",
        "our_lender_slug": "sierra-pacific-mortgage",
        "legal_name": "Sierra Pacific Mortgage Company, Inc.",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "5493008VVXQIDO1EZ460": {
        "institution_name_hmda": "SUMMIT FUNDING, INC.",
        "nmls_id": "",
        "our_lender_slug": "summit-funding",
        "legal_name": "Summit Funding, Inc.",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "549300ZWNETGFXTBBY03": {
        "institution_name_hmda": "CANOPY MORTGAGE, LLC",
        "nmls_id": "",
        "our_lender_slug": "canopy-mortgage",
        "legal_name": "Canopy Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "549300QKL5FUBZ8LSF50": {
        "institution_name_hmda": "NATIONS DIRECT MORTGAGE, LLC",
        "nmls_id": "",
        "our_lender_slug": "nations-direct-mortgage",
        "legal_name": "Nations Direct Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "5493009HUMWCHFRDKF12": {
        "institution_name_hmda": "SAMMAMISH MORTGAGE COMPANY",
        "nmls_id": "",
        "our_lender_slug": "sammamish-mortgage",
        "legal_name": "Sammamish Mortgage Company",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "549300TQWW6MLVH6KY61": {
        "institution_name_hmda": "ALLEGACY FEDERAL CREDIT UNION",
        "nmls_id": "411603",
        "our_lender_slug": "allegacy-federal-credit-union",
        "legal_name": "Allegacy Federal Credit Union",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+public_nmls",
    },
    "5493004NO7XCFVG4KD53": {
        "institution_name_hmda": "Y-12 Federal Credit Union",
        "nmls_id": "441816",
        "our_lender_slug": "y-12-federal-credit-union",
        "legal_name": "Y-12 Federal Credit Union",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+public_nmls",
    },
    "254900WQCRCK13A7DC81": {
        "institution_name_hmda": "Fortera Federal Credit Union",
        "nmls_id": "",
        "our_lender_slug": "fortera-federal-credit-union",
        "legal_name": "Fortera Credit Union",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "5493001UYBOONMFYPR30": {
        "institution_name_hmda": "Legacy Home Loans, LLC",
        "nmls_id": "",
        "our_lender_slug": "legacy-home-loans",
        "legal_name": "Legacy Home Loans, LLC",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
    "54930059GZZ7G4G40O53": {
        "institution_name_hmda": "Primis Mortgage Company",
        "nmls_id": "1894879",
        "our_lender_slug": "primis-mortgage",
        "legal_name": "Primis Mortgage Company",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+public_nmls",
    },
    "5493001M37Q8TJKTP708": {
        "institution_name_hmda": "Home Federal Bank of Tennessee",
        "nmls_id": "",
        "our_lender_slug": "home-federal-bank-tennessee",
        "legal_name": "Home Federal Bank of Tennessee",
        "match_confidence": "high",
        "match_method": "regional_quality_gleif+directory_slug",
    },
}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fieldnames})


def load_state_orig(folder: str) -> dict[str, tuple[int, str]]:
    """lei -> (originations, institution_name)"""
    prod = HMDA / folder
    lss_files = list(prod.glob("lender_state_summary*.csv"))
    if not lss_files:
        return {}
    out: dict[str, tuple[int, str]] = {}
    for r in read_csv(lss_files[0]):
        lei = (r.get("lei") or "").strip()
        if not lei:
            continue
        try:
            o = int(float(r.get("total_originations") or 0))
        except ValueError:
            o = 0
        out[lei] = (o, (r.get("institution_name") or "").strip())
    return out


def main() -> None:
    summary: list[str] = []
    total_adds = 0

    for code, (folder, col) in STATES.items():
        map_path = HMDA / folder / "lei_to_nmls_mapping.csv"
        if not map_path.exists():
            continue
        rows = read_csv(map_path)
        if not rows:
            continue
        fields = list(rows[0].keys())
        # Ensure required columns
        for req in [
            "lei",
            "institution_name_hmda",
            "nmls_id",
            "our_lender_slug",
            "legal_name",
            "match_confidence",
            "match_method",
            col,
            "florida_originations",
            "total_originations",
            "priority_match",
            "notes",
        ]:
            if req not in fields:
                fields.append(req)

        by_lei = {r["lei"]: r for r in rows if r.get("lei")}
        state_orig = load_state_orig(folder)
        added = 0
        upgraded = 0

        for lei, cur in CURATED.items():
            if lei not in state_orig or state_orig[lei][0] <= 0:
                continue
            st_orig, st_name = state_orig[lei]
            slug = cur["our_lender_slug"]
            row = {
                "lei": lei,
                "institution_name_hmda": cur["institution_name_hmda"] or st_name,
                "nmls_id": cur.get("nmls_id") or "",
                "our_lender_slug": slug,
                "legal_name": cur.get("legal_name") or "",
                "match_confidence": cur.get("match_confidence") or "high",
                "match_method": cur.get("match_method") or "regional_quality",
                col: str(st_orig),
                "florida_originations": by_lei.get(lei, {}).get("florida_originations") or "0",
                "total_originations": str(st_orig),
                "priority_match": "high" if st_orig >= 500 else "medium",
                "notes": (
                    f"regional_quality map for {code} activity "
                    f"({st_orig} {code} originations); slug={slug}."
                ),
            }
            prev = by_lei.get(lei)
            if prev and (prev.get("our_lender_slug") or "").strip() == slug:
                # refresh originations / identity fields only
                prev.update({k: row[k] for k in row if k in prev or k == col})
                if col not in prev:
                    prev[col] = str(st_orig)
                upgraded += 1
            elif prev and (prev.get("our_lender_slug") or "").strip():
                # Curated override of prior (fix identity collisions)
                by_lei[lei] = {**prev, **row}
                upgraded += 1
            else:
                by_lei[lei] = row
                added += 1
                total_adds += 1

        new_rows = sorted(
            by_lei.values(),
            key=lambda r: -int(float(r.get(col) or r.get("total_originations") or 0)),
        )
        write_csv(map_path, new_rows, fields)

        # top50 mapped rate
        ranked = sorted(state_orig.items(), key=lambda x: -x[1][0])
        top50 = [lei for lei, _ in ranked[:50]]
        mapped_set = {r["lei"] for r in new_rows if (r.get("our_lender_slug") or "").strip()}
        t50 = sum(1 for lei in top50 if lei in mapped_set)
        t20 = sum(1 for lei in top50[:20] if lei in mapped_set)
        summary.append(
            f"{code}: maps={len(new_rows)} (+{added} new, {upgraded} refreshed) "
            f"top20={t20}/20 top50={t50}/50"
        )
        print(summary[-1])

    print(f"\nTotal new LEI maps across states: {total_adds}")
    (HMDA / "regional_matching_quality_summary.txt").write_text(
        "Regional matching quality pass\n" + "\n".join(summary) + f"\n\nnew_maps={total_adds}\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()

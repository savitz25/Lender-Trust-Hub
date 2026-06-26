#!/usr/bin/env python3
"""
Generate LenderTrustHub sitemap index + category sitemaps.

Run after adding states, lenders, or verticals:
    python scripts/generate-sitemap-index.py

Then commit public/sitemap_index.xml and public/sitemaps/*.xml
"""

from pathlib import Path

BASE = "https://www.lendertrusthub.com"
LASTMOD = "2026-06-26"
ROOT = Path(__file__).resolve().parent.parent / "public"
SITEMAPS_DIR = ROOT / "sitemaps"

# ── ADD NEW FDIC STATE SLUGS HERE ──────────────────────────────────────────
FDIC_STATES = [
    "alabama", "alaska", "arizona", "arkansas", "california", "colorado",
    "connecticut", "delaware", "district-of-columbia", "florida", "georgia",
    "hawaii", "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky",
    "louisiana", "maine", "maryland", "massachusetts", "michigan", "minnesota",
    "mississippi", "missouri", "montana", "nebraska", "nevada", "new-hampshire",
    "new-jersey", "new-mexico", "new-york", "north-carolina", "north-dakota",
    "ohio", "oklahoma", "oregon", "pennsylvania", "rhode-island",
    "south-carolina", "south-dakota", "tennessee", "texas", "utah", "vermont",
    "virginia", "washington", "west-virginia", "wisconsin", "wyoming",
]

# ── ADD NEW MORTGAGE STATE SLUGS HERE ──────────────────────────────────────
MORTGAGE_STATES = [
    "arizona", "california", "colorado", "district-of-columbia", "florida",
    "georgia", "illinois", "massachusetts", "michigan", "new-york",
    "north-carolina", "pennsylvania", "tennessee", "texas", "washington",
]

# ── ADD NEW AUTO LOAN STATE SLUGS HERE ──────────────────────────────────────
AUTO_STATES = [
    "arizona", "california", "colorado", "district-of-columbia", "florida",
    "georgia", "illinois", "new-york", "north-carolina", "pennsylvania",
    "texas", "washington",
]

# ── ADD NEW CREDIT REPAIR STATE SLUGS HERE (when vertical goes live) ─────────
CREDIT_REPAIR_STATES: list[str] = [
    # "florida",
    # "texas",
    # "california",
]

# ── ADD NEW MCA STATE SLUGS HERE (when vertical goes live) ───────────────────
MCA_STATES: list[str] = [
    # "florida",
    # "texas",
    # "new-york",
]

# ── ADD NEW LENDER PROFILE SLUGS HERE ──────────────────────────────────────
LENDER_SLUGS = [
    "summit-home-lending", "coastal-mortgage-partners", "evergreen-lending-group",
    "pacific-trust-mortgage", "metro-home-finance", "lone-star-lending",
    "windy-city-mortgage", "peach-state-home-loans", "desert-sun-mortgage",
    "cascade-home-lending", "rocky-mountain-mortgage", "harbor-bay-lending",
    "sunshine-state-mortgage", "golden-gate-home-loans", "heartland-home-finance",
    "liberty-lending-solutions", "capital-trust-mortgage", "blue-ridge-home-lending",
    "great-lakes-mortgage", "pioneer-valley-lending", "tampa-bay-trust-lending",
    "nashville-home-mortgage",
]

# ── ADD NEW CALCULATOR TOOL PATHS HERE ─────────────────────────────────────
CALCULATOR_PATHS = [
    "/calculators",
    # "/calculators/mortgage-payment",   # future
    # "/calculators/affordability",      # future
    # "/calculators/refinance-roi",      # future
]


def url_entry(loc: str, priority: str = "0.8") -> str:
    return f"""  <url>
    <loc>{loc}</loc>
    <lastmod>{LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>{priority}</priority>
  </url>"""


def build_urlset(entries: list[str], header_comment: str = "") -> str:
    comment = f"  <!-- {header_comment} -->\n" if header_comment else ""
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{comment}"
        + "\n".join(entries)
        + "\n</urlset>\n"
    )


def write_sitemap(filename: str, content: str) -> int:
    path = SITEMAPS_DIR / filename
    path.write_text(content, encoding="utf-8")
    count = content.count("<url>")
    print(f"  {filename}: {count} URLs")
    return count


def main() -> None:
    SITEMAPS_DIR.mkdir(parents=True, exist_ok=True)

    print("Generating category sitemaps...")

    # FDIC Banks
    fdic_entries = [
        url_entry(f"{BASE}/", "1.0"),
        url_entry(f"{BASE}/fdic-insured-banks", "0.9"),
        "  <!-- ADD NEW FDIC STATE BELOW: copy url_entry line, replace {slug} -->",
    ]
    fdic_entries.extend(
        url_entry(f"{BASE}/fdic-insured-banks/{slug}", "0.8") for slug in FDIC_STATES
    )
    write_sitemap("fdic-banks.xml", build_urlset(fdic_entries, "FDIC Insured Banks"))

    # Mortgage Lenders (hub + state pages only; profiles in lender-profiles.xml)
    mortgage_entries = [
        url_entry(f"{BASE}/local-lenders", "0.9"),
        "  <!-- ADD NEW MORTGAGE STATE BELOW -->",
    ]
    mortgage_entries.extend(
        url_entry(f"{BASE}/local-lenders/{slug}", "0.8") for slug in MORTGAGE_STATES
    )
    write_sitemap(
        "mortgage-lenders.xml",
        build_urlset(mortgage_entries, "Mortgage Lenders by State"),
    )

    # Auto Loans
    auto_entries = [
        url_entry(f"{BASE}/auto-loan-companies", "0.9"),
        "  <!-- ADD NEW AUTO LOAN STATE BELOW -->",
    ]
    auto_entries.extend(
        url_entry(f"{BASE}/auto-loan-companies/{slug}", "0.8") for slug in AUTO_STATES
    )
    write_sitemap("auto-loans.xml", build_urlset(auto_entries, "Auto Loan Companies"))

    # Credit Repair (hub + future states)
    credit_entries = [
        url_entry(f"{BASE}/credit-repair", "0.9"),
        "  <!-- ADD NEW CREDIT REPAIR STATE BELOW when /credit-repair/[state] goes live -->",
    ]
    credit_entries.extend(
        url_entry(f"{BASE}/credit-repair/{slug}", "0.8") for slug in CREDIT_REPAIR_STATES
    )
    write_sitemap(
        "credit-repair.xml",
        build_urlset(credit_entries, "Credit Repair Companies (hub live; states TBD)"),
    )

    # MCA
    mca_entries = [
        url_entry(f"{BASE}/mca-companies", "0.9"),
        "  <!-- ADD NEW MCA STATE BELOW when /mca-companies/[state] goes live -->",
    ]
    mca_entries.extend(
        url_entry(f"{BASE}/mca-companies/{slug}", "0.8") for slug in MCA_STATES
    )
    write_sitemap(
        "mca.xml",
        build_urlset(mca_entries, "Merchant Cash Advance Companies (hub TBD)"),
    )

    # Calculators
    calc_entries = [
        "  <!-- ADD NEW CALCULATOR TOOL BELOW -->",
    ]
    calc_entries.extend(url_entry(f"{BASE}{path}", "0.8") for path in CALCULATOR_PATHS)
    write_sitemap("calculators.xml", build_urlset(calc_entries, "Mortgage Calculators"))

    # Lender Profiles
    profile_entries = [
        "  <!-- ADD NEW LENDER PROFILE BELOW: /lenders/{slug} -->",
    ]
    profile_entries.extend(
        url_entry(f"{BASE}/lenders/{slug}", "0.7") for slug in LENDER_SLUGS
    )
    write_sitemap("lender-profiles.xml", build_urlset(profile_entries, "Lender Profile Pages"))

    # Master sitemap index
    child_sitemaps = [
        "fdic-banks.xml",
        "mortgage-lenders.xml",
        "auto-loans.xml",
        "credit-repair.xml",
        "mca.xml",
        "calculators.xml",
        "lender-profiles.xml",
    ]
    index_entries = "\n".join(
        f"""  <sitemap>
    <loc>{BASE}/sitemaps/{name}</loc>
    <lastmod>{LASTMOD}</lastmod>
  </sitemap>"""
        for name in child_sitemaps
    )
    index_xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        "  <!-- Submit THIS file to Google Search Console: sitemap_index.xml -->\n"
        f"{index_entries}\n"
        "</sitemapindex>\n"
    )
    index_path = ROOT / "sitemap_index.xml"
    index_path.write_text(index_xml, encoding="utf-8")
    print(f"  sitemap_index.xml: {len(child_sitemaps)} child sitemaps")

    # robots.txt
    robots = (
        "User-agent: *\n"
        "Allow: /\n"
        "\n"
        f"Sitemap: {BASE}/sitemap_index.xml\n"
    )
    (ROOT / "robots.txt").write_text(robots, encoding="utf-8")
    print("  robots.txt updated")

    # Remove legacy monolithic sitemap if present
    legacy = ROOT / "sitemap.xml"
    if legacy.exists():
        legacy.unlink()
        print("  Removed legacy public/sitemap.xml (use sitemap_index.xml)")

    print("Done.")


if __name__ == "__main__":
    main()
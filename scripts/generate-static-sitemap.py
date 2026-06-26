#!/usr/bin/env python3
"""Generate public/sitemap.xml from published routes."""

from pathlib import Path

BASE = "https://www.lendertrusthub.com"
LASTMOD = "2026-06-26"

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

MORTGAGE_STATES = [
    "arizona", "california", "colorado", "district-of-columbia", "florida",
    "georgia", "illinois", "massachusetts", "michigan", "new-york",
    "north-carolina", "pennsylvania", "tennessee", "texas", "washington",
]

AUTO_STATES = [
    "arizona", "california", "colorado", "district-of-columbia", "florida",
    "georgia", "illinois", "new-york", "north-carolina", "pennsylvania",
    "texas", "washington",
]

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


def url_entry(loc: str, changefreq: str, priority: str) -> str:
    return f"""  <url>
    <loc>{loc}</loc>
    <lastmod>{LASTMOD}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>"""


def main() -> None:
    entries: list[str] = []

    # Homepage
    entries.append(url_entry(f"{BASE}/", "weekly", "1.0"))

    # National hubs
    for path in (
        "/fdic-insured-banks",
        "/local-lenders",
        "/auto-loan-companies",
        "/calculators",
    ):
        entries.append(url_entry(f"{BASE}{path}", "weekly", "0.9"))

    # Other important pages
    for path in ("/about", "/compare"):
        entries.append(url_entry(f"{BASE}{path}", "monthly", "0.7"))

    # FDIC state pages
    for slug in FDIC_STATES:
        entries.append(
            url_entry(f"{BASE}/fdic-insured-banks/{slug}", "monthly", "0.8")
        )

    # Mortgage state pages
    for slug in MORTGAGE_STATES:
        entries.append(url_entry(f"{BASE}/local-lenders/{slug}", "monthly", "0.8"))

    # Auto state pages
    for slug in AUTO_STATES:
        entries.append(
            url_entry(f"{BASE}/auto-loan-companies/{slug}", "monthly", "0.8")
        )

    # Lender profiles
    for slug in LENDER_SLUGS:
        entries.append(url_entry(f"{BASE}/lenders/{slug}", "monthly", "0.7"))

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</urlset>\n"
    )

    out = Path(__file__).resolve().parent.parent / "public" / "sitemap.xml"
    out.write_text(xml, encoding="utf-8")
    print(f"Wrote {len(entries)} URLs to {out}")


if __name__ == "__main__":
    main()
# Master Lender Registry — Deduplicated (Authoritative Source)

**Source:** `agent.agencies USA/agents in south florida.docx`  
**Live data:** `lib/mortgage/floridaLenders.ts` (18 agencies wired to site)  
**Updated:** June 2026

---

## Section 1 — Executive Summary (10 agencies)

| Name | Primary County | NMLS | Key Specialty |
|------|----------------|------|---------------|
| Choice Mortgage Group | Palm Beach | 2275047 | Luxury waterfront, wholesale |
| The Truth About Lending LLC | Broward | 1054357 | Self-employed, first-time buyers |
| Premier Lending Corp | Miami-Dade* | 1156346 | Foreign national, ITIN, DPA |
| Prime Time Mortgage Inc. | Broward | 372175 | Fast closings, investors |
| CMG Home Loans (Dennis Vo Team) | Miami-Dade | 1820 / 2458338 | Jumbo, 203k, urban luxury |
| Mortgage Advantage Lending, LLC | Miami-Dade | 60161 | FHA, VA, affordable housing |
| America Home Loans LLC | Palm Beach | 885847 | Fast pre-approvals |
| Palm Beach Mortgage Group, Inc. | Palm Beach | Verify NMLS | Luxury/jumbo since 1980s |
| Paramount Residential Mortgage Group | Orange (statewide) | 75243 | FHA, VA, DPA |
| Supreme Lending (South FL Branch) | Palm Beach | 2129 | Purchase speed, agent trust |

*Premier Lending HQ Cooper City (Broward) — primary county Miami-Dade for international buyer focus; serves both counties.

---

## Section 2 — Additional unique agencies (merged, no duplicates)

| Name | Primary County | NMLS |
|------|----------------|------|
| The Doce Mortgage Group | Broward | 2638131 |
| Florida State Mortgage Group, Inc. | Broward | 393326 |
| Florida's VA Mortgage Center | Broward (statewide VA) | 1299512 |
| Bennett Capital Partners | Miami-Dade | 2046862 |
| Rate Leaf Inc. | Miami-Dade | 1917493 |
| OnMortgage, LLC | Miami-Dade | 1889418 |
| Primary Residential Mortgage (Aaron Swenson) | Palm Beach | 3094 / ~1811142 |
| Home Financial Group LLC | Palm Beach | 305389 |

---

## Deduplication

- **Premier Lending Corp** — 3 appearances in doc → 1 canonical profile (NMLS 1156346)
- Section 1 + Section 2 = **18 unique NMLS entities** on site (Palm Beach Mortgage Group: verify NMLS before publish)

---

## County page assignments (live)

| County | Lenders on page |
|--------|-----------------|
| Broward | Doce, Truth About Lending, Florida State Mortgage, Prime Time, FL VA Center |
| Miami-Dade | CMG, Bennett, Premier, Rate Leaf, OnMortgage, Mortgage Advantage |
| Palm Beach | Choice, PRMI Swenson, PB Mortgage Group, America Home Loans, Supreme, Home Financial |
| Orange | PRMG + Mortgage Advantage (supplement) |
| Hillsborough | Mortgage Advantage, PRMG, FL VA Center (supplements) |
| Duval | PRMG, FL VA Center (supplements) |

**Routes:** `/local-lenders/florida/south-florida` · `/local-lenders/florida/{county}`
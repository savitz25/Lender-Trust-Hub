# County Page Templates — Miami-Dade, Palm Beach, Orange, Hillsborough, Duval

> Use identical component markers as `broward.md`. Swap county-specific stats, hero copy, lender assignments, and corridor references.

---

## Miami-Dade County

**Route:** `/local-lenders/florida/miami-dade`  
**Hero headline:** *Mortgage Lenders in Miami-Dade — Brickell, Coral Gables & the Keys Gateway*  
**ZIP examples:** `33101`, `33130`, `33139`, `33157`

### Quick stats
- Population ~2.7M · Urban condo-heavy · International buyer hub · Jumbo corridors (Brickell, Coconut Grove, Coral Gables)

### Featured lenders (3 full profiles each)
| Lender | Anchor ID | Pull from |
|--------|-----------|-----------|
| CMG Home Loans (Dennis Vo Team) | `#cmg-home-loans` | Source doc Profile 5 — expand with 203k, All-In-One, Miami Herald award |
| Bennett Capital Partners | `#bennett-capital` | Source doc #5 — Brickell, foreign national, commercial |
| Premier Lending Corp | `#premier-lending` | Source doc Profile 3 — ITIN, foreign national, Cooper City + Miami reach |

### Local flavor lines
- "navigating Brickell high-rise condo approval lists"
- "beating all-cash offers in Coral Gables with strong pre-approval letters"
- "cross-border asset verification for Latin American investors"

### Calculators + CTA
Same four calculators as Broward; CTA text: **Match me to Miami-Dade lenders**

### Comparison table rows
CMG (jumbo/203k) · Bennett (foreign national) · Premier (ITIN/DPA)

### FAQ seeds
- Best mortgage brokers for Brickell condos?
- Foreign national loans in Miami-Dade?
- Jumbo lenders near Coral Gables?

### Cross-links
→ Broward (suburban overflow) · → Palm Beach (luxury north) · → South Florida Hub

---

## Palm Beach County

**Route:** `/local-lenders/florida/palm-beach`  
**Hero headline:** *Mortgage Lenders in Palm Beach County — Boca, Delray & the Coastal Corridor*  
**ZIP examples:** `33431`, `33444`, `33401`, `33480`

### Quick stats
- Population ~1.5M · Luxury & jumbo concentration · Barrier island complexities · Established local networks since 1980s

### Featured lenders (2–3 full profiles)
| Lender | Anchor ID | Notes |
|--------|-----------|-------|
| Choice Mortgage Group | `#choice-mortgage` | Boca Raton HQ, Federal Highway corridor, waterfront |
| Primary Residential Mortgage (Aaron Swenson) | `#prmi-swenson` | Delray Beach, 20+ years tri-county |
| *(Optional 3rd)* Palm Beach Mortgage Group | `#pb-mortgage-group` | Suzanne Downs, est. 1985 roots — verify NMLS on publication |

### Local flavor lines
- "barrier island HO-6 and flood-zone requirements"
- "beating competitive all-cash offers in Boca with boutique direct lending"
- "jumbo loans along the Intracoastal"

### FAQ seeds
- Best jumbo lenders in Boca Raton?
- Who handles luxury waterfront closings in Palm Beach?

---

## Orange County (Orlando)

**Route:** `/local-lenders/florida/orange`  
**Hero headline:** *Mortgage Lenders in Orange County — Orlando, Winter Garden & Lake Nona*  
**ZIP examples:** `32801`, `34786`, `32827`

### Quick stats
- Population ~1.4M · Theme-park & tech employment · First-time buyer heavy · DPA program demand · Lower insurance stress vs. coastal FL

### Featured lenders (2 profiles — statewide + local positioning)
| Lender | Anchor ID | Notes |
|--------|-----------|-------|
| Paramount Residential Mortgage Group (PRMG) | `#prmg` | Enterprise FHA/VA/DPA; Orlando retail branches |
| Cross-link: The Doce Mortgage Group | external | Bank-statement / investor referrals from South FL |

### Local flavor lines
- "Lake Nona medical city employment verification"
- "Orange County down payment assistance alignment"
- "first-time buyers priced out of South Florida finding Orlando value"

### FAQ seeds
- FHA lenders in Orlando?
- Down payment assistance Orange County?

### Note
Source document lacks Orlando-specific independents — flag for future expansion (Rate Leaf / OnMortgage serve Miami-Dade primarily). PRMG fills statewide gap credibly.

---

## Hillsborough County (Tampa Area)

**Route:** `/local-lenders/florida/hillsborough`  
**Hero headline:** *Mortgage Lenders in Hillsborough County — Tampa, Brandon & MacDill Corridor*  
**ZIP examples:** `33602`, `33511`, `33647`

### Quick stats
- Population ~1.5M · Gulf Coast growth · MacDill AFB veteran demand · Refinance volume · More affordable than South FL coastal

### Featured lenders
| Lender | Anchor ID | Notes |
|--------|-----------|-------|
| Paramount Residential Mortgage Group (PRMG) | `#prmg` | Tampa retail presence, VA/FHA |
| Cross-link: Florida's VA Mortgage Center | external | Statewide VA specialist |
| Cross-link: Supreme Lending | *(reserve)* | Purchase-speed enterprise — use if adding 11th profile later |

### Local flavor lines
- "MacDill-area VA purchase timelines"
- "South Tampa bungalow vs. Wesley Chapel new construction"
- "refinance break-even in a stabilizing rate environment"

---

## Duval County (Jacksonville Area)

**Route:** `/local-lenders/florida/duval`  
**Hero headline:** *Mortgage Lenders in Duval County — Jacksonville, Orange Park & Beaches*  
**ZIP examples:** `32202`, `32256`, `32073`

### Quick stats
- Population ~1.0M · Logistics & military (NAS Jacksonville, Mayport) · Northeast FL affordability · Different insurance profile than South FL

### Featured lenders
| Lender | Anchor ID | Notes |
|--------|-----------|-------|
| Paramount Residential Mortgage Group (PRMG) | `#prmg` | Jacksonville branch network |
| Cross-link: Florida's VA Mortgage Center | external | VA purchase/refi statewide |

### Local flavor lines
- "Jacksonville's relative affordability vs. Miami-Dade"
- "Navy and USMC families near Mayport"
- "beach-town wind coverage in Jacksonville Beach"

---

## Shared template blocks (all counties)

Copy verbatim from `broward.md` with county name substitution:

1. `<!-- COMPONENT: Breadcrumbs -->`
2. `<!-- COMPONENT: TrustBar -->`
3. `<!-- COMPONENT: CalculatorEmbed -->` (4 calculators)
4. `<!-- COMPONENT: TrustBox -->` (How We Verify)
5. `<!-- COMPONENT: LeadCaptureForm -->`
6. Profile field order: Header → Verification → Local Expertise → Reputation → Additional → Why this lender fits

### Testimonials section
Use 3 county-specific composites + 1–2 sourced lender quotes from profiles.

### Schema suggestions per county page
```json
{
  "@type": "WebPage",
  "about": { "@type": "AdministrativeArea", "name": "[County] County, Florida" },
  "mainEntity": { "@type": "ItemList", "itemListElement": [/* Lender LocalBusiness */] }
}
```
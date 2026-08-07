# Lender Trust Hub — Phase 4: County quality + mortgage intelligence foundation

## Quality score (0–100)

| Component | Max | Signals |
|-----------|-----|---------|
| Inventory quality | 30 | In-county count, NMLS-verified share, avg Research Score |
| In-county presence | 25 | True HQ after Phase 1; prefers local over nearby-heavy |
| Local usefulness | 15 | Loan-type diversity among in-county entities |
| Consumer utility | 15 | Calculators/compare/verify paths + inventory usefulness |
| Data completeness | 10 | Avg Data Confidence of in-county listings |
| Connectivity | 5 | State hub + tools available |

**Not used:** population, invented local essays.

## Tiers

| Tier | Score / gates | Robots | Sitemap |
|------|----------------|--------|---------|
| **1 Premium** | ≥68, ≥3 in-county, ≥1 verified, loan diversity ≥2 | index,follow | priority 0.8 |
| **2 Standard** | ≥42, ≥2 in-county | index,follow | priority 0.65 |
| **3 Development** | else | **noindex,follow** | **excluded** |

Promotion: improve real inventory/verification — not unsupported content.

## Intelligence modules (Tier 1–2)

- Loan-program educational entry points (no live rates)
- Compare / calculate / NMLS / FDIC paths
- Official state housing + NMLS/CFPB/HUD handoffs

## Deploy

**Lender-Trust-Hub** production only.

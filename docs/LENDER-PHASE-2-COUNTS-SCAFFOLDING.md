# Lender Trust Hub — Phase 2: SEO scaffolding + count integrity

## Count taxonomy (public)

| Kind | Meaning |
|------|---------|
| Distinct mortgage companies | Unique by NMLS entity (Phase 0) |
| NMLS ID verified | Numeric NMLS + verification flag |
| Catalog location rows | Geo rows before entity dedupe |
| Published company profiles | Distinct profiles in the directory |
| FDIC bank records | Institutions in published state data files |
| Auto providers | Rows in the auto catalog |

Helpers: `lib/directory/public-counts.ts`

## Removed from consumer UI

- `Targets: "…"` planning labels  
- `SEO-optimized` copy  
- `featured-snippet` / query-family framing  
- Ambiguous `12,450+` / `2.8M reviews` / decorative `+` inventory floors  

## Deploy

Production = **Lender-Trust-Hub** repo only.

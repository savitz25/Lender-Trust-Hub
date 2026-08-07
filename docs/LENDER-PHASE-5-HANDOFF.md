# Lender Trust Hub — Phase 5 handoff

**Program close:** Measurement + polish + operational clarity  
**Baseline date:** `2026-08-07` (`LENDER_MEASUREMENT_BASELINE_DATE`)  
**Label:** `lender-trust-hub-phase-5`  
**Scope:** No large new content; Phases 0–4 integrity systems remain in force.

---

## 1. Completed systems (production-ready)

| System | Durable capability |
|--------|-------------------|
| NMLS verification integrity | Hard badge only with numeric NMLS ID; placeholders blocked |
| Phone / close-metric honesty | 555 phones stripped; seed close metrics suppressed |
| Entity scoring | Research Score per NMLS entity; not geo-row cosmetics |
| Locality honesty | In-county HQ first; nearby secondary; no padding as local |
| Count honesty | Distinct companies vs location rows; no SEO scaffolding in UI |
| Score separation | Research Score / Data Confidence / NMLS Status / Local Evidence |
| County quality tiers | Tier 1–2 indexable; Tier 3 noindex,follow; tier-aware sitemap |
| Measurement (Phase 5) | Priority GA4 events + click tracker + baseline globals |

### Sitemaps to submit (GSC — Lender property)

1. **`https://www.lendertrusthub.com/sitemap.xml` only**

Includes: core tools, state hubs, **Tier 1/2 counties**, NMLS-verified distinct profiles. Excludes Tier 3 counties from the premium index set (pages remain live with noindex,follow).

### Indexable surfaces (when quality gates pass)

- State hubs (`/local-lenders/{state}`)
- Tier 1 / Tier 2 county pages
- Calculators, compare, methodology, about
- Strong profiles (NMLS ID verified)

---

## 2. Needs ongoing ops

| Workstream | Notes |
|------------|--------|
| Real NMLS / phone backfill | Confirm IDs on NMLS Consumer Access; never reintroduce 555 |
| County tier promotion reviews | Promote only when real in-county inventory improves |
| Metric enrichment | Google/BBB only with observed provenance |
| State DPA / housing URL refresh | Update `state-housing-resources.ts` from primary sources |
| Calculator assumption refresh | Educational limits and default assumptions on a cadence |
| GA4 env | Ensure `NEXT_PUBLIC_GA4_ID` is set on LTH Vercel project |
| GSC URL Inspection | Sample Tier 1 county, state hub, calculator, verified profile |

---

## 3. Recommended next focus

**Primary:** Deeper **Tier 1 county mortgage intelligence** using real inventory + official housing handoffs (no fabricated local essays).

**Secondary (data-supported only):**

- Loan Estimate comparator (educational, not live rates)
- First-time buyer / DPA cluster where primary state sources exist

**Defer:**

- Credit Repair / MCA public surfaces
- Network-wide shared locality service (nice-to-have after measurement baseline is live)

---

## 4. Integrity rules (still in force)

1. No verified badge without numeric NMLS ID  
2. No 555 placeholder phones  
3. No seed closing-performance metrics  
4. No internal SEO planning language in production UI  
5. No out-of-county lenders as in-county locals  
6. Research Score ≠ Data Confidence ≠ License ≠ Local Evidence  
7. No Credit Repair / MCA public roadmap expansion in this program  
8. Research-only / no-lead-fee positioning intact  

---

## 5. Manual post-deploy checklist

- [ ] LTH GA4 ID present on lendertrusthub.com deploy  
- [ ] Realtime: NMLS outbound click, calculator complete (export/match), compare 2+, profile view, My Lending save  
- [ ] `window.__LTH_MEASUREMENT_BASELINE === '2026-08-07'` and `__LTH_HUB === 'lender'`  
- [ ] GSC sitemap submitted; sample Tier 1/2 counties + state hub + calculator  
- [ ] Spot-check: no SEE-NMLS / 555 / close-day estimates / Targets: SEO copy  
- [ ] Mobile smoke: county cards, research score panel, compare, calculators, focus rings on CTAs  

### Priority GA4 events

| Event | When |
|-------|------|
| `nmls_verification_lookup` / `outbound_nmls_consumer_access` | Click to NMLS Consumer Access |
| `calculator_complete` | Calc export/match/complete |
| `lender_compare_session` | Compare selects ≥ 2 lenders |
| `my_lending_save` / `my_lending_return` | Save to My Lending / open My Lending |
| `lender_profile_view` | Profile (once / slug / session) |
| `research_path_click` | Hub→profile, tool→hub, state↔county, etc. |
| `outbound_specialist_hub` | Click to Insurance / Move / Ask |
| `outbound_primary_source` | .gov / housing / CFPB-style outs |

# Stage 0 — Network Trust Cleanup

Credibility pass before Stage A cross-hub handoffs. **No new lead funnels.**

## Repos touched
- `lender-trust-hub` (primary)
- `insurance-trust-hub` (primary)
- `move-trust-hub` — static HTML only; no confirmed low-risk ZIP/duplicate bugs in-repo to fix this pass

---

## LenderTrustHub

### Score / ranking credibility
- **Public cards** no longer show 0–100 Research Score / Data Confidence grids
- Replaced with **evidence badges** (NMLS, local HQ, attributed ratings, CFPB/HMDA when present)
- Profile `ResearchScoreDisplay` reframed as “Public research signals”; optional composite factors collapsed under methodology transparency only
- Directory sort within bands: NMLS → completeness → local evidence → reviews (not scoreboard ranking)
- Removed card **rank numbers** (scoreboard optics)
- Compare tool: dropped Research Score / local 0–100 rows for NMLS + HQ evidence fields

### Contradiction cleanup
- `PersonalizedBanner`: removed “Top rated” / “Recommended for homebuyers” framing
- Ranking basis copy no longer implies paid rankings elsewhere; clear “cannot be purchased”
- Methodology updated for evidence-first public presentation

### Internal QA metadata removed from public
- County pages: removed Tier / quality score / noindex consumer labels
- State research sections: removed “Tier 1 · score” chips and “T1” badges
- County intelligence: removed quality score footer
- Methodology: removed public “noindex gates” wording

### Trust-claim fatigue
- New `NetworkResearchStandard` component (single clear standard block)
- State hubs show it once; profile/footer repetitions reduced

---

## InsuranceTrustHub

### Seed listing purge
- `getProviders` / `searchProviders`: **never** return FALLBACK seed catalog; empty when no Supabase indexable inventory
- `getProviderBySlug`: 404 for seed / generated hub agents
- `/providers` directory: honest empty state (“We’re still verifying this market”)
- Hub pages: `getPublicAgentsForHub` filters to `indexable_research` only; empty states for seed markets
- Specialty topics: filter South Florida agents to indexable only
- Sitemap: empty provider list (no seed URLs)
- `generateStaticParams` for providers: empty (no seed static paths)

### CTA / lead-gen language
- Lead form: “Contact agency”; explicit relay disclosure (not quote marketplace; rankings unaffected; request not sold)
- Profile: “Visit website”; contact form intro clarifies not a quote funnel
- Seed contact disabled copy no longer centers “seed” jargon for consumers when form is off

### Trust standard
- Shared `NetworkResearchStandard` on providers hub

---

## Remaining risks
- Until Supabase promotions land, Insurance public directories/hub agent lists may be **empty** (by design)
- Optional internal composite still exists in Lender methodology — must not reappear as card scoreboards
- MoveTrustHub needs a separate audit if destination ZIP bugs live only in production HTML not present in this workspace snapshot
- Insurance curated hub tables may still show zero rows until agents are promoted to `indexable_research`

## Success criteria met
- No public Lender scoreboard grade on cards
- No “top rated / recommended winner” modules
- No public Tier/QA labels on county pages
- No seed agencies in consumer Insurance directories
- Clearer, less repetitive trust messaging

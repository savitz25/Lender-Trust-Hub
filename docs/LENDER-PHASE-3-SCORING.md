# Lender Trust Hub — Phase 3: Score redesign + metric provenance

## Signals

| Signal | Role |
|--------|------|
| **Research Score** | Recomputed 0–100 composite per NMLS entity |
| **Data Confidence** | Completeness of research fields |
| **NMLS / License Status** | Phase 0 verified / on file / incomplete |
| **Local Market Evidence** | Only when HQ locality is derived |

## Ranking

1. In-county HQ, then nearby (Phase 1)
2. Within band: Research Score → Data Confidence → NMLS status → review volume
3. No paid ranking

## Provenance

Seed Google/BBB/Trustpilot and volume ranks suppressed until independently retrieved.  
CFPB counts, when shown, disclose non-normalized + not a finding of fault.

## Deploy

**Lender-Trust-Hub** production only.

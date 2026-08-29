# FL-LEND-003 requirement — versioned snapshots (do not implement here)

All current dataset-derived numbers on the LenderTrustHub homepage and `/florida` must come from versioned database-backed intelligence snapshots.

Do **not** hardcode current OFR, HMDA, branch, MLO, program, or enforcement counts into page components.

Required operating path for later work:

source refresh
→ ingest
→ validation
→ snapshot rebuild
→ snapshot validation
→ cache revalidation
→ homepage / `/florida` updated automatically

FL-LEND-003 (Florida HMDA Intelligence 2.0) is the next task after Production ingest, idempotency, profile QA, and merge to main. Do not start it in FL-LEND-002D/E.

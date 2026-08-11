# Stage B.1 — QA script

## Flow A — Move → Lender (params bridge)

1. Open a Move city hub (e.g. Miami / Florida destination).
2. In “Continue your Trust journey”, select **I may buy**.
3. Click **Research local lenders**.
4. Confirm Lender URL includes `src=move`, `journey=relocate`, `state=…`, `intent=buy` (and `county` when known).
5. Confirm quiet orientation (“Moving to …” / relocation research).
6. Confirm continue-journey links still carry state/county.

## Flow B — Lender return visit (session)

1. After Flow A, close the tab (or navigate away).
2. Reopen `https://www.lendertrusthub.com/local-lenders` in the **same browser** (no journey params).
3. Expect soft client redirect toward the stored state (and county if stored), with params rebuilt from session.
4. Orientation may show restored relocation context.

## Flow C — Insurance return visit

1. From Move or Lender, hand off to Insurance with destination params.
2. Confirm orientation + destination surface.
3. Reopen `/destinations` without params → soft redirect to stored state when session has state.
4. Buy-intent continue link to Lender still includes context.

## Flow D — No PII / fail soft

1. Confirm `localStorage` key `ath:research-session:v1` has only non-PII fields (no name/email/phone).
2. Block storage (private mode quirks / full disk) — page still loads; handoffs still work via URL when params present.
3. Corrupt or wrong `version` in storage — ignored, no crash.

## Flow E — Params beat session

1. Store session for Florida.
2. Open Lender with explicit `?state=TX&intent=rent`.
3. Orientation and continue links prefer **Texas / rent** (URL wins).
4. Session updates to TX when landing with that richer context.

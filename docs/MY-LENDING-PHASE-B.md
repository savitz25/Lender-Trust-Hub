# My Lending Phase B — Shortlist discipline + save surfaces

**Production:** Lender-Trust-Hub only (`www.lendertrusthub.com`)  
**Storage:** `lth:my-lending:v1` (unchanged key)

## Rules

| Bucket | Cap |
|--------|-----|
| `shortlisted` | **Max 3** per active plan |
| `researching` / `reached_out` / `done` | Not counted toward 3 |

4th shortlist attempt → replace modal (replace one, demote oldest, or save as researching). Never silent drop.

## Surfaces

| Surface | Default status |
|---------|----------------|
| Profile **Save to My Lending** | `shortlisted` (subject to cap) |
| Directory card **Save** | `shortlisted` (subject to cap) |

## Helpers

- `lib/my-lending/shortlist-rules.ts` — `SHORTLIST_CAP`, `gateShortlistAdd`, buckets  
- `lib/my-lending/storage.ts` — `countShortlisted`, `canShortlist`, `shortlistLender`, demote/replace policies  
- `components/my-lending/shortlist-full-panel.tsx`  
- `components/my-lending/save-lender-button.tsx` — Save / In My Lending + manage  
- `components/my-lending/guest-lending-hq.tsx` — Shortlist n/3 + Researching + History  
- `components/LenderCard.tsx` — directory Save  
- Navbar badge = shortlisted count  

## Human tests

1. Save 3 lenders → HQ **3/3**  
2. 4th → modal; still max 3 shortlisted  
3. Directory card Save works  
4. Profile: In My Lending, change status, Remove  
5. Hard refresh → persists  

## Out of scope

Phase C (setup/snapshots/report), Phase D multi-plan, auth merge, compare tray.

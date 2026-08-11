# Stage B.1 — Research Session Continuity

## Goal

Keep lightweight, non-PII relocation/research context as users move between Trust Hubs and return later in the same browser — without accounts, lead capture, or personal data.

## Shared contract

Storage key: `ath:research-session:v1`

```ts
{
  version: 1,
  src?: "move" | "lender" | "insurance" | "ask",
  journey?: "relocate" | "purchase" | "refi" | "coverage",
  state?: string,     // FL or florida
  county?: string,    // miami-dade
  intent?: "buy" | "rent" | "refi" | "unknown",
  housing?: "owner" | "renter",
  updatedAt: string
}
```

Rules:

- Origin-local only (`localStorage`)
- Versioned schema; ignore invalid / stale (90-day max age)
- Fail soft if storage is blocked
- No name / email / phone
- No cross-site cookies required

## Origin-local storage + URL param bridge

Hubs are **different origins**. Each site has its own `localStorage`.

| Continuity case | Mechanism |
|-----------------|-----------|
| Same hub, return visit | Research session restore |
| Hub A → Hub B | Stage A′ **URL params** on handoff links |
| Hub B return visit | Session written when landing with params (or route geo) |

**URL params still win** when present. Session fills gaps. Arriving with richer params updates the local session.

Cross-domain continuity **depends on URL param handoff**. Session storage is for return visits and in-hub continuity; params remain the bridge between domains.

## Implementation map

| Hub | Behavior |
|-----|----------|
| Move | Writes session on destination / intent surfaces (`src=move`, `journey=relocate`) |
| Lender | Params first, session second; soft-land on state/county from session; continue-journey uses merged context |
| Insurance | Same pattern on destinations |
| Ask | Not required for B.1 path generation |

## UX

- No “save account” modal
- Quiet orientation when restored: “Continuing your relocation research for {Place}”
- Users can browse normally without context

## QA script

See `docs/STAGE-B1-QA.md`.

# My TrustHub V2 — Builder 3 Lender Save handoff

Implementation handoff for independent QA only. No production merge/deploy approval.

## Baseline and classification

- Repository: savitz25/Lender-Trust-Hub.
- Branch/worktree: `mth-v2-lender-save-b3`, `C:/Users/Michael.Savitsky/mth-v2-lender-save-b3`.
- Base: `6f75d1c3a3bd639c6919c59fef28e1201d36d2c8` (re-fetched before handoff).
- No overlapping Save PR was found. Other worktrees were preserved.
- Classification: **related defects**, not Move's 12–45-second deferred-provider timer.

Profile and LenderCard render SaveLenderButton directly; no timed module deferral. Its synchronous Save ignored provider loading, so it could write to the guest namespace before auth chose an existing account workspace. Fresh blocked storage caused a null-plan exception (captured failing test). A cloud pull could finish after sign-out and overwrite the active namespace; a queued push could survive sign-out.

Correction: capture a single pending Save intent while authentication/workspace resolution is pending, with accessible feedback and a 15-second recoverable timeout. Navigation cancels the intent; an established owner change rejects it. Provider readiness now includes its existing workspace pull and ignores stale initial auth results. Recheck owner after the cloud await and before push. Return the existing storage error when initial plan persistence fails.

Storage contract remains `lth:my-lending:v1` and `lth:my-lending:v1:user:{userId}`, existing workspace-blob sync, profile slug/path, caps, notes, plans, calculators and comparisons. No backend replacement or research migration. The separate localhost incident was not reconfigured.

## Evidence

Windows, Node 22.18.0/npm 10.9.3, committed lockfile installation; real Chromium through existing agent-browser.
No credentials or real authenticated backend were used.

| Check | Result / evidence type |
| --- | --- |
| B3-01 immediate guest Save | PASS browser component fixture and actual local profile |
| B3-02 persistence/reload | PASS real browser localStorage and actual profile |
| B3-03 duplicates and existing notes | PASS browser + local unit |
| B3-04 delayed loading | PASS delayed auth/workspace fixture; no profile-module timer exists; directory delayed-import journey NOT RUN |
| B3-05 auth resolution | PASS real provider/control/storage/sync with mocked Supabase |
| B3-06 legacy authenticated Save | PASS mocked contract only; real authenticated journey NOT RUN |
| B3-07 navigation/owner race | PASS mocked browser including stale getUser and cloud pull |
| B3-08 honest failure | PASS blocked local storage and retry; module-network failure NOT RUN |
| B3-09 keyboard/mobile | PASS fixture at 1440/390/320 plus actual local profile visual inspection |
| B3-10 boundaries | No signup/auth config, database, Watch/Alerts, parent-account, search, branding or production mutations |

Commands run:
- `npm run check:v2-save`: 3 tests passed.
- `npm run test:v2-save:browser`: browser fixture passed (auth/cloud mocked).
- `npm run test:v2-save:browser -- --provider`: real provider integration passed, Supabase mocked.
- `npm test`: full repository suite passed.
- `npx tsc --noEmit --pretty false --incremental false`: base 0 / head 0 diagnostics; no added/changed/removed diagnostics.
- `npm run lint`: 0 errors / 1 pre-existing warning, identical to baseline. Full JSON diagnostic comparison normalizes roots and line shifts and compares file/rule/severity/message; no additions or removals.
- `npm run build`: passed without changing configuration or pulling secrets.
- `git diff --check`: passed.
- esbuild 0.28.1 is now an explicit test-only dependency; it was already installed transitively at the same version. No dependency upgrade.

Performance evidence: existing synchronous local persistence is retained after identity readiness; nonessential dashboard code was not newly imported. Correct account resolution can show a pending state. No production performance benchmark was performed.
Neither result certifies parent My TrustHub synchronization.

## Independent QA and remaining dependencies

1. Check out the exact PR head named in the PR validation receipt; run `npm ci`.
2. Run `npm run check:v2-save`.
3. Start `npm run qa:v2-save`; use `npm run test:v2-save:browser` with existing agent-browser on PATH (or AGENT_BROWSER_BIN).
4. For provider races, start `npm run qa:v2-save -- --provider`, then `npm run test:v2-save:browser -- --provider`.
5. On the exact preview, use a fresh browser with no account session; open `/lenders/1st-priority-mortgage`, activate Save immediately with Enter, reload, inspect the unchanged storage key, repeat clicks, and inspect at 1440/390/320.
6. Do not sign in, send a magic link, or mutate authenticated records until the backend is independently verified as isolated nonproduction.
7. Preview SHA/state and any access dependency are posted in the PR receipt. A changed runtime requires renewed relevant QA.

Actual local `/lenders/1st-priority-mortgage` guest Save and reload passed; this does not certify the separate localhost incident or a cloud account journey.

Local Save is verified within the evidence environments above. Legacy account Save is **NOT VERIFIED live**. Parent My TrustHub sync is **NOT VERIFIED**. Production mutations: **NONE**.

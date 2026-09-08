# Trust Hub Specialist Search V1 — Lender implementation

Status: Lender reference port. Contractor `697052a4fd2d1ba2ced985c5373315fd16517ed8` and Move `bb7177cdf7eb9c26ffe8c24884212a4f16950d07` reviewed on 2026-09-08.

## Shared experience

Lender locally implements the network question-first shell, one bounded input and Research action, examples, supported advanced filters, visible/removable interpretation, standard result anatomy, structure-derived match reasons, evidence availability, per-result trace, explicit capability states, accessible responsive controls, and privacy-safe normalized analytics. `/ask` remains `noindex,follow`. No runtime dependency on another Hub exists.

## Lender adapter boundary

`lib/ask-lender` remains the specialist brain. It owns institution-only NMLS/LEI identity, HMDA action/type/purpose/property-geography interpretation, deterministic committed-catalog execution, confirmed CFPB bridges, Florida OFR boundaries, counts, compatible comparisons, definitions, and fail-closed conclusions. Natural language interprets; source-backed structured execution establishes facts.

Institution is not branch or MLO. LEI is not NMLS. HMDA property geography is not headquarters, branch location, licensing, or service territory. Application, origination and denial are distinct grains. Complaint is not wrongdoing. “Most” is observed volume order, never best. Missing state rosters never become zero.

## Capability states

HMDA and confirmed institution identity are `KNOWN`; CFPB and Florida OFR linkage are `PARTIAL`; New Jersey RMLA is `REQUEST_ONLY`; California CRMLA is `NOT_ACQUIRED`; Arizona open-search coverage is `PARTIAL`; MLO publication and service-territory inference are `UNSUPPORTED`.

## Safety and portability

Questions are capped at 180 characters, page size is bounded, filters are server-allowlisted, execution occurs only on submit, candidate identity search uses the existing bounded publication index, and public results contain no private MLO data. Raw questions and exact identifiers are not analytics dimensions. Other Hubs should reuse this interaction contract while retaining their own identifier, ontology, evidence, coverage, and query adapters.

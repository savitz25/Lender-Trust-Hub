# Review pass

Separate builder self-review after behavioral tests; not an independent human review. Inspected the complete count source module, parser diff, post-override plan propagation, scalar dispatch, changed renderer, shared filter links and read-only Ask parent payload. Existing lender-ask-v1 fields remain; countEvidence is additive. Raw static sources are bounded, no SQL/network writes/credentials added.

Review fixes: removed now-unreachable legacy count branches from executeAskQuery; preserved county/product/purpose counts through raw-field validation instead of zero-coercing catalog helpers; fixed state-aware denominator labels; guarded unknown conditions and conflicting scope; retained explicit years through structured plans; sanitized unexpected source exceptions. All count UI labels, facts and Trace derive from the same result. Fingerprint in runtime evidence is SHA-256 of canonical JSON.stringify(source); source-oracle.json separately records SHA-256 of original artifact bytes.

The older executeLenderAsk snapshot helper remains used for definitions/evidence/comparison and legacy snapshot unit checks. All customer scalar requests are intercepted by the existing executeAskQuery boundary before that helper. There is no second customer count-planning path.

R1-002 exact identifiers/publication are unchanged and their focused suite passes. The parent adapter was inspected read-only; it consumes the retained headline/body/facts/query/trace fields. No other repository was edited. Existing counts are mortgage observations, not institutions; publication eligibility and pagination do not enter scalar aggregation.

No new official links were constructed. Existing Edit request and typed filter URLs retain the actual geography/action. County comparisons and institution rankings retain their executors; this ticket does not certify their entire methodology or every unsupported dimension.

Final adapter follow-up: a scalar structured plan now inherits omitted raw geography/action/product/purpose/lender-class fields, retains explicit years/ambiguities, and cannot lift a parser refusal. The new focused regression passes; the existing v2 institution-table adapter is unchanged.

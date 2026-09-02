# NJ DOBI regulatory document contract (v1)

Implementation-neutral contract for official New Jersey Department of Banking
and Insurance regulatory documents. LenderTrustHub implements the lender and
depository families in NJ-LEND-001. InsuranceTrustHub may later implement the
same shapes for Division of Insurance sources without modifying this repository.

Version: `nj-dobi-regulatory-document-v1`  
JSON Schema: `data/contracts/nj-dobi-regulatory-document-v1.schema.json`

Insurance entities and insurance orders are not stored in LenderTrustHub.
InsuranceTrustHub is not modified by NJ-LEND-001.

## SOURCE SNAPSHOT

| Field | Meaning |
| --- | --- |
| division | DOBI office or division (OCF, Depository, Division of Insurance). |
| source_family | Dataset family. Lender families: `NJ_DOBI_OCF_ENFORCEMENT`, `NJ_DOBI_DEPOSITORY_ENFORCEMENT`, `NJ_DOBI_FINANCIAL_INSTITUTION_LIST`, `NJ_DOBI_LICENSEE_SEARCH_VERIFICATION`. |
| source_page | Official page key or filename. |
| source_year | Calendar year of the official index, when applicable. |
| source_hash | SHA-256 of the retrieved bytes. |
| coverage_state | `ACQUIRED_COMPLETE`, `ACQUIRED_CURRENT_SNAPSHOT`, `ACQUIRED_PARTIAL_HISTORY`, `PARTIAL_SOURCE_COVERAGE`, `SOURCE_NOT_ACQUIRED`, `SOURCE_ACCESS_BLOCKED`, `SOURCE_AVAILABLE_BY_REQUEST`, `SOURCE_UNVERIFIED`. |
| retrieved_at | Retrieval timestamp. |
| source_as_of | Official as-of or published date when printed on the page. |

A missing year page is `SOURCE_NOT_ACQUIRED`. It is not a finding of zero enforcement.

## SOURCE OCCURRENCE

| Field | Meaning |
| --- | --- |
| index_location | Year, month, heading, or table row. |
| order_number | Official order / docket identifier. Event identifier only. Never an entity identifier. |
| respondent_caption | Official caption as published. |
| action_date | Date printed on the index, if present. |
| document_link | Official PDF or document URL, if present. |
| acquisition_state | `DOCUMENT_DOWNLOADED`, `INDEX_ONLY`, `DOCUMENT_UNAVAILABLE`, `HTTP_404`, `SKIPPED_EXISTING_HASH`. |

An HTML index row without a PDF remains a valid `INDEX_ONLY` event.

## CANONICAL DOCUMENT

| Field | Meaning |
| --- | --- |
| canonical_document_id | Stable document id, normally the content hash. |
| order_number | Official order number when printed on the document or index. |
| content_hash | SHA-256 of the document bytes. |
| document_type | Consent order, final order, OSC, C&D, written agreement, or other official type. |
| effective_date | Effective date when published. |
| source_status | `CURRENT`, `RESCINDED`, `SUPERSEDED`, `UNKNOWN`. |
| text_extraction_state | `EXTRACTED`, `IMAGE_ONLY`, `NOT_ATTEMPTED`, `FAILED`, `UNAVAILABLE`. |

The same PDF served at several URLs is one canonical document and several occurrences.

## REGULATORY EVENT

| Field | Meaning |
| --- | --- |
| event_id | Stable event identity. Preference: official order number; else reference + action date; else content hash + class; else documented fingerprint. |
| event_class | Consent, final, C&D, OSC, revocation, suspension, or other official class. |
| event_status | `FINAL`, `PENDING`, or `UNKNOWN`. OSC and alleged conduct are pending, not final findings. |
| civil_penalty_amount | Civil penalty only. |
| restitution_amount | Restitution only. |
| reimbursement_amount | Refund or reimbursement only. |
| legal_citations | Statute or rule citations when published. |
| effective_date / end_date | Effective and rescinded/end dates when published. |

Amounts are not multiplied across parties on a multi-respondent order.

## PARTY

| Field | Meaning |
| --- | --- |
| party_type | Institution, mortgage company, branch, consumer-finance class, individual MLO, qualified individual, officer, or other official class. Do not collapse classes. |
| legal_name | Official name as published. |
| national_identifier | NMLS, FDIC, RSSD, or NCUA when the official source publishes it. |
| state_identifier | DOBI reference or license number. Stored as `STATE_LICENSE` with `jurisdiction=NJ`. |
| role_in_order | Respondent or other official role. |
| match_status | `EXACT`, `HIGH_CONFIDENCE`, `REVIEW_REQUIRED`, `CONFLICT`, `UNRESOLVED`, `UNSAFE_REJECTED`, `INTERNAL_ONLY_INDIVIDUAL`. |
| public_eligibility | Default `internal_only`. Individuals named in orders are not public directory profiles. |

## Identity rules

Exact matches require an official national identifier, an official state reference already in the graph, or an official source that publishes both. Name-only matching is unsafe and is rejected. An individual’s action is not attached to a company unless the source names the company as a respondent. A branch action is not collapsed into the parent.

## InsuranceTrustHub reuse

A later InsuranceTrustHub ticket may implement this contract for:

- Division of Insurance enforcement
- carrier authorization
- producer licensing
- market-conduct exams
- financial exams
- auto complaint indexes

Those families are out of scope for LenderTrustHub NJ-LEND-001. Do not copy insurance orders into this repository.

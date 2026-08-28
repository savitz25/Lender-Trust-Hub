# FL-LEND-001 — Identity rules (not yet ingested)

One canonical institution. Florida credentials attach; they do not mint `Florida Rocket Mortgage`.

Namespaces stay distinct: NMLS company / NMLS branch / NMLS individual / FL MLD / MLDB / MBR / MBRB / LO / LEI / CERT / NCUA / RSSD.

Classes: MLD, MBR, MLDB, MBRB, LO. Servicer licenses appear in the NMLS roster — store as source classes.

Geography: license ≠ HQ ≠ HMDA county ≠ FDIC branch ≠ mortgage branch.

Relationship authority: NMLS roster `Company Id` + `Branch Id`, and LO `Sponsoring Company ID`, beat name similarity.

Person email/phone: `public_eligible=false` until a later publication policy. Business contact may be profile-eligible later.

No NMLS scrape. No Trust Scores. No /florida. No MLO pages. No HMDA→license inference. No “unlicensed” from missing MLD/MBR.

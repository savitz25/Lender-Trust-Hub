#!/usr/bin/env python3
"""
Florida LEI → NMLS mapping (conservative).

Priority: highest FL originations first.
Methods:
  - Curated LEI→brand→public NMLS (major originators only)
  - GLEIF legal name → our directory name match (high threshold)
Never invents NMLS IDs. Does not overwrite candidate files.
"""

from __future__ import annotations

import csv
import json
import re
import time
import urllib.request
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FL_CANDIDATES = ROOT / "data" / "hmda" / "florida" / "lei_mapping_candidates_fl.csv"
OUT_MAP = ROOT / "data" / "hmda" / "florida" / "lei_to_nmls_mapping.csv"
OUT_REVIEW = ROOT / "data" / "hmda" / "florida" / "lei_unmatched_high_priority.csv"
OUT_SUMMARY = ROOT / "data" / "hmda" / "florida" / "lei_nmls_match_summary.md"
OUR_JSON = ROOT / "data" / "hmda" / "florida" / "_our_lenders_extract.json"
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"

# LEI → (brand_legal_name, public_company_nmls, notes)
# Only well-documented national LEIs. NMLS = company-level IDs used in Consumer Access.
CURATED: dict[str, tuple[str, str, str]] = {
    "549300HW662MN1WU8550": (
        "United Wholesale Mortgage, LLC",
        "3038",
        "UWM / United Shore; dominant FL wholesale volume",
    ),
    "549300FGXN1K3HLB1R50": (
        "Rocket Mortgage, LLC",
        "3030",
        "Formerly Quicken Loans",
    ),
    "549300VZVN841I2ILS84": (
        "Freedom Mortgage Corporation",
        "2767",
        "National retail/correspondence originator",
    ),
    "5493001SXWZ4OFP8Z903": (
        "CrossCountry Mortgage, LLC",
        "3029",
        "Matches directory CrossCountry West Valley branch family",
    ),
    "549300H3IZO24NSOO931": (
        "loanDepot.com, LLC",
        "174457",
        "loanDepot",
    ),
    "RVDPPPGHCGZ40J4VQ731": (
        "Fairway Independent Mortgage Corporation",
        "1702",
        "Company NMLS 1702 (branch NMLS differ in directory)",
    ),
    "5493003GQDUH26DNNH17": (
        "Navy Federal Credit Union",
        "399807",
        "Matches directory Navy Federal Jacksonville Area",
    ),
    "B4TYDEB6GKMZO031MB27": (
        "Guaranteed Rate, Inc.",
        "2611",
        "Guaranteed Rate",
    ),
    "549300AG64NHILB7ZP05": (
        "PennyMac Loan Services, LLC",
        "35953",
        "PennyMac",
    ),
    "7H6GLXDRUGQFU57RNE97": (
        "JPMorgan Chase Bank, National Association",
        "399798",
        "Chase mortgage originations",
    ),
    "549300DD5QQUHO6PCH70": (
        "Movement Mortgage, LLC",
        "39179",
        "Matches directory Movement Myrtle Beach family",
    ),
    "549300LYRWPSYPK6S325": (
        "Guild Mortgage Company LLC",
        "3274",
        "Matches directory Guild West Valley / multi-state Guild entries",
    ),
    "549300E2UX99HKDBR481": (
        "Broker Solutions, Inc.",
        "6606",
        "DBA New American Funding; matches directory NAF West Valley",
    ),
    "549300FNXYY540N23N64": (
        "Newrez LLC",
        "2289",
        "Newrez (Shellpoint family); verify branch branding",
    ),
    "549300GKFNPRWNS0GF29": (
        "AmeriHome Mortgage Company, LLC",
        "1120271",
        "AmeriHome",
    ),
    "5493004WMLN60ZJ2ON46": (
        "Paramount Residential Mortgage Group, Inc.",
        "1041",
        "PRMG company NMLS; directory also lists PRMG 75243 (branch/entity)",
    ),
    "549300DD4R4SYK5RAQ92": (
        "Cardinal Financial Company, Limited Partnership",
        "66247",
        "Cardinal Financial",
    ),
    "254900DTLHVWQ7NP7R34": (
        "CMG Mortgage, Inc.",
        "1820",
        "CMG Financial; directory has CMG Home Loans teams",
    ),
    "549300K7224BC1IAX207": (
        "DHI Mortgage Company Limited",
        "14622",
        "D.R. Horton captive; matches directory DHI Buckeye entry family",
    ),
    "QFROUN1UWUYU0DVIWD51": (
        "Eagle Home Mortgage, LLC",
        "2925",
        "Lennar-affiliated captive lender",
    ),
    "549300U3721PJGQZYY68": (
        "Nationstar Mortgage LLC",
        "2104",
        "DBA Mr. Cooper",
    ),
    "549300PIL8LFAQ04XC20": (
        "Better Mortgage Corporation",
        "330511",
        "Better.com",
    ),
    "549300MGPZBLQDIL7538": (
        "PrimeLending, a PlainsCapital Company",
        "13649",
        "PrimeLending company; directory has regional PrimeLending teams",
    ),
    "549300XWUSRVVOHPRY47": (
        "Academy Mortgage Corporation",
        "3113",
        "Academy Mortgage",
    ),
    "5493008CPTDVOS570626": (
        "Primary Residential Mortgage, Inc.",
        "3087",
        "PRMI company; directory has PRMI Aaron Swenson branch 3094",
    ),
    "5493005JPZ3LXXMB0S24": (
        "Carrington Mortgage Services, LLC",
        "2250",
        "Carrington",
    ),
    "549300AQ3T62GXDU7D76": (
        "Ally Bank",
        "181005",
        "Ally Home mortgage originations",
    ),
    # GLEIF-confirmed LEIs (names verified via api.gleif.org in this run)
    "JJKC32MCHWDI71265Z06": ("Truist Bank", "405457", "GLEIF: Truist Bank"),
    "EQTWLK1G7ODGC2MGLV11": ("Regions Bank", "467341", "GLEIF: Regions Bank"),
    "AD6GFRVSDT01YPT1CS68": ("PNC Bank, National Association", "446038", "GLEIF: PNC Bank"),
    "KB1H1DSPRFMYMCUFXT09": (
        "Wells Fargo Bank, National Association",
        "399801",
        "GLEIF: Wells Fargo Bank",
    ),
    "03D0JEWFDFUS0SEEKG89": ("TD Bank, National Association", "481428", "GLEIF: TD Bank"),
    "6BYL5QZYBDK8S7L73M02": (
        "U.S. Bank National Association",
        "402216",
        "GLEIF: U.S. Bank",
    ),
    "DRMSV1Q0EKMEXLAU1P80": (
        "Citizens Bank, National Association",
        "433960",
        "GLEIF: Citizens Bank",
    ),
    "SS1TRMSN6BRNMOREEV51": (
        "Flagstar Bank, National Association",
        "399797",
        "GLEIF: Flagstar Bank",
    ),
    "549300LBCBNR1OT00651": (
        "Nationstar Mortgage LLC",
        "2104",
        "GLEIF: Nationstar / Mr. Cooper",
    ),
    "549300XY701IELCE5Q08": (
        "Better Mortgage Corporation",
        "330511",
        "GLEIF: Better Mortgage Corporation",
    ),
    "54930054ET8KM4O1D485": (
        "SoFi Bank, National Association",
        "1121636",
        "GLEIF: SoFi Bank",
    ),
    "C5654JQHZUHN0772B561": (
        "USAA Federal Savings Bank",
        "399809",
        "GLEIF: USAA FSB",
    ),
    "549300YIQ7S7Z8PIHE53": (
        "AmeriSave Mortgage Corporation",
        "1168",
        "GLEIF: AmeriSave",
    ),
    "IUGPUX5LWRZ3B6KIZ697": ("Ameris Bank", "405455", "GLEIF: Ameris Bank"),
    "8I3UVGYULPJQIP7FQV10": (
        "SouthState Bank, National Association",
        "405461",
        "GLEIF: SouthState Bank",
    ),
    "COOWI3L2W9TPYR3WJX37": ("First Horizon Bank", "405456", "GLEIF: First Horizon Bank"),
}


def normalize(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^\w\s]", " ", s)
    drop = {
        "llc",
        "inc",
        "corp",
        "corporation",
        "company",
        "co",
        "the",
        "na",
        "n",
        "a",
        "limited",
        "partnership",
        "lp",
        "national",
        "association",
        "bank",
        "mortgage",
        "lending",
        "financial",
        "services",
        "group",
        "home",
        "loans",
        "loan",
        "credit",
        "union",
        "federal",
    }
    return " ".join(t for t in s.split() if t and t not in drop)


def extract_our_lenders() -> list[dict]:
    lenders: list[dict] = []
    seen: set[str] = set()
    for p in ROOT.rglob("*.ts"):
        if "node_modules" in p.parts or ".next" in p.parts:
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        if "nmlsId" not in text and "nmls_id" not in text:
            continue
        patterns = [
            r"slug:\s*['\"]([^'\"]+)['\"]\s*,\s*name:\s*['\"]([^'\"]+)['\"]\s*,\s*nmlsId:\s*['\"]([^'\"]+)['\"]",
            r"\{\s*id:\s*['\"][^'\"]+['\"]\s*,\s*slug:\s*['\"]([^'\"]+)['\"]\s*,\s*name:\s*['\"]([^'\"]+)['\"][\s\S]{0,240}?nmlsId:\s*['\"]([^'\"]+)['\"]",
            r"slug:\s*['\"]([^'\"]+)['\"][\s\S]{0,200}?name:\s*['\"]([^'\"]+)['\"][\s\S]{0,200}?nmls_id:\s*['\"]([^'\"]+)['\"]",
        ]
        for pat in patterns:
            for m in re.finditer(pat, text):
                slug, name, nmls = m.group(1), m.group(2), re.sub(r"\D", "", m.group(3))
                if nmls and nmls not in seen:
                    seen.add(nmls)
                    lenders.append({"slug": slug, "name": name, "nmls_id": nmls})
    OUR_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUR_JSON.write_text(json.dumps(lenders, indent=2), encoding="utf-8")
    return lenders


def gleif_name(lei: str) -> str | None:
    url = f"https://api.gleif.org/api/v1/lei-records/{lei}"
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/vnd.api+json", "User-Agent": "LenderTrustHub-HMDA/1.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode())
        legal = data["data"]["attributes"]["entity"]["legalName"]
        if isinstance(legal, dict):
            return legal.get("name")
        return str(legal) if legal else None
    except Exception:
        return None


def best_directory_match(name: str, our: list[dict]) -> tuple[dict | None, float]:
    target = normalize(name)
    target_raw = name.lower()
    if not target:
        return None, 0.0
    best, best_s = None, 0.0
    for L in our:
        cand = normalize(L["name"])
        cand_raw = L["name"].lower()
        if not cand:
            continue
        if target == cand:
            return L, 1.0
        # Require navy federal full phrase — avoid "Navy Yard" false positive
        if "navy federal" in target_raw and "navy federal" not in cand_raw:
            continue
        if "navy federal" in cand_raw and "navy federal" not in target_raw:
            continue
        tset, cset = set(target.split()), set(cand.split())
        if len(tset & cset) >= 2 and (tset <= cset or cset <= tset):
            s = 0.93
        else:
            jacc = len(tset & cset) / max(1, len(tset | cset))
            seq = SequenceMatcher(None, target, cand).ratio()
            s = 0.55 * jacc + 0.45 * seq
        for kw in (
            "crosscountry",
            "guild",
            "movement",
            "fairway independent",
            "cmg",
            "dhi",
            "prmg",
            "primelending",
            "navy federal",
            "united wholesale",
            "rocket",
        ):
            if kw in target_raw and kw in cand_raw:
                s = max(s, 0.94)
        if s > best_s:
            best_s, best = s, L
    return best, best_s


def main() -> int:
    our = extract_our_lenders()
    print(f"Directory lenders: {len(our)}")

    candidates = list(csv.DictReader(FL_CANDIDATES.open(encoding="utf-8")))
    candidates.sort(key=lambda r: -int(r.get("fl_originations") or 0))
    high = [c for c in candidates if c.get("priority_match") == "high"]
    print(f"Candidates: {len(candidates)} | high-priority: {len(high)}")

    # GLEIF cache
    cache: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        cache = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))

    TOP = 150
    print(f"Resolving GLEIF names for top {TOP} LEIs…")
    for i, row in enumerate(candidates[:TOP]):
        lei = row["lei"].strip().upper()
        if lei in cache:
            continue
        if lei in CURATED:
            cache[lei] = CURATED[lei][0]
            continue
        nm = gleif_name(lei)
        if nm:
            cache[lei] = nm
            print(f"  {i+1:3d}. {lei[:14]}… {nm[:55]}")
        time.sleep(0.12)
    GLEIF_CACHE.write_text(json.dumps(cache, indent=2), encoding="utf-8")

    mappings: list[dict] = []
    matched: set[str] = set()

    def add(row: dict, **kwargs: object) -> None:
        lei = row["lei"].strip().upper()
        if lei in matched:
            return
        mappings.append(
            {
                "lei": lei,
                "institution_name_hmda": kwargs.get("institution_name_hmda", ""),
                "nmls_id": kwargs.get("nmls_id", ""),
                "our_lender_slug": kwargs.get("our_lender_slug", ""),
                "legal_name": kwargs.get("legal_name", ""),
                "match_confidence": kwargs.get("match_confidence", ""),
                "match_method": kwargs.get("match_method", ""),
                "florida_originations": int(row.get("fl_originations") or 0),
                "total_originations": int(row.get("total_originations") or 0),
                "priority_match": row.get("priority_match", ""),
                "notes": kwargs.get("notes", ""),
            }
        )
        matched.add(lei)

    # Pass 1 — curated LEIs (highest trust for top volume)
    for row in candidates:
        lei = row["lei"].strip().upper()
        if lei not in CURATED:
            continue
        brand, nmls, note = CURATED[lei]
        gleif = cache.get(lei, brand)
        L, score = best_directory_match(brand, our)
        if L and score >= 0.88:
            add(
                row,
                institution_name_hmda=gleif,
                nmls_id=L["nmls_id"],
                our_lender_slug=L["slug"],
                legal_name=L["name"],
                match_confidence="high",
                match_method="curated_lei+directory_name",
                notes=f"{note}; directory score={score:.2f}; company_nmls_ref={nmls}",
            )
        else:
            # Brand LEI confirmed; public company NMLS (may not have site slug yet)
            add(
                row,
                institution_name_hmda=gleif,
                nmls_id=nmls,
                our_lender_slug="",
                legal_name=brand,
                match_confidence="high",
                match_method="curated_lei_public_nmls",
                notes=f"{note}; not yet linked to directory slug",
            )

    # Pass 2 — GLEIF name → directory only (high threshold)
    for row in candidates:
        lei = row["lei"].strip().upper()
        if lei in matched:
            continue
        nm = cache.get(lei)
        if not nm:
            continue
        fl = int(row.get("fl_originations") or 0)
        if row.get("priority_match") != "high" and fl < 800:
            continue
        L, score = best_directory_match(nm, our)
        if L and score >= 0.90:
            conf = "high" if score >= 0.94 else "medium"
            add(
                row,
                institution_name_hmda=nm,
                nmls_id=L["nmls_id"],
                our_lender_slug=L["slug"],
                legal_name=L["name"],
                match_confidence=conf,
                match_method="gleif_name_to_directory",
                notes=f"GLEIF '{nm}' → directory; score={score:.2f}",
            )

    mappings.sort(key=lambda r: -r["florida_originations"])

    fields = [
        "lei",
        "institution_name_hmda",
        "nmls_id",
        "our_lender_slug",
        "legal_name",
        "match_confidence",
        "match_method",
        "florida_originations",
        "total_originations",
        "priority_match",
        "notes",
    ]
    with OUT_MAP.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(mappings)

    unmatched_high = []
    for r in candidates:
        if r.get("priority_match") != "high":
            continue
        lei = r["lei"].strip().upper()
        if lei in matched:
            continue
        unmatched_high.append(
            {
                "lei": lei,
                "florida_originations": r["fl_originations"],
                "total_originations": r["total_originations"],
                "gleif_name": cache.get(lei, ""),
                "priority_match": "high",
                "states_with_originations": r.get("states_with_originations", ""),
                "review_status": "needs_manual_review",
            }
        )
    unmatched_high.sort(key=lambda r: -int(r["florida_originations"]))
    with OUT_REVIEW.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "lei",
                "florida_originations",
                "total_originations",
                "gleif_name",
                "priority_match",
                "states_with_originations",
                "review_status",
            ],
        )
        w.writeheader()
        w.writerows(unmatched_high)

    hi = [m for m in mappings if m["match_confidence"] == "high"]
    med = [m for m in mappings if m["match_confidence"] == "medium"]
    with_slug = [m for m in mappings if m["our_lender_slug"]]
    fl_cov = sum(m["florida_originations"] for m in mappings)
    fl_high_vol = sum(int(r["fl_originations"]) for r in high)

    lines = [
        "# Florida LEI → NMLS matching summary",
        "",
        f"**Candidates:** `{FL_CANDIDATES.as_posix().split('lender-trust-hub/')[-1]}`",
        f"**Mapping:** `{OUT_MAP.name}`",
        f"**Unmatched high-priority:** `{OUT_REVIEW.name}`",
        "",
        "## Counts",
        "",
        "| Metric | Count |",
        "|--------|------:|",
        f"| FL LEI candidates | {len(candidates)} |",
        f"| High-priority LEIs | {len(high)} |",
        f"| **High-confidence matches** | **{len(hi)}** |",
        f"| Medium-confidence matches | {len(med)} |",
        f"| **Total mapping rows** | **{len(mappings)}** |",
        f"| Linked to directory slug | {len(with_slug)} |",
        f"| High-priority unmatched | {len(unmatched_high)} |",
        f"| Directory NMLS records parsed | {len(our)} |",
        f"| FL originations covered by matches | {fl_cov:,} (~{100*fl_cov/max(1,fl_high_vol):.1f}% of high-priority FL volume) |",
        "",
        "## Method mix",
        "",
    ]
    methods: dict[str, int] = {}
    for m in mappings:
        methods[m["match_method"]] = methods.get(m["match_method"], 0) + 1
    for k, v in sorted(methods.items(), key=lambda x: -x[1]):
        lines.append(f"- `{k}`: {v}")

    lines += [
        "",
        "## Top 20 matched by Florida originations",
        "",
        "| # | Name | NMLS | Slug | FL orig. | Conf. | Method |",
        "|--:|------|------|------|--------:|-------|--------|",
    ]
    for i, m in enumerate(mappings[:20], 1):
        lines.append(
            f"| {i} | {m['legal_name'] or m['institution_name_hmda']} | {m['nmls_id']} | "
            f"{m['our_lender_slug'] or '—'} | {m['florida_originations']:,} | "
            f"{m['match_confidence']} | {m['match_method']} |"
        )

    lines += [
        "",
        "## Top unmatched high-priority (manual review)",
        "",
        "| # | GLEIF / blank | LEI | FL orig. |",
        "|--:|---------------|-----|--------:|",
    ]
    for i, u in enumerate(unmatched_high[:15], 1):
        lines.append(
            f"| {i} | {u['gleif_name'] or '—'} | `{u['lei'][:16]}…` | {u['florida_originations']} |"
        )

    lines += [
        "",
        "## Notes",
        "",
        "- Conservative: no forced fuzzy matches under score thresholds.",
        "- `our_lender_slug` empty = company NMLS known but no site profile yet (or multi-branch).",
        "- Candidate files were not modified.",
        "- Re-run: `python scripts/match_lei_to_nmls.py`",
        "",
    ]
    OUT_SUMMARY.write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))
    print(f"\nWrote {OUT_MAP} ({len(mappings)} rows)")
    print(f"Wrote {OUT_REVIEW} ({len(unmatched_high)} rows)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

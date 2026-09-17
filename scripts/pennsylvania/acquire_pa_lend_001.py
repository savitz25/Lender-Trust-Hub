#!/usr/bin/env python3
"""Acquire PA-LEND-001 supporting artifacts: CFPB 2025 PA mortgage IDs, DoBS Coveo orders, PHFA list."""
from __future__ import annotations

import json
import re
import ssl
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data/pennsylvania/pa-lend-001/raw"
OUT = ROOT / "data/pennsylvania/pa-lend-001"
UA = "LenderTrustHub/pa-lend-001 (research; +https://www.lendertrusthub.com)"
CTX = ssl.create_default_context()
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_json(url: str, headers: dict | None = None, data: bytes | None = None) -> dict:
    req = urllib.request.Request(url, data=data, headers={"User-Agent": UA, "Accept": "application/json", **(headers or {})})
    with urllib.request.urlopen(req, context=CTX, timeout=90) as r:
        return json.loads(r.read().decode("utf-8"))


def acquire_cfpb() -> dict:
    ids: list[str] = []
    rows: list[dict] = []
    frm = 0
    size = 100
    total = None
    while True:
        qs = urllib.parse.urlencode(
            {
                "frm": frm,
                "size": size,
                "product": "Mortgage",
                "state": "PA",
                "date_received_min": "2025-01-01",
                "date_received_max": "2025-12-31",
            }
        )
        url = f"https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/?{qs}"
        payload = get_json(url)
        hits = payload.get("hits", {})
        total_obj = hits.get("total") or {}
        if total is None:
            total = total_obj.get("value") if isinstance(total_obj, dict) else total_obj
        batch = hits.get("hits") or []
        if not batch:
            break
        for h in batch:
            src = h.get("_source") or {}
            cid = str(src.get("complaint_id") or h.get("_id") or "")
            if not cid:
                continue
            ids.append(cid)
            rows.append(
                {
                    "complaint_id": cid,
                    "date_received": src.get("date_received"),
                    "product": src.get("product"),
                    "sub_product": src.get("sub_product"),
                    "issue": src.get("issue"),
                    "sub_issue": src.get("sub_issue"),
                    "company": src.get("company"),
                    "state": src.get("state"),
                    "zip_code": src.get("zip_code"),
                    "company_response": src.get("company_response"),
                    "timely": src.get("timely"),
                    "consumer_disputed": src.get("consumer_disputed"),
                    "has_narrative": bool(src.get("complaint_what_happened")),
                }
            )
        frm += len(batch)
        if frm >= int(total or 0):
            break
        time.sleep(0.15)
    ids = sorted(set(ids))
    report = {
        "retrievedAt": NOW,
        "source": "CFPB Consumer Complaint Database API",
        "product": "Mortgage",
        "state": "PA",
        "period": "2025-01-01/2025-12-31",
        "calendar_year": 2025,
        "period_complete": True,
        "api_total": total,
        "rows_acquired": len(rows),
        "distinct_ids": len(ids),
        "narratives_stored": 0,
        "complaint_is_not_finding": True,
        "company_name_is_not_nmls": True,
    }
    (OUT / "cfpb-2025-pa-mortgage-ids.json").write_text(json.dumps({"ids": ids, "meta": report}, indent=2), encoding="utf-8")
    (OUT / "cfpb-2025-pa-mortgage-rows.json").write_text(json.dumps({"rows": rows, "meta": report}, indent=2), encoding="utf-8")
    print("CFPB", report)
    return report


def acquire_coveo() -> dict:
    token = "xx4e57cda9-3464-437d-9375-b947ca6b72c8"
    org = "commonwealthofpennsylvaniaproductiono8jd9ckm"
    url = f"https://{org}.org.coveo.com/rest/search/v2"
    first = 0
    results: list[dict] = []
    total = None
    while True:
        body = json.dumps(
            {
                "q": "",
                "searchHub": "DOBS-Enforcement Orders",
                "numberOfResults": 100,
                "firstResult": first,
                "sortCriteria": "date descending",
                "fieldsToInclude": [
                    "title",
                    "uri",
                    "clickableuri",
                    "date",
                    "filetype",
                    "copapwpdocketnumber",
                    "copapwpdatefiled",
                    "copapwpactiontaken",
                    "copapwpprogramarea",
                    "copapwpissueyear",
                    "copapwpissuemonth",
                    "sysfiletype",
                    "sysuri",
                    "author",
                ],
            }
        ).encode("utf-8")
        payload = get_json(url, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, data=body)
        if total is None:
            total = payload.get("totalCount")
        batch = payload.get("results") or []
        if not batch:
            break
        for item in batch:
            raw = item.get("raw") or {}
            results.append(
                {
                    "title": item.get("title"),
                    "uri": item.get("uri") or raw.get("clickableuri") or raw.get("sysuri"),
                    "date": item.get("raw", {}).get("date") or item.get("raw", {}).get("sysdate"),
                    "docket": raw.get("copapwpdocketnumber"),
                    "date_filed": raw.get("copapwpdatefiled"),
                    "action_taken": raw.get("copapwpactiontaken"),
                    "program_area": raw.get("copapwpprogramarea"),
                    "issue_year": raw.get("copapwpissueyear"),
                    "issue_month": raw.get("copapwpissuemonth"),
                    "filetype": raw.get("sysfiletype") or raw.get("filetype"),
                    "excerpt": (item.get("excerpt") or "")[:240],
                }
            )
        first += len(batch)
        if first >= int(total or 0):
            break
        if first > 5000:
            break
        time.sleep(0.1)
    (OUT / "dobs-enforcement-catalog.json").write_text(json.dumps({"retrievedAt": NOW, "totalCount": total, "rows": results}, indent=2), encoding="utf-8")
    print("COVEO total", total, "rows", len(results))
    return {"totalCount": total, "rows": len(results), "retrievedAt": NOW}


SKIP_PHFA = re.compile(
    r"^(participating lenders|report last updated|click to|legend|conventional|government|assistance|refinance|"
    r"khl|hfa|kgov|fha|va|rd|adv|access|mod|streamline|repair|purchase|improv|home|style|kflex|kfit|"
    r"p & i|kdate|page\s*\d+|x+$|\*+\s*$|\(\s*x\s*\)|phone|lender$)",
    re.I,
)


def acquire_phfa() -> dict:
    reader = PdfReader(str(RAW / "phfa-full.pdf"))
    text = "\n".join((p.extract_text() or "") for p in reader.pages)
    names: list[str] = []
    buf = ""
    for raw_line in text.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip(" \t*-")
        if not line or SKIP_PHFA.match(line):
            continue
        if re.fullmatch(r"[\sX\(\)\*]+", line, re.I):
            continue
        if line.lower().startswith("click to"):
            continue
        cleaned = re.sub(r"\s+X(?:\s+X)*\s*$", "", line).strip(" *")
        cleaned = re.sub(r"\s*\(\s*X\s*\)\s*", " ", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip(" *")
        if not cleaned or SKIP_PHFA.match(cleaned) or len(cleaned) < 3:
            if buf and not SKIP_PHFA.match(buf) and len(buf) > 3:
                names.append(buf)
                buf = ""
            continue
        if cleaned.endswith((",", "LLC", "Inc", "Inc.", "Corp", "Corp.", "Company", "NA", "N.A.", "LP", "L.P.")):
            buf = (buf + " " + cleaned).strip() if buf else cleaned
            continue
        if buf:
            names.append((buf + " " + cleaned).strip())
            buf = ""
        else:
            names.append(cleaned)
    if buf and len(buf) > 3:
        names.append(buf)
    # collapse obvious header residue
    keep = []
    for n in names:
        n = re.sub(r"\s+\d+Page$", "", n).strip()
        if SKIP_PHFA.match(n) or n.lower() in {"page", "legend"}:
            continue
        if "participating lenders" in n.lower() or "report last updated" in n.lower():
            continue
        keep.append(n)
    distinct = sorted(set(keep), key=str.lower)
    report = {
        "retrievedAt": NOW,
        "sourceUrl": "https://www.phfa.org/forms/participating_lenders/pl_fulllist.pdf",
        "sourceUpdatedAt": "2026-09-17T11:55:08",
        "pages": len(reader.pages),
        "rows": keep,
        "row_count": len(keep),
        "distinct_names": distinct,
        "distinct_count": len(distinct),
        "phfa_is_not_dobs_license": True,
        "top_designation_is_not_trusthub_ranking": True,
        "statewide_origination": True,
    }
    (OUT / "phfa-participating-lenders.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print("PHFA rows", len(keep), "distinct", len(distinct))
    return report


def acquire_open_data() -> dict:
    url = "https://data.pa.gov/api/catalog/v1?search_context=data.pa.gov&q=non-depository%20licensee%20banking"
    try:
        payload = get_json(url)
    except Exception as exc:  # noqa: BLE001
        payload = {"error": str(exc)}
    (OUT / "pa-open-data-catalog-probe.json").write_text(json.dumps(payload, indent=2)[:200000], encoding="utf-8")
    results = payload.get("results") or []
    titles = []
    for r in results[:30]:
        res = r.get("resource") or {}
        titles.append({"name": res.get("name"), "id": res.get("id"), "attribution": res.get("attribution")})
    print("OPEN_DATA hits", len(results), titles[:8])
    return {"hits": len(results), "titles": titles, "retrievedAt": NOW}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    cfpb = acquire_cfpb()
    coveo = acquire_coveo()
    phfa = acquire_phfa()
    open_data = acquire_open_data()
    report = {"retrievedAt": NOW, "cfpb": {k: v for k, v in cfpb.items() if k != "ids"}, "coveo": coveo, "phfa": {k: v for k, v in phfa.items() if k not in {"rows", "distinct_names"}}, "open_data": open_data}
    (OUT / "acquire-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print("DONE", report)


if __name__ == "__main__":
    main()

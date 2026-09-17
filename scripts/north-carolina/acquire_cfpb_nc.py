#!/usr/bin/env python3
from __future__ import annotations

import json
import ssl
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "data/north-carolina/nc-lend-001"
UA = "LenderTrustHub/nc-lend-001 (research; +https://www.lendertrusthub.com)"
CTX = ssl.create_default_context()
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, context=CTX, timeout=90) as r:
        return json.loads(r.read().decode("utf-8"))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    ids: list[str] = []
    rows: list[dict] = []
    total = None
    # frm/from does not paginate this API; month slices do (same as PA-LEND-001).
    months = [
        ("2025-01-01", "2025-01-15"),
        ("2025-01-16", "2025-01-31"),
        ("2025-02-01", "2025-02-14"),
        ("2025-02-15", "2025-02-28"),
        ("2025-03-01", "2025-03-15"),
        ("2025-03-16", "2025-03-31"),
        ("2025-04-01", "2025-04-15"),
        ("2025-04-16", "2025-04-30"),
        ("2025-05-01", "2025-05-15"),
        ("2025-05-16", "2025-05-31"),
        ("2025-06-01", "2025-06-15"),
        ("2025-06-16", "2025-06-30"),
        ("2025-07-01", "2025-07-15"),
        ("2025-07-16", "2025-07-31"),
        ("2025-08-01", "2025-08-15"),
        ("2025-08-16", "2025-08-31"),
        ("2025-09-01", "2025-09-15"),
        ("2025-09-16", "2025-09-30"),
        ("2025-10-01", "2025-10-15"),
        ("2025-10-16", "2025-10-31"),
        ("2025-11-01", "2025-11-15"),
        ("2025-11-16", "2025-11-30"),
        ("2025-12-01", "2025-12-15"),
        ("2025-12-16", "2025-12-31"),
    ]
    qs0 = urllib.parse.urlencode(
        {
            "size": 1,
            "product": "Mortgage",
            "state": "NC",
            "date_received_min": "2025-01-01",
            "date_received_max": "2025-12-31",
        }
    )
    head = get_json(
        f"https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/?{qs0}"
    )
    total_obj = (head.get("hits") or {}).get("total") or {}
    total = total_obj.get("value") if isinstance(total_obj, dict) else total_obj
    seen: set[str] = set()
    for start, end in months:
        qs = urllib.parse.urlencode(
            {
                "size": 100,
                "product": "Mortgage",
                "state": "NC",
                "date_received_min": start,
                "date_received_max": end,
            }
        )
        url = f"https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/?{qs}"
        payload = get_json(url)
        batch = (payload.get("hits") or {}).get("hits") or []
        for h in batch:
            src = h.get("_source") or {}
            cid = str(src.get("complaint_id") or h.get("_id") or "")
            if not cid or cid in seen:
                continue
            seen.add(cid)
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
                    "has_narrative": bool(src.get("complaint_what_happened")),
                }
            )
        print("cfpb", start, "batch", len(batch), "unique", len(seen), flush=True)
        time.sleep(0.2)
    ids = sorted(set(ids))
    report = {
        "retrievedAt": NOW,
        "source": "CFPB Consumer Complaint Database API",
        "product": "Mortgage",
        "state": "NC",
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
    (OUT / "cfpb-2025-nc-mortgage-ids.json").write_text(
        json.dumps({"ids": ids, "meta": report}, indent=2) + "\n", encoding="utf-8"
    )
    (OUT / "cfpb-2025-nc-mortgage-rows.json").write_text(
        json.dumps(rows, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()

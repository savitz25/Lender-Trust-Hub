#!/usr/bin/env python3
"""Parse downloaded NYDFS HTML into bulletin/enforcement summaries + CFPB/FDIC/HMDA."""
from __future__ import annotations

import csv
import json
import re
import ssl
import urllib.request
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "artifacts" / "ny-lend-001"


class TableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_td = self.in_th = False
        self.cell = ""
        self.href = None
        self.row: list[tuple[str, str | None]] = []
        self.rows: list[list[tuple[str, str | None]]] = []

    def handle_starttag(self, tag, attrs):
        if tag in {"td", "th"}:
            self.in_td = tag == "td"
            self.in_th = tag == "th"
            self.cell = ""
            self.href = None
        elif tag == "a" and (self.in_td or self.in_th):
            self.href = dict(attrs).get("href")

    def handle_endtag(self, tag):
        if tag in {"td", "th"}:
            self.row.append((re.sub(r"\s+", " ", self.cell).strip(), self.href))
            self.in_td = self.in_th = False
        elif tag == "tr":
            if self.row:
                self.rows.append(self.row)
            self.row = []

    def handle_data(self, data):
        if self.in_td or self.in_th:
            self.cell += data


def classify(h: str) -> str | None:
    t = re.sub(r"\s+", " ", h).lower()
    if "mortgage loan originat" in t and "approv" in t:
        return "mlo_approval"
    if "mortgage loan originat" in t and "withdraw" in t:
        return "mlo_withdrawal"
    if "article 12-e applications received" in t or ("mortgage loan originat" in t and "application" in t and "approv" not in t and "withdraw" not in t):
        return "mlo_application_received"
    if "branch" in t and "mortgage banker" in t and "surrender" in t:
        return "banker_branch_surrendered"
    if "branch" in t and "mortgage banker" in t and ("issued" in t or "license issued" in t):
        return "banker_branch_issued"
    if "branch" in t and "mortgage broker" in t and "surrender" in t:
        return "broker_branch_surrendered"
    if "branch" in t and "mortgage broker" in t and ("issued" in t or "certificate issued" in t):
        return "broker_branch_issued"
    if "mortgage banker" in t and "surrender" in t:
        return "banker_surrendered"
    if "mortgage banker" in t and ("license issued" in t or "issued to engage" in t):
        return "banker_issued"
    if "mortgage broker" in t and "surrender" in t:
        return "broker_surrendered"
    if "mortgage broker" in t and ("certificate issued" in t or "issued to engage" in t):
        return "broker_issued"
    if "mortgage loan servicer" in t and "surrender" in t:
        return "servicer_surrendered"
    if "mortgage loan servicer" in t and ("issued" in t or "registration" in t):
        return "servicer_issued"
    if "inactive" in t and "mortgage" in t:
        return "broker_inactive"
    if "mortgage" in t and ("address change" in t or "name change" in t):
        return "address_or_name_change"
    if "mortgage" in t and ("application" in t or "received" in t or "control" in t):
        return "other_mortgage_application"
    if "mortgage banker" in t or "mortgage broker" in t or "mortgage loan" in t:
        return "other_mortgage"
    return None


def count_table_rows(chunk: str) -> int:
    m = re.search(r"<tbody>(.*?)</tbody>", chunk, re.I | re.S)
    if not m:
        return 0
    return len(re.findall(r"<tr\b", m.group(1), re.I))


def count_codes(chunk: str) -> int:
    return len(re.findall(r"\((MB|BR|MS)-MBD\)", chunk))


def parse_bulletin_html(html: str, slug: str) -> list[dict]:
    events = []
    # headings as <strong> or <p><strong>
    matches = list(re.finditer(r"<strong>([^<]{10,400})</strong>", html, re.I))
    for i, m in enumerate(matches):
        heading = re.sub(r"&nbsp;", " ", m.group(1))
        heading = re.sub(r"\s+", " ", heading).strip()
        kind = classify(heading)
        if not kind:
            continue
        nxt = matches[i + 1].start() if i + 1 < len(matches) else min(len(html), m.end() + 8000)
        chunk = html[m.end() : nxt]
        table_n = count_table_rows(chunk)
        code_n = count_codes(chunk)
        if kind.startswith("mlo_"):
            n = table_n
        else:
            n = code_n if code_n else table_n
        events.append({"bulletin": slug, "heading": heading[:240], "kind": kind, "count": n})
    return events


def hmda_ny() -> dict:
    rows = list(csv.DictReader((ROOT / "data/hmda/by-state/NY/county_market_summary.csv").open(encoding="utf-8")))
    def s(k):
        return sum(int(r.get(k) or 0) for r in rows)
    apps, orig, den = s("total_applications"), s("total_originations"), s("denial_count")
    purch, refi, other = s("purchase_count"), s("refinance_count"), s("purpose_other_count")
    conv, fha, va, usda = s("apps_conventional"), s("apps_fha"), s("apps_va"), s("apps_usda_other")
    return {
        "counties": len(rows),
        "applications": apps,
        "originations": orig,
        "denials": den,
        "denial_rate_pct": round(den / apps * 100, 2) if apps else None,
        "purchase_applications": purch,
        "refinance_applications": refi,
        "purpose_other_applications": other,
        "purchase_pct_of_apps": round(purch / apps * 100, 2) if apps else None,
        "refinance_pct_of_apps": round(refi / apps * 100, 2) if apps else None,
        "purpose_other_pct_of_apps": round(other / apps * 100, 2) if apps else None,
        "apps_conventional": conv,
        "apps_fha": fha,
        "apps_va": va,
        "apps_usda_other": usda,
        "conventional_pct": round(conv / apps * 100, 2) if apps else None,
        "fha_pct": round(fha / apps * 100, 2) if apps else None,
        "va_pct": round(va / apps * 100, 2) if apps else None,
        "usda_other_pct": round(usda / apps * 100, 2) if apps else None,
    }


def fdic_ny() -> int:
    data = json.loads((ROOT / "lib/fdic/data/new-york.json").read_text(encoding="utf-8"))
    return len(data.get("banks") or [])


def cfpb_try() -> dict:
    ctx = ssl.create_default_context()
    ua = {"User-Agent": "Mozilla/5.0 (compatible; LenderTrustHub/NY-LEND-001)"}
    urls = [
        "https://data.consumerfinance.gov/resource/s6ew-h6mp.json?%24select=count(*)&%24where=product%20like%20%27Mortgage%25%27%20and%20state=%27NY%27",
        "https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/?size=0&state=NY&product=Mortgage",
    ]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers=ua)
            with urllib.request.urlopen(req, context=ctx, timeout=40) as r:
                body = json.loads(r.read().decode())
                (ART / "cfpb-try.json").write_text(json.dumps(body)[:4000], encoding="utf-8")
                if isinstance(body, list) and body:
                    val = body[0].get("count") or body[0].get("count_1")
                    return {"mortgage_complaint_rows": int(val), "via": url}
                tot = body.get("hits", {}).get("total")
                if isinstance(tot, dict):
                    tot = tot.get("value")
                if isinstance(tot, int):
                    return {"mortgage_complaint_rows": tot, "via": url}
        except Exception as e:
            print("cfpb try fail", url[:60], type(e).__name__, e)
    return {"mortgage_complaint_rows": None, "via": None}


def main() -> None:
    slugs = sorted(p.stem for p in ART.glob("wb2026*.html"))
    events = []
    for slug in slugs:
        html = (ART / f"{slug}.html").read_text(encoding="utf-8", errors="replace")
        events.extend(parse_bulletin_html(html, slug))
    counts = Counter()
    for e in events:
        counts[e["kind"]] += e["count"]
    (ART / "bulletin-events.json").write_text(json.dumps(events, indent=2), encoding="utf-8")
    print("bulletins", len(slugs), "heading events", len(events))
    print("counts", dict(counts), "sum", sum(counts.values()))
    print("hmda", hmda_ny())
    print("fdic banks", fdic_ny())
    print("cfpb", cfpb_try())
    enf = json.loads((ART / "enforcement-rows.json").read_text(encoding="utf-8"))
    print("enforcement", len(enf), Counter(r["subject"] for r in enf))
    print("enf dates", min(r["date"] for r in enf), max(r["date"] for r in enf))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Acquire NYDFS enforcement table, 2026 weekly bulletins, CFPB NY mortgage count."""
from __future__ import annotations

import json
import re
import ssl
import time
import urllib.request
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "artifacts" / "ny-lend-001"
ART.mkdir(parents=True, exist_ok=True)
CTX = ssl.create_default_context()
UA = {"User-Agent": "Mozilla/5.0 (compatible; LenderTrustHub/NY-LEND-001)"}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, context=CTX, timeout=45) as r:
        return r.read()


class TableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_td = False
        self.in_th = False
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
            self.in_td = False
            self.in_th = False
        elif tag == "tr":
            if self.row:
                self.rows.append(self.row)
            self.row = []

    def handle_data(self, data):
        if self.in_td or self.in_th:
            self.cell += data


def parse_enforcement(html: str) -> list[dict]:
    p = TableParser()
    p.feed(html)
    out = []
    for row in p.rows:
        if len(row) < 3:
            continue
        date, action, subject = row[0][0], row[1][0], row[2][0]
        if not re.match(r"\d{4}-\d{2}-\d{2}", date):
            continue
        href = row[1][1] or ""
        if href.startswith("/"):
            href = "https://www.dfs.ny.gov" + href
        out.append(
            {
                "date": date,
                "action": action,
                "subject": subject,
                "url": href or None,
            }
        )
    return out


def classify_bulletin_heading(h: str) -> str | None:
    t = h.lower()
    if "mortgage loan originat" in t and "approv" in t:
        return "mlo_approval"
    if "mortgage loan originat" in t and "withdraw" in t:
        return "mlo_withdrawal"
    if "mortgage loan originat" in t and "application" in t:
        return "mlo_application_received"
    if "mortgage banker branch" in t and "surrender" in t:
        return "banker_branch_surrendered"
    if "mortgage banker branch" in t and ("issued" in t or "license issued" in t):
        return "banker_branch_issued"
    if "mortgage banker" in t and "surrender" in t and "branch" not in t:
        return "banker_surrendered"
    if "mortgage banker" in t and ("license issued" in t or "issued to engage" in t) and "branch" not in t:
        return "banker_issued"
    if "mortgage broker" in t and "branch" in t and "surrender" in t:
        return "broker_branch_surrendered"
    if "mortgage broker" in t and "branch" in t and ("issued" in t or "certificate issued" in t):
        return "broker_branch_issued"
    if "mortgage broker" in t and "surrender" in t and "branch" not in t:
        return "broker_surrendered"
    if "mortgage broker" in t and ("certificate issued" in t or "issued to engage" in t) and "branch" not in t:
        return "broker_issued"
    if "mortgage loan servicer" in t and "surrender" in t:
        return "servicer_surrendered"
    if "mortgage loan servicer" in t and ("issued" in t or "registration" in t):
        return "servicer_issued"
    if "mortgage" in t and ("inactive" in t):
        return "broker_inactive"
    if "mortgage" in t and ("address change" in t or "name change" in t):
        return "address_or_name_change"
    if "mortgage banker" in t or "mortgage broker" in t or "mortgage loan" in t or "mortgage servicer" in t:
        return "other_mortgage"
    return None


def parse_bulletin(html: str, slug: str) -> list[dict]:
    text = re.sub(r"<[^>]+>", "\n", html)
    text = re.sub(r"\n+", "\n", text)
    events = []
    # Split by bold-ish headings that survive as text
    headings = list(re.finditer(r"(License issued to engage[^\n]{0,180}|Certificate issued to engage[^\n]{0,180}|License to engage[^\n]{0,180}|Certificate to engage[^\n]{0,180}|Approvals issued to engage in the business of mortgage loan origination[^\n]{0,180}|Applications for licensing as a Mortgage Loan Originator[^\n]{0,180}|Article 12-E Applications Received[^\n]{0,80}|Mortgage Banker[^\n]{0,120}|Mortgage Broker[^\n]{0,120}|Mortgage Loan Servicer[^\n]{0,120})", text, re.I))
    for i, m in enumerate(headings):
        heading = m.group(0)
        kind = classify_bulletin_heading(heading)
        if not kind:
            continue
        end = headings[i + 1].start() if i + 1 < len(headings) else min(len(text), m.end() + 4000)
        chunk = text[m.end() : end]
        nmls = re.findall(r"\b(\d{4,7})\b", chunk)
        # count entity-like lines (dates with MB-MBD / BR-MBD / MS-MBD)
        codes = re.findall(r"\((MB|BR|MS)-MBD\)", chunk)
        table_rows = len(re.findall(r"\b20\d{2}\b.*\d{4,7}", chunk))
        count = max(len(codes), table_rows, 1 if "issued" in heading.lower() or "surrender" in heading.lower() or "approv" in heading.lower() else 0)
        if kind.startswith("mlo_") and table_rows:
            count = table_rows
        events.append(
            {
                "bulletin": slug,
                "heading": heading[:240],
                "kind": kind,
                "code_hits": len(codes),
                "nmls_hits": len(set(nmls)),
                "count": count,
            }
        )
    return events


def cfpb_ny_count() -> dict:
    url = (
        "https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/"
        "?frm=0&size=0&no_aggs=false&product=Mortgage&state=NY"
    )
    raw = get(url)
    data = json.loads(raw.decode("utf-8"))
    (ART / "cfpb-ny-meta.json").write_text(json.dumps({"hits": data.get("hits", {}).get("total")}, indent=2), encoding="utf-8")
    total = data.get("hits", {}).get("total")
    if isinstance(total, dict):
        total = total.get("value")
    return {"mortgage_complaint_rows": total, "raw_keys": list(data.keys())[:12]}


def main() -> None:
    enf_html = (ART / "probe_enf.html").read_text(encoding="utf-8", errors="replace")
    enf = parse_enforcement(enf_html)
    (ART / "enforcement-rows.json").write_text(json.dumps(enf, indent=2), encoding="utf-8")
    print("enforcement", len(enf), "subjects", Counter(r["subject"] for r in enf))

    wb = (ART / "probe_wb.html").read_text(encoding="utf-8", errors="replace")
    slugs = sorted(set(re.findall(r"/reports-and-publications/weekly-bulletins/(wb2026\d{4})", wb)))
    print("bulletin slugs", len(slugs), slugs[:3], slugs[-3:])
    all_events = []
    for slug in slugs:
        url = f"https://www.dfs.ny.gov/reports-and-publications/weekly-bulletins/{slug}"
        try:
            body = get(url)
        except Exception as e:
            print("skip", slug, e)
            continue
        (ART / f"{slug}.html").write_bytes(body)
        html = body.decode("utf-8", "replace")
        ev = parse_bulletin(html, slug)
        all_events.extend(ev)
        print(slug, "events", len(ev), "kinds", Counter(e["kind"] for e in ev))
        time.sleep(0.15)
    (ART / "bulletin-events.json").write_text(json.dumps(all_events, indent=2), encoding="utf-8")
    kinds = Counter()
    counts = Counter()
    for e in all_events:
        kinds[e["kind"]] += 1
        counts[e["kind"]] += e["count"]
    print("heading groups", dict(kinds))
    print("event counts", dict(counts), "sum", sum(counts.values()))
    try:
        print("cfpb", cfpb_ny_count())
    except Exception as e:
        print("cfpb ERR", e)


if __name__ == "__main__":
    main()

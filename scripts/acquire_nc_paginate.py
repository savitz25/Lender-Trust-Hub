#!/usr/bin/env python3
"""Paginate NCCOB Show All current company licenses (deterministic, not name brute-force)."""
from __future__ import annotations

import csv
import gzip
import hashlib
import io
import json
import re
import time
from html.parser import HTMLParser
from pathlib import Path
from http.cookiejar import CookieJar
from urllib.parse import urlencode
from urllib.request import HTTPCookieProcessor, Request, build_opener

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/north-carolina/nc-lend-001/raw"
DER = ROOT / "data/north-carolina/nc-lend-001/derived"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
LICENSE = "https://www.nccob.gov/online/NMLS/licensesearch.aspx"


def hidden_all(html: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for m in re.finditer(r'<input[^>]*type="hidden"[^>]*>', html, re.I):
        tag = m.group(0)
        name = re.search(r'name="([^"]+)"', tag)
        value = re.search(r'value="([^"]*)"', tag)
        if name:
            out[name.group(1)] = value.group(1) if value else ""
    return out


OPENER = build_opener(HTTPCookieProcessor(CookieJar()))


def fetch(data: dict[str, str] | None = None) -> str:
    body = urlencode(data).encode() if data else None
    headers = {"User-Agent": UA, "Referer": LICENSE}
    if data:
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    req = Request(LICENSE, data=body, headers=headers, method="POST" if data else "GET")
    with OPENER.open(req, timeout=180) as resp:
        return resp.read().decode("utf-8", "replace")


class RowParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.rows: list[list[str]] = []
        self.hrefs: list[str] = []
        self._in_dg = False
        self._row: list[str] | None = None
        self._cell: list[str] | None = None
        self._depth = 0

    def handle_starttag(self, tag, attrs):
        ad = dict(attrs)
        if tag == "table" and ad.get("id") == "dgCompany":
            self._in_dg = True
            self._depth = 1
        elif tag == "table" and self._in_dg:
            self._depth += 1
        elif self._in_dg and self._depth == 1 and tag == "tr":
            self._row = []
        elif self._in_dg and self._row is not None and tag in {"td", "th"} and self._depth == 1:
            self._cell = []
        elif tag == "a" and self._cell is not None:
            href = ad.get("href") or ""
            if "LicenseView" in href:
                self.hrefs.append(href)

    def handle_endtag(self, tag):
        if tag in {"td", "th"} and self._cell is not None:
            self._row.append(re.sub(r"\s+", " ", "".join(self._cell)).strip())
            self._cell = None
        elif tag == "tr" and self._row is not None and self._depth == 1:
            if any(self._row) and self._row[0] not in {"Company Name", ""}:
                self.rows.append(self._row)
            self._row = None
        elif tag == "table" and self._in_dg:
            self._depth -= 1
            if self._depth <= 0:
                self._in_dg = False

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)


def parse_page(html: str) -> tuple[list[dict[str, str]], str | None]:
    p = RowParser()
    p.feed(html)
    recs = []
    for row in p.rows:
        if len(row) < 8:
            continue
        if row[0].isdigit() or "Matching" in row[0]:
            continue
        recs.append(
            {
                "name": row[0],
                "dba": row[1] if len(row) > 1 else "",
                "license_type": row[2] if len(row) > 2 else "",
                "services_loan": row[3] if len(row) > 3 else "",
                "office": row[4] if len(row) > 4 else "",
                "nccob_license": row[5] if len(row) > 5 else "",
                "nmls_id": row[6] if len(row) > 6 else "",
                "status": row[7] if len(row) > 7 else "",
                "expiration": row[8] if len(row) > 8 else "",
                "enforcement": row[9] if len(row) > 9 else "",
            }
        )
    nxt = None
    m = re.search(
        r'<span>(\d+)</span>\s*&nbsp;<a href="javascript:__doPostBack\(&#39;([^&]+)&#39;',
        html,
    )
    if m:
        nxt = m.group(2).replace("amp;", "")
    # fallback: first numeric page link after current span
    pages = re.findall(
        r'javascript:__doPostBack\(&#39;(dgCompany\$_ctl\d+\$_ctl\d+)&#39;',
        html,
    )
    if not nxt and pages:
        nxt = pages[0]
    return recs, nxt


def write_csv_gz(path: Path, rows: list[dict[str, str]], fields: list[str]) -> None:
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=fields, extrasaction="ignore")
    w.writeheader()
    for r in rows:
        w.writerow(r)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(gzip.compress(buf.getvalue().encode("utf-8"), mtime=0))


def main() -> None:
    DER.mkdir(parents=True, exist_ok=True)
    html = fetch()
    hidden = hidden_all(html)
    post = {**hidden, "txtCompanyName": "", "txtLastName": "", "btnAllCompanies": "Show All"}
    html = fetch(post)
    (RAW / "license-all-companies.html").write_text(html, encoding="utf-8")
    all_rows: list[dict[str, str]] = []
    seen_pages = 0
    while True:
        recs, nxt = parse_page(html)
        all_rows.extend(recs)
        seen_pages += 1
        print(f"page {seen_pages} rows+={len(recs)} total={len(all_rows)} next={nxt}", flush=True)
        if not nxt or seen_pages > 80:
            break
        hidden = hidden_all(html)
        post = {
            **hidden,
            "txtCompanyName": "",
            "txtLastName": "",
            "__EVENTTARGET": nxt,
            "__EVENTARGUMENT": "",
        }
        time.sleep(1.2)
        try:
            html = fetch(post)
        except Exception as exc:
            print(f"STOP page {seen_pages} {exc}", flush=True)
            (RAW / f"license-companies-page-{seen_pages}.html").write_text(html, encoding="utf-8")
            break
    # de-dupe by nccob license
    uniq: dict[str, dict[str, str]] = {}
    for r in all_rows:
        key = r.get("nccob_license") or r.get("name")
        uniq[key] = r
    rows = list(uniq.values())
    write_csv_gz(
        DER / "nccob-current-companies.csv.gz",
        rows,
        [
            "name",
            "dba",
            "license_type",
            "services_loan",
            "office",
            "nccob_license",
            "nmls_id",
            "status",
            "expiration",
            "enforcement",
        ],
    )
    types: dict[str, int] = {}
    for r in rows:
        types[r["license_type"]] = types.get(r["license_type"], 0) + 1
    census = {
        "pages": seen_pages,
        "parsed_rows": len(all_rows),
        "distinct_licenses": len(rows),
        "by_type": types,
        "services_loan_yes": sum(1 for r in rows if r["services_loan"].lower() == "yes"),
        "distinct_nmls": len({r["nmls_id"] for r in rows if r["nmls_id"]}),
        "nccob_nmls_both": sum(1 for r in rows if r["nccob_license"] and r["nmls_id"]),
        "dba_populated": sum(1 for r in rows if r["dba"] and r["dba"] not in {"N/A", "No", ""}),
    }
    (DER / "nccob-company-census.json").write_text(json.dumps(census, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(census, indent=2))


if __name__ == "__main__":
    main()

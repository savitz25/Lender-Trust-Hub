#!/usr/bin/env python3
"""Probe/acquire NCCOB mortgage lists that are safely enumerable."""
from __future__ import annotations

import gzip
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

RAW = Path(__file__).resolve().parents[1] / "data/north-carolina/nc-lend-001/raw"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
ENFORCE = "https://www.nccob.gov/Online/NMLS/CommissionOrderListing.aspx"
REVERSE = "https://www.nccob.gov/online/nmls/ReverseMortgageCertificates.aspx"
MOSR = "https://www.nccob.gov/online/nmls/MOSRMortgageCertificates.aspx"
LICENSE = "https://www.nccob.gov/online/NMLS/licensesearch.aspx"


def fetch(url: str, data: dict[str, str] | None = None) -> bytes:
    body = urlencode(data).encode() if data else None
    headers = {"User-Agent": UA}
    if data:
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    req = Request(url, data=body, headers=headers, method="POST" if data else "GET")
    with urlopen(req, timeout=90) as resp:
        return resp.read()


def hidden(html: str, name: str) -> str:
    m = re.search(rf'name="{name}"[^>]*value="([^"]*)"', html)
    if m:
        return m.group(1)
    m = re.search(rf'id="{name}"[^>]*value="([^"]*)"', html)
    return m.group(1) if m else ""


class TableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.tables: list[list[list[str]]] = []
        self.hrefs: list[tuple[str, str]] = []
        self._table = None
        self._row = None
        self._cell = None
        self._href = None
        self._in_cell = False

    def handle_starttag(self, tag, attrs):
        ad = dict(attrs)
        if tag == "table":
            self._table = []
        elif tag == "tr" and self._table is not None:
            self._row = []
        elif tag in {"td", "th"} and self._row is not None:
            self._cell = []
            self._in_cell = True
        elif tag == "a" and self._in_cell:
            self._href = ad.get("href") or ""

    def handle_endtag(self, tag):
        if tag in {"td", "th"} and self._in_cell and self._row is not None:
            text = re.sub(r"\s+", " ", "".join(self._cell)).strip()
            self._row.append(text)
            if self._href:
                self.hrefs.append((text, self._href))
            self._cell = None
            self._in_cell = False
            self._href = None
        elif tag == "tr" and self._row is not None and self._table is not None:
            if any(self._row):
                self._table.append(self._row)
            self._row = None
        elif tag == "table" and self._table is not None:
            if self._table:
                self.tables.append(self._table)
            self._table = None

    def handle_data(self, data):
        if self._in_cell and self._cell is not None:
            self._cell.append(data)


def parse_tables(html: str) -> TableParser:
    p = TableParser()
    p.feed(html)
    return p


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    get_html = fetch(ENFORCE).decode("utf-8", "replace")
    (RAW / "mortgage-enforcement.html").write_text(get_html, encoding="utf-8")
    post = {
        "__VIEWSTATE": hidden(get_html, "__VIEWSTATE"),
        "__VIEWSTATEGENERATOR": hidden(get_html, "__VIEWSTATEGENERATOR"),
        "__EVENTVALIDATION": hidden(get_html, "__EVENTVALIDATION"),
        "docketNumber": "",
        "companyName": "",
        "firstName": "",
        "lastName": "",
        "startDate": "",
        "endDate": "",
        "actionTypes": "-1",
        "display": "1",
        "search": "Search",
    }
    result = fetch(ENFORCE, post).decode("utf-8", "replace")
    (RAW / "mortgage-enforcement-results.html").write_text(result, encoding="utf-8")
    m = re.search(r"(\d+)\s+records found", result, re.I)
    print("enforcement_records", m.group(1) if m else None, "bytes", len(result), "cf", "Just a moment" in result)

    rev = fetch(REVERSE).decode("utf-8", "replace")
    (RAW / "reverse-list.html").write_text(rev, encoding="utf-8")
    rm = re.search(r"(\d+)\s+Matching Records", rev, re.I)
    print("reverse_records", rm.group(1) if rm else None, "bytes", len(rev), "cf", "Just a moment" in rev)

    mosr = fetch(MOSR).decode("utf-8", "replace")
    (RAW / "mosr-list.html").write_text(mosr, encoding="utf-8")
    mm = re.search(r"(\d+)\s+Matching Records", mosr, re.I)
    print("mosr_records", mm.group(1) if mm else None, "bytes", len(mosr), "cf", "Just a moment" in mosr)

    lic = fetch(LICENSE).decode("utf-8", "replace")
    (RAW / "license-search.html").write_text(lic, encoding="utf-8")
    print("license_cf", "Just a moment" in lic, "bytes", len(lic), "current_only", "ONLY show current" in lic)

    parser = parse_tables(result)
    docs = []
    for text, href in parser.hrefs:
        if "DocumentsDisplay" in href or "Enforcement" in href or text:
            if re.search(r"\d", text) or "DocumentsDisplay" in href:
                docs.append({"text": text, "href": href})
    print("enforcement_hrefs", len(docs), "sample", docs[:5])
    dockets = re.findall(r"\b\d{2}[-:]\d{2,4}[-:]?[A-Z]{0,4}\b", result)
    print("docket_like", len(dockets), "unique", len(set(dockets)), "sample", list(dict.fromkeys(dockets))[:8])

    rm_certs = re.findall(r"\bRM-\d+\b", rev)
    print("rm_certs", len(rm_certs), "unique", len(set(rm_certs)))


if __name__ == "__main__":
    main()

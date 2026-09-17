#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

RAW = Path(__file__).resolve().parents[1] / "data/north-carolina/nc-lend-001/raw"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
LICENSE = "https://www.nccob.gov/online/NMLS/licensesearch.aspx"


def hidden(html: str, name: str) -> str:
    m = re.search(rf'name="{name}"[^>]*value="([^"]*)"', html)
    return m.group(1) if m else ""


def fetch(url: str, data: dict[str, str] | None = None) -> str:
    body = urlencode(data).encode() if data else None
    headers = {"User-Agent": UA}
    if data:
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    req = Request(url, data=body, headers=headers, method="POST" if data else "GET")
    with urlopen(req, timeout=180) as resp:
        return resp.read().decode("utf-8", "replace")


def main() -> None:
    html = fetch(LICENSE)
    print("get bytes", len(html), "cf", "Just a moment" in html)
    base = {
        "__VIEWSTATE": hidden(html, "__VIEWSTATE"),
        "__VIEWSTATEGENERATOR": hidden(html, "__VIEWSTATEGENERATOR"),
        "__EVENTVALIDATION": hidden(html, "__EVENTVALIDATION"),
        "txtCompanyName": "",
        "txtLastName": "",
    }
    print("posting Show All companies...")
    co = fetch(LICENSE, {**base, "btnAllCompanies": "Show All"})
    (RAW / "license-all-companies.html").write_text(co, encoding="utf-8")
    print("companies bytes", len(co), "cf", "Just a moment" in co)
    print("matching", re.search(r"(\d+)\s+Matching Records", co, re.I))
    print("records found", re.search(r"(\d+)\s+records found", co, re.I))
    print("tables", co.count("<table"), "tr", co.count("<tr"))
    print("sample links", re.findall(r"<a[^>]+>([^<]{5,80})</a>", co)[:12])
    print("nmls-like", len(re.findall(r"\bNMLS\b", co)))
    print("license-like", len(re.findall(r"\bL-\d+", co)))
    print("MBR", len(re.findall(r"\bMBR-\d+", co)))
    # refresh viewstate from GET again for officers
    html2 = fetch(LICENSE)
    base2 = {
        "__VIEWSTATE": hidden(html2, "__VIEWSTATE"),
        "__VIEWSTATEGENERATOR": hidden(html2, "__VIEWSTATEGENERATOR"),
        "__EVENTVALIDATION": hidden(html2, "__EVENTVALIDATION"),
        "txtCompanyName": "",
        "txtLastName": "",
    }
    print("posting Show All officers...")
    of = fetch(LICENSE, {**base2, "btnAllOfficers": "Show All"})
    (RAW / "license-all-officers.html").write_text(of, encoding="utf-8")
    print("officers bytes", len(of), "cf", "Just a moment" in of)
    print("matching", re.search(r"(\d+)\s+Matching Records", of, re.I))
    print("tables", of.count("<table"), "tr", of.count("<tr"))
    print("sample", re.findall(r"<a[^>]+>([^<]{5,80})</a>", of)[:8])


if __name__ == "__main__":
    main()

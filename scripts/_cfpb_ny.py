import re
import ssl
import urllib.request
from pathlib import Path

ctx = ssl._create_unverified_context()
ua = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36"
}
url = "https://www.consumerfinance.gov/data-research/consumer-complaints/search/?product=Mortgage&state=NY"
req = urllib.request.Request(url, headers=ua)
try:
    with urllib.request.urlopen(req, context=ctx, timeout=45) as r:
        body = r.read()
        print("status", r.status, "len", len(body), r.geturl())
        text = body.decode("utf-8", "replace")
        Path("artifacts/ny-lend-001/cfpb-search.html").write_text(text[:250000], encoding="utf-8")
        for pat in [r"([0-9,]{3,})\s+complaint", r"Showing\s+([0-9,]+)", r"hits.*?total.*?([0-9]{4,})"]:
            m = re.search(pat, text, re.I | re.S)
            print("pat", pat, (m.group(1) if m else None))
except Exception as e:
    print("ERR", type(e).__name__, e)

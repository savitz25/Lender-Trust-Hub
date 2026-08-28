import re
import time
import urllib.request

url = "http://localhost:3015/florida"
t0 = time.time()
req = urllib.request.Request(url, headers={"User-Agent": "FLINT-QA"})
with urllib.request.urlopen(req, timeout=30) as r:
    html = r.read().decode("utf-8", "replace")
    code = r.status
print("status", code, "bytes", len(html), "s", round(time.time() - t0, 3))
low = html.lower()
print("noindex", "noindex" in low)
need = [
    "6,325",
    "6,435",
    "6,303",
    "952",
    "342",
    "294",
    "2,515",
    "$2.05M",
    "REVIEW_REQUIRED",
    "not a ranking",
    "credentials are not companies",
]
for s in need:
    print(("HAS" if s in html else "MISS"), s)
forbid = ["Trust Score", "best lender", "safest lender", "aggregateRating", "recommended lender"]
for s in forbid:
    print(("BAD" if s in html else "ok"), s)
print("h1", bool(re.search(r"<h1", html)))
print("main", 'id="main-content"' in html)
print("skip", "Skip to content" in html)
print("complaint_metric", "administrative-complaint metric" in low)

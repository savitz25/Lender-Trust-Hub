import csv
import hashlib
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = (ROOT / "app/montana/page.tsx").read_text(encoding="utf-8")
SITEMAP = (ROOT / "app/sitemap.ts").read_text(encoding="utf-8")


class MontanaLenderPublicationTests(unittest.TestCase):
    def test_existing_hmda_partition_matches_published_snapshot(self):
        path = ROOT / "data/hmda/by-state/MT/county_market_summary.csv"
        raw = path.read_bytes()
        rows = list(csv.DictReader(raw.decode("utf-8-sig").splitlines()))
        self.assertEqual(len(rows), 56)
        self.assertEqual(sum(int(row["total_applications"]) for row in rows), 37122)
        self.assertEqual(sum(int(row["total_originations"]) for row in rows), 22968)
        self.assertEqual(sum(int(row["denial_count"]) for row in rows), 5479)
        self.assertEqual(hashlib.sha256(raw).hexdigest(), "0fa39a03fb08e843134c584d05dce130f5fe7c5b086c16916204b8d23e632e71")

    def test_regulatory_grains_and_unknowns_are_explicit(self):
        for text in (
            "NOT_ACQUIRED", "Mortgage lender", "mortgage broker", "mortgage servicer",
            "branches", "mortgage loan originator person records", "enforcement-action rows",
            "not a count of licensees", "115 fewer applications", "LEIs are not NMLS IDs",
            "https://banking.mt.gov/BFID/mortgage-consumer-finance/mortgage",
            "https://banking.mt.gov/BFID/enforcement-actions",
        ):
            self.assertIn(text, PAGE)
        self.assertIn("/montana", SITEMAP)
        self.assertNotIn("AggregateRating", PAGE)
        self.assertNotIn("Trust Score", PAGE)
        self.assertNotIn("StateCountyLinks", PAGE)


if __name__ == "__main__":
    unittest.main()

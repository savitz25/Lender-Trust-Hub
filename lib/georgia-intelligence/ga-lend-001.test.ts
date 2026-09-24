import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { parseLenderAsk } from "../ask-lender/parse.ts";

test("GA-LEND-001 does not invent a Georgia lender total", () => {
  const result = parseLenderAsk("how many lenders in Georgia");
  assert.equal(result.mode, "fail_closed");
  assert.equal(result.coverageState, "NOT_ACQUIRED");
});

test("GA-LEND-001 enforcement stays on NMLS and is not name-joined", () => {
  const result = parseLenderAsk("Georgia mortgage enforcement final order");
  assert.equal(result.coverageState, "NOT_ACQUIRED");
  assert.match(result.failReason, /NMLS Consumer Access/);
  assert.match(result.failReason, /not attach an action by name/);
});

test("GA-LEND-001 DBF complaints are not public", () => {
  const result = parseLenderAsk("Georgia DBF complaint records");
  assert.equal(result.coverageState, "UNSUPPORTED");
});

test("GA-LEND-001 page does not duplicate an NMLS roster", () => {
  const page = readFileSync("app/georgia/page.tsx", "utf8");
  assert.match(page, /NOT_ACQUIRED as a Georgia-only extract/);
  assert.doesNotMatch(page, /Georgia has \d+ lenders/);
  assert.match(page, /not a federal-only list/);
});

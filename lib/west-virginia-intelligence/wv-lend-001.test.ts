import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { parseLenderAsk } from "../ask-lender/parse";
import { normalizedPublishedStatePath } from "../seo/published-state-path";
import { WEST_VIRGINIA_LENDER_SNAPSHOT as wv } from "./snapshot";

function dataRows(path: string): string[] {
  return readFileSync(path, "utf8").trim().split(/\r?\n/).slice(1);
}

test("West Virginia company rows stay separate from examinations and HMDA", () => {
  assert.equal(wv.licensedMortgageCompanies.namedRows, 475);
  assert.equal(wv.licensedMortgageCompanies.sourcePrintedTotal, null);
  assert.equal(wv.licensedMortgageCompanies.lenderBrokerServicerSplit, "NOT_SEPARATED");
  assert.equal(wv.examinations.fy2025, 11);
  assert.equal(wv.examinations.fy2024, 15);
  assert.equal(wv.examinations.isLicenseCount, false);
  assert.equal(wv.examinations.allClassTotalIsMortgageLicenses, false);
  assert.equal(wv.notAcquired.mortgageLoanOriginatorRoster, "NOT_ACQUIRED");
  assert.equal(wv.notAcquired.fdicInstitutionRecount, "NOT_RECOUNTED");
  assert.equal(wv.hmda.reloaded, false);
  assert.equal(wv.hmda.isLicensing, false);
  assert.equal(wv.hmda.acceptedStatewideAggregate, "NOT_ACQUIRED");
  assert.equal(dataRows(wv.hmda.countyMarketSource).length, 21);
  assert.equal(dataRows(wv.hmda.lenderCountyActivitySource).length, 2081);
  assert.equal(dataRows(wv.hmda.leiSummarySource).length, 470);
  assert.equal(dataRows(wv.hmda.highConfidenceMappingSource).length, 141);
  assert.equal(wv.graphWrites, 0);
  assert.equal(wv.nameOnlyAdverseJoins, 0);
  assert.equal(existsSync(wv.fdicFile), true);
  assert.equal(wv.sha256, "A64CA096D1919E9836DF3579B03905D49F6E92359E012013BEB5A7B7FE22AE87");
  assert.equal(wv.licensedMortgageCompanies.namedRows + wv.examinations.fy2025, 486);
});

test("West Virginia page does not combine grains or open a city route", () => {
  const page = readFileSync("app/west-virginia/page.tsx", "utf8");
  const sitemap = readFileSync("app/sitemap.ts", "utf8");
  assert.match(page, /namedRows/);
  assert.match(page, /does not print a total/);
  assert.match(page, /lenderBrokerServicerSplit/);
  assert.match(page, /An examination is not a license/);
  assert.match(page, /mortgageLoanOriginatorRoster/);
  assert.match(page, /fdicInstitutionRecount/);
  assert.match(page, /not reloaded/);
  assert.match(page, /does not rank/);
  assert.match(page, /not added/);
  assert.doesNotMatch(page, /486|490|2,556|2556/);
  assert.doesNotMatch(page, /AggregateRating|Trust Score|ratingValue/);
  assert.doesNotMatch(page, /\/west-virginia\/charleston/);
  assert.equal(existsSync("app/west-virginia/charleston"), false);
  assert.equal((sitemap.match(/path: '\/west-virginia'/g) ?? []).length, 1);
  assert.equal((sitemap.match(/path: '\/idaho'/g) ?? []).length, 1);
  assert.equal(normalizedPublishedStatePath("/West-Virginia"), "/west-virginia");
  assert.equal(normalizedPublishedStatePath("/west-virginia"), null);
  assert.equal(normalizedPublishedStatePath("/west-virginia/charleston"), null);
});

test("West Virginia Ask keeps the company list off Virginia and off HMDA", () => {
  const companies = parseLenderAsk("how many mortgage lenders in West Virginia");
  assert.equal(companies.failClosedKind, "wv-mortgage-companies");
  assert.match(companies.failReason ?? "", /475/);
  assert.match(companies.failReason ?? "", /does not print a total/);
  assert.match(companies.failReason ?? "", /not added/);
  const exams = parseLenderAsk("West Virginia mortgage examinations");
  assert.match(exams.failReason ?? "", /11/);
  assert.match(exams.failReason ?? "", /not a license/);
  const people = parseLenderAsk("mortgage loan originators in West Virginia");
  assert.match(people.failReason ?? "", /NOT_ACQUIRED/);
  assert.match(people.failReason ?? "", /not zero/);
  const rank = parseLenderAsk("best mortgage lender in West Virginia");
  assert.equal(rank.failClosedKind, "wv-ranking");
  assert.match(rank.failReason ?? "", /does not rank/);
  const city = parseLenderAsk("mortgage lenders in Charleston, West Virginia");
  assert.match(city.failReason ?? "", /geography only/);
  const virginia = parseLenderAsk("how many mortgage lenders in Virginia");
  assert.notEqual(virginia.failClosedKind, "wv-mortgage-companies");
  const bare = parseLenderAsk("mortgage lenders wv");
  assert.notEqual(bare.failClosedKind, "wv-mortgage-companies");
  const apps = parseLenderAsk("How many applications in West Virginia");
  assert.notEqual(apps.failClosedKind, "wv-mortgage-companies");
  assert.doesNotMatch(apps.failReason ?? "", /475 named/);
});

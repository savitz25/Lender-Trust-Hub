import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import { mintLenderHandoff, HANDOFF_TTL_SECONDS } from "./handoff";
import {
  claimCtaEnabledFor,
  lenderClaimProfile,
  lenderClaimProfileFromRow,
} from "./eligibility";
import {
  fetchBusinessProfile,
  fetchBusinessReplies,
  parseBusinessProfile,
  parseReplies,
} from "./public";
const ID = "1e2fa9a5-7067-52e9-8b44-4da4e71c9d47",
  SECRET = "test-secret-that-is-at-least-32-characters";
test("Rocket institution NMLS 3030 is eligible while holds/non-institution keys are not", () => {
  const r = lenderClaimProfile("rocket-mortgage");
  assert.equal(r?.nmls, "3030");
  assert.equal(lenderClaimProfile("phh-home-loans"), null);
  const base = {
    institution_id: ID,
    stable_key: "nmls-inst:3030",
    slug: "rocket-mortgage",
    publication_status: "PUBLICATION_ELIGIBLE",
    display_name: "Rocket Mortgage",
    hq_state: "MI",
  } as const;
  assert.ok(lenderClaimProfileFromRow(base));
  assert.equal(
    lenderClaimProfileFromRow({
      ...base,
      stable_key: "nmls-branch:3030",
    }),
    null,
  );
  assert.equal(
    lenderClaimProfileFromRow({
      ...base,
      stable_key: "nmls-mlo:3030",
    }),
    null,
  );
  assert.equal(claimCtaEnabledFor(ID, { ATH_HANDOFF_SECRET: SECRET }), false);
});
test("signed v2 handoff binds institution class and expires", () => {
  const m = mintLenderHandoff(
    SECRET,
    {
      id: ID,
      slug: "rocket-mortgage",
      nmls: "3030",
      displayName: "Rocket Mortgage",
      homeState: "MI",
    },
    { now: new Date("2026-09-02T00:00:00Z"), nonce: "nonce" },
  );
  assert.equal(m.payload.entity_class, "institution");
  assert.equal(m.payload.identifier_namespace, "NMLS");
  assert.equal(m.payload.exp - m.payload.iat, HANDOFF_TTL_SECONDS);
  const [b, s] = m.token.split(".");
  assert.equal(createHmac("sha256", SECRET).update(b!).digest("base64url"), s);
  assert.notEqual(
    createHmac("sha256", SECRET).update(`${b}x`).digest("base64url"),
    s,
  );
});
test("hub-scoped Layer C and approved response fail closed on mismatch", () => {
  const dto = {
    contractVersion: 2,
    hub: "lender",
    nativeProfileId: ID,
    managed: true,
    source: "BUSINESS_SUPPLIED",
    freshness: {
      state: "CURRENT",
      lastConfirmedAt: "2026-09-01T00:00:00Z",
      label: "Current",
      mayBeOutdated: false,
    },
    fields: { description: "Business supplied" },
    services: [],
    serviceAreas: [],
    languages: [],
    hours: [],
  };
  assert.ok(parseBusinessProfile(dto, ID));
  assert.equal(parseBusinessProfile({ ...dto, hub: "move" }, ID), null);
  const replies = {
    contractVersion: 2,
    hub: "lender",
    nativeProfileId: ID,
    replies: [
      {
        id: ID,
        replyType: "GENERAL_RESPONSE",
        targetType: "PROFILE_GENERAL",
        targetRecordId: null,
        body: "This approved business response adds context without changing official lender evidence.",
        source: "BUSINESS_RESPONSE",
        publishedAt: "2026-09-01T00:00:00Z",
        updatedAt: null,
      },
    ],
  };
  assert.ok(parseReplies(replies, ID));
  assert.equal(
    parseReplies(
      { ...replies, nativeProfileId: "22222222-2222-4222-8222-222222222222" },
      ID,
    ),
    null,
  );
});

test("Ask outage omits overlays without failing the lender profile", async () => {
  const unavailable = (async () => {
    throw new Error("Ask unavailable");
  }) as typeof fetch;
  assert.equal(await fetchBusinessProfile(ID, unavailable), null);
  assert.equal(await fetchBusinessReplies(ID, unavailable), null);
});

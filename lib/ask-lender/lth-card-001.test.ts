import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AskResultView } from '../../components/ask-lender/ask-result-view';
import { isIdentityDiscovery } from '../../components/ask-lender/identity-discovery';
import { restingMatchLine } from '../../components/ask-lender/lender-result-card';
import { executeAskQuery } from './execute-query';
import type { AskExecution, AskInstitutionRow } from './types';

Object.assign(globalThis, { React });

function row(partial: Partial<AskInstitutionRow> & Pick<AskInstitutionRow, 'displayName' | 'identityStatus'>): AskInstitutionRow {
  return {
    rank: 1,
    lei: '',
    metric: 0,
    metricLabel: 'Identity relevance',
    applications: null,
    originations: null,
    denials: null,
    identityNote: 'Institution identity only.',
    whyMatched: ['Institution-name match in the bounded published profile index.', 'Not a recommendation.'],
    ...partial,
  };
}

function execution(partial: Partial<AskExecution>): AskExecution {
  return {
    query: { mode: 'entity', identityQuery: 'american', requestedMetric: null },
    interpretation: [{ label: 'Institution', value: 'american' }],
    geographyWarning: 'Property geography is not lender headquarters, branch location, or service territory.',
    headline: '21 institution records with a name like “american”',
    body: 'These are name candidates.',
    trace: {
      contract: 'lender-ask-v1',
      sourceFiles: ['fixture'],
      method: 'name',
      indexes: ['catalog'],
      identityPolicy: 'href is the publication gate',
      publicationGate: 'published profile only',
      cache: 'none',
      grain: 'institution',
      period: 'fixture',
    },
    ...partial,
  };
}

const html = (result: AskExecution) => renderToStaticMarkup(React.createElement(AskResultView, { result, question: 'american' }));

test('name discovery renders cards and does not render the identity table', () => {
  const result = execution({
    nameCandidates: { suppliedName: 'american', state: 'CANDIDATES', total: 2, unresolvedConditions: [] },
    rows: [
      row({ rank: 1, displayName: 'Second Profile', identityStatus: 'public_profile', href: '/lenders/second', nmls: '2000' }),
      row({ rank: 2, displayName: 'First Inert', identityStatus: 'lei_only', lei: '549300TO3XO96VF60C57' }),
    ],
  });
  const markup = html(result);
  assert.equal(isIdentityDiscovery(result), true);
  assert.match(markup, /data-ask-presentation="cards"/);
  assert.match(markup, /data-ask-identity-cards/);
  assert.doesNotMatch(markup, /hub-table|Name match order|Identity relevance order|Market activity order/);
  assert.ok(markup.indexOf('Second Profile') < markup.indexOf('First Inert'));
});

test('public profile card navigates once and keeps match evidence collapsed', () => {
  const result = execution({
    rows: [row({
      displayName: 'AMERICAN FEDERAL MORTGAGE CORPORATION',
      identityStatus: 'public_profile',
      href: '/lenders/american-federal-mortgage-corporation',
      nmls: '2756',
      lei: '549300EXAMPLELEI00001',
      resolvedClass: 'institution',
      whyMatched: ['Exact NMLS institution identifier: the published record lists 2756.', 'Long internal matching prose that must stay collapsed.'],
      matchEvidence: [{
        method: 'exact_identifier', family: 'NMLS_INSTITUTION', requestedValue: '2756', matchedField: 'nmls',
        returnedValue: '2756', institutionKey: 'inst-2756', sourceReference: 'published profile', sourceAsOf: null, normalization: [],
      }],
    })],
  });
  const markup = html(result);
  assert.match(markup, /data-ask-card-nav="profile"/);
  assert.match(markup, /cursor-pointer/);
  assert.match(markup, /NMLS <\/dt><dd class="inline">#2756/);
  assert.match(markup, /LEI <\/dt><dd[^>]*>549300EXAMPLELEI00001/);
  assert.equal(markup.match(/href="\/lenders\/american-federal-mortgage-corporation"/g)?.length, 2);
  assert.match(markup, /View lender profile/);
  assert.match(markup, /<details /);
  assert.doesNotMatch(markup, /<details\b[^>]*\sopen(?:=|\s|>)/);
  assert.match(markup, /How we matched this result/);
  assert.match(markup, /Matched by NMLS institution ID\./);
  assert.match(markup, /Long internal matching prose/);
  assert.match(markup, /Trace this query/);
  const surface = markup.indexOf('data-ask-card-surface');
  const cta = markup.indexOf('View lender profile');
  assert.ok(surface > -1 && cta > surface);
  assert.doesNotMatch(markup.slice(surface, markup.indexOf('</a>', surface) + 4), /View lender profile/);
});

test('missing href stays inert and keeps the official registry independent', () => {
  const result = execution({
    nameCandidates: { suppliedName: 'american', state: 'CANDIDATES', total: 1, unresolvedConditions: [] },
    rows: [row({
      displayName: 'AMERICAN BANK & TRUST',
      identityStatus: 'unpublished_research_identity',
      lei: '549300TO3XO96VF60C57',
      officialHref: 'https://search.gleif.org/#/record/549300TO3XO96VF60C57',
      officialLabel: 'Verify LEI with GLEIF',
      whyMatched: ['Name begins with the supplied institution name.'],
    })],
  });
  const markup = html(result);
  assert.match(markup, /data-ask-card-nav="none"/);
  assert.doesNotMatch(markup, /data-ask-card-nav="none"[^>]*cursor-pointer/);
  assert.doesNotMatch(markup, /href="\/lenders\//);
  assert.doesNotMatch(markup, /View lender profile/);
  assert.match(markup, /Unpublished research identity/);
  assert.match(markup, /No LenderTrustHub profile is currently published/);
  assert.match(markup, /LEI <\/dt><dd[^>]*>549300TO3XO96VF60C57/);
  assert.match(markup, /https:\/\/search\.gleif\.org\/#\/record\/549300TO3XO96VF60C57/);
  assert.match(markup, /target="_blank"/);
  assert.match(markup, /data-card-control/);
  assert.match(markup, /Matched by institution name\./);
});

test('identity hold and lei-only cards do not invent a profile', () => {
  const held = execution({
    rows: [row({ displayName: 'Held Institution', identityStatus: 'identity_hold', lei: '549300HELDLEI000000001' })],
  });
  const lei = execution({
    rows: [row({ displayName: 'LEI Only Institution', identityStatus: 'lei_only', lei: '549300LEIONLY00000001' })],
  });
  for (const markup of [html(held), html(lei)]) {
    assert.match(markup, /data-ask-card-nav="none"/);
    assert.doesNotMatch(markup, /View lender profile|href="\/lenders\//);
  }
  assert.match(html(held), /Identity hold/);
  assert.match(html(lei), /HMDA reporting LEI/);
});

test('NMLS and LEI stay distinct labels', () => {
  const sample = row({ displayName: 'Both', identityStatus: 'public_profile', nmls: '2756', lei: '549300EXAMPLELEI00001', href: '/lenders/both' });
  assert.equal(restingMatchLine(sample), 'Matched by institution name.');
  const markup = html(execution({ rows: [sample] }));
  assert.match(markup, /NMLS <\/dt>/);
  assert.match(markup, /LEI <\/dt>/);
  assert.doesNotMatch(markup, /NMLS #549300|LEI 2756|NMLS <\/dt><dd[^>]*>549300/);
});

test('pagination and supplied order are unchanged', () => {
  const rows = [
    row({ rank: 26, displayName: 'Later Name', identityStatus: 'lei_only' }),
    row({ rank: 27, displayName: 'Earlier Profile', identityStatus: 'public_profile', href: '/lenders/earlier' }),
  ];
  const result = execution({
    nameCandidates: { suppliedName: 'american', state: 'CANDIDATES', total: 40, unresolvedConditions: [] },
    rows,
    totalRows: 40,
    page: 2,
    pageSize: 25,
    pageCount: 2,
    sharePath: '/ask?q=american',
  });
  const markup = html(result);
  assert.match(markup, /Page 2 of 2 · 40 name candidate records/);
  assert.match(markup, /<a href="\/ask\?q=american&amp;page=1">Previous<\/a>/);
  assert.match(markup, /<span>Next<\/span>/);
  assert.ok(markup.indexOf('Later Name') < markup.indexOf('Earlier Profile'));
});

test('HMDA analytic results stay a research table', () => {
  const result = execution({
    query: { mode: 'entity', requestedMetric: 'most', geography: { grain: 'state', state: 'NJ', note: 'property' } },
    headline: 'Lenders with the most originations',
    rows: [row({
      displayName: 'Market Reporter',
      identityStatus: 'lei_only',
      lei: '549300MARKET000000001',
      metric: 17,
      metricLabel: 'Originations',
      whyMatched: ['2025 originations; source field total_originations; property geography NJ.'],
    })],
    period: '2025',
    grain: 'state-LEI-year',
  });
  const markup = html(result);
  assert.equal(isIdentityDiscovery(result), false);
  assert.match(markup, /data-ask-presentation="research"/);
  assert.match(markup, /hub-table/);
  assert.match(markup, /Market activity order/);
  assert.match(markup, />17</);
  assert.match(markup, /We interpreted your question as/);
  assert.match(markup, /Trace this result/);
  assert.doesNotMatch(markup, /data-ask-identity-cards|View lender profile/);
});

test('paid, review, and profile signals are not a sort key', () => {
  const result = execution({
    rows: [
      row({ rank: 1, displayName: 'No Profile First', identityStatus: 'lei_only', lei: '549300NOPROFILE0000001' }),
      row({ rank: 2, displayName: 'Public Profile Second', identityStatus: 'public_profile', href: '/lenders/public-second', nmls: '999' }),
    ],
  });
  const markup = html(result);
  assert.ok(markup.indexOf('No Profile First') < markup.indexOf('Public Profile Second'));
  assert.doesNotMatch(markup, /paid|review|Research Score|complaint count/i);
});

test('mobile identity markup has no table scroller', () => {
  const markup = html(execution({
    nameCandidates: { suppliedName: 'american', state: 'CANDIDATES', total: 1, unresolvedConditions: [] },
    rows: [row({ displayName: 'Wrapped Name', identityStatus: 'public_profile', href: '/lenders/wrapped', nmls: '2756', lei: '549300EXAMPLELEI00001' })],
  }));
  assert.doesNotMatch(markup, /hub-table-scroll|hub-table/);
  assert.match(markup, /overflow-wrap:anywhere|\[overflow-wrap:anywhere\]/);
  assert.match(markup, /min-h-11/);
});

test('live american name search keeps catalog order and the required identities', () => {
  const result = executeAskQuery({ q: 'american', pageSize: 25 });
  assert.ok(result.nameCandidates);
  assert.equal(isIdentityDiscovery(result), true);
  assert.deepEqual(result.rows?.map((item) => item.rank), result.rows?.map((_, index) => index + 1));
  const markup = html(result);
  assert.match(markup, /data-ask-identity-cards/);
  assert.doesNotMatch(markup, /hub-table/);
  const federal = result.rows?.find((item) => item.nmls === '2756');
  const financial = result.rows?.find((item) => item.nmls === '226068');
  const bank = result.rows?.find((item) => item.lei === '549300T03X096VF60C57');
  const names = result.rows?.map((item) => item.displayName) ?? [];
  assert.ok(federal, `missing NMLS 2756 in ${names.join(' | ')}`);
  assert.ok(financial, `missing NMLS 226068 in ${names.join(' | ')}`);
  assert.ok(bank, `missing LEI 549300T03X096VF60C57 in ${names.join(' | ')}`);
  assert.equal(federal!.displayName, 'AMERICAN FEDERAL MORTGAGE CORPORATION');
  assert.equal(financial!.displayName, 'AMERICAN FINANCIAL MORTGAGE SERVICES, INC.');
  assert.equal(bank!.displayName, 'American Bank & Trust');
  assert.ok(federal!.href);
  assert.ok(financial!.href);
  assert.equal(bank!.href, undefined);
  assert.ok(bank!.officialHref?.includes('549300T03X096VF60C57'));
  assert.match(markup, /AMERICAN FEDERAL MORTGAGE CORPORATION/);
  assert.match(markup, /#2756/);
  assert.match(markup, /549300T03X096VF60C57/);
  const bankAt = markup.indexOf('American Bank');
  const bankCard = markup.slice(bankAt, markup.indexOf('</article>', bankAt));
  assert.doesNotMatch(bankCard, /View lender profile|data-ask-card-nav="profile"/);
  const hold = executeAskQuery({ q: 'Guild Mortgage', pageSize: 5 });
  assert.equal(hold.rows?.[0]?.identityStatus, 'identity_hold');
  assert.equal(hold.rows?.[0]?.href, undefined);
  const holdMarkup = html(hold);
  assert.match(holdMarkup, /Identity hold/);
  assert.doesNotMatch(holdMarkup, /View lender profile/);
  const market = executeAskQuery({ q: 'Which lenders originated the most mortgages in Florida?' });
  assert.equal(isIdentityDiscovery(market), false);
  const marketMarkup = html(market);
  assert.match(marketMarkup, /hub-table/);
  assert.doesNotMatch(marketMarkup, /data-ask-identity-cards/);
});

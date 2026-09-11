import type { AskUrlOverrides } from './parse';
import type { LenderResearchQuery } from './types';

export const ASK_QUERY_LIMIT = 180;
export type AskQueryInput = { q: unknown; page?: unknown; pageSize?: unknown; overrides?: { action?: unknown; loanType?: unknown; geo?: unknown }; structuredQuery?: LenderResearchQuery };
export type ValidAskInput = { q: string; page: number; pageSize: number; overrides: AskUrlOverrides; structuredQuery?: LenderResearchQuery };
export function askInputFromParams(params: Record<string, string | string[] | undefined>): AskQueryInput {
  return { q: params.q ?? '', page: params.page, pageSize: params.pageSize, overrides: { action: params.action, loanType: params.loanType, geo: params.geo } };
}
export function validateAskInput(input: AskQueryInput): { value: ValidAskInput } | { error: string } {
  if (typeof input.q !== 'string' || !input.q.trim() || input.q.length > ASK_QUERY_LIMIT) return { error: 'Enter one research question of 1–180 characters. Duplicate query parameters are not supported.' };
  if (/<\/?(?:script|iframe|object|style)\b|(?:'|%27)\s*(?:or|and)\s+\d+\s*=\s*\d+|--\s*$|;\s*(?:drop|select|insert|delete)\b/i.test(input.q)) return { error: 'The research question contains unsupported input. Edit it and try again.' };
  const integer = (v: unknown, fallback: number, max: number) => v == null || v === '' ? fallback : ((typeof v === 'string' && /^\d+$/.test(v)) || typeof v === 'number') && Number.isSafeInteger(Number(v)) && Number(v) >= 1 && Number(v) <= max ? Number(v) : null;
  const page = integer(input.page, 1, 200), pageSize = integer(input.pageSize, 25, 50);
  if (page == null || pageSize == null) return { error: 'Use a whole page number from 1–200 and a page size from 1–50.' };
  const overrides: AskUrlOverrides = {};
  const enums = { action: ['', 'application', 'origination', 'denial'], loanType: ['', 'all', 'conventional', 'FHA', 'VA', 'USDA'], geo: ['', 'FL', 'broward', 'palm-beach'] };
  for (const key of ['action', 'loanType', 'geo'] as const) {
    const value = input.overrides?.[key];
    if (value != null && (typeof value !== 'string' || !enums[key].includes(value))) return { error: `Choose one supported ${key} filter.` };
    overrides[key] = typeof value === 'string' && value ? value : null;
  }
  return { value: { q: input.q, page, pageSize, overrides, structuredQuery: input.structuredQuery } };
}

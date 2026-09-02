export type PublicBusinessProfile = {
  contractVersion: 1 | 2;
  hub: "lender";
  nativeProfileId: string;
  managed: true;
  source: "BUSINESS_SUPPLIED";
  freshness: {
    state: "CURRENT" | "RECONFIRM_SOON" | "STALE";
    lastConfirmedAt: string;
    label: string;
    mayBeOutdated: boolean;
  };
  fields: Partial<
    Record<
      | "description"
      | "website"
      | "public_phone"
      | "public_email"
      | "founded_year"
      | "emergency_service"
      | "contact_context",
      string
    >
  >;
  services: string[];
  serviceAreas: string[];
  languages: string[];
  hours: Array<{
    weekday: number;
    closed: boolean;
    opensAt?: string;
    closesAt?: string;
  }>;
};
export type PublicBusinessReplies = {
  contractVersion: 1 | 2;
  hub: "lender";
  nativeProfileId: string;
  replies: Array<{
    id: string;
    replyType: string;
    targetType: string;
    targetRecordId: string | null;
    body: string;
    source: "BUSINESS_RESPONSE";
    publishedAt: string;
    updatedAt: string | null;
  }>;
};
const UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  FIELDS = new Set([
    "description",
    "website",
    "public_phone",
    "public_email",
    "founded_year",
    "emergency_service",
    "contact_context",
  ]);
const strings = (v: unknown) =>
  Array.isArray(v) &&
  v.length <= 30 &&
  v.every((x) => typeof x === "string" && x.length <= 120)
    ? (v as string[])
    : null;
export function parseBusinessProfile(
  v: unknown,
  id: string,
): PublicBusinessProfile | null {
  if (!v || typeof v !== "object" || !UUID.test(id)) return null;
  const r = v as Record<string, unknown>;
  if (
    ![1, 2].includes(Number(r.contractVersion)) ||
    r.hub !== "lender" ||
    r.nativeProfileId !== id ||
    r.managed !== true ||
    r.source !== "BUSINESS_SUPPLIED" ||
    !r.fields ||
    typeof r.fields !== "object" ||
    Array.isArray(r.fields)
  )
    return null;
  const f = r.fields as Record<string, unknown>;
  if (
    Object.keys(f).some((k) => !FIELDS.has(k)) ||
    Object.values(f).some((x) => typeof x !== "string") ||
    !strings(r.services) ||
    !strings(r.serviceAreas) ||
    !strings(r.languages) ||
    !Array.isArray(r.hours) ||
    !r.freshness ||
    typeof r.freshness !== "object"
  )
    return null;
  return r as unknown as PublicBusinessProfile;
}
export function parseReplies(
  v: unknown,
  id: string,
): PublicBusinessReplies | null {
  if (!v || typeof v !== "object" || !UUID.test(id)) return null;
  const r = v as Record<string, unknown>;
  if (
    ![1, 2].includes(Number(r.contractVersion)) ||
    r.hub !== "lender" ||
    r.nativeProfileId !== id ||
    !Array.isArray(r.replies) ||
    r.replies.length > 25
  )
    return null;
  for (const x of r.replies) {
    if (!x || typeof x !== "object") return null;
    const q = x as Record<string, unknown>;
    if (
      q.source !== "BUSINESS_RESPONSE" ||
      typeof q.body !== "string" ||
      q.body.length < 40 ||
      q.body.length > 3000 ||
      /<\/?[a-z][\s\S]*>/i.test(q.body)
    )
      return null;
  }
  return r as unknown as PublicBusinessReplies;
}
async function read(path: string, fetcher: typeof fetch) {
  try {
    const origin = (
      process.env.ATH_PUBLIC_PROFILE_ORIGIN || "https://www.asktrusthub.com"
    ).replace(/\/+$/, "");
    const r = await fetcher(`${origin}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
      headers: { accept: "application/json" },
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}
export async function fetchBusinessProfile(
  id: string,
  fetcher: typeof fetch = fetch,
) {
  return parseBusinessProfile(
    await read(
      `/api/public/profiles/lender/${encodeURIComponent(id)}`,
      fetcher,
    ),
    id,
  );
}
export async function fetchBusinessReplies(
  id: string,
  fetcher: typeof fetch = fetch,
) {
  return parseReplies(
    await read(
      `/api/public/profiles/lender/${encodeURIComponent(id)}/replies`,
      fetcher,
    ),
    id,
  );
}

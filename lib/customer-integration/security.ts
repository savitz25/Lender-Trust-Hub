const ALLOWED_WEBSITE_PROTOCOLS = new Set(["http:", "https:"]);

export function safeBusinessWebsite(value: string | null | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    return ALLOWED_WEBSITE_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function createClaimHandoffRedirect(token: string) {
  const target = new URL("https://www.asktrusthub.com/claim/continue");
  target.searchParams.set("handoff", token);
  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      Location: target.toString(),
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

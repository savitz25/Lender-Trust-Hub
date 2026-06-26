/**
 * Server-safe JSON-LD injection.
 * Keep schema builders in lib/{vertical}/seo.ts; render here on pages.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
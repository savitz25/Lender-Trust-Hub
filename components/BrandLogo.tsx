import Link from 'next/link';
import { BRAND, BRAND_LOGO } from '@/lib/brand';

/**
 * Header logo — official LTH transparent lockup (Phase 1).
 */
export function BrandLogo({
  href = '/',
  priority = false,
}: {
  href?: string;
  priority?: boolean;
}) {
  const load = priority ? 'eager' : 'lazy';

  const inner = (
    <span className="hub-logo-slot relative block shrink-0 bg-transparent">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_LOGO.headerSrc}
        alt={BRAND_LOGO.alt}
        width={BRAND_LOGO.width}
        height={BRAND_LOGO.height}
        className="h-full w-full object-contain object-left bg-transparent"
        loading={load}
        decoding="async"
        {...(priority ? { fetchPriority: 'high' as const } : {})}
      />
    </span>
  );

  if (!href) {
    return <div className="flex items-center">{inner}</div>;
  }

  return (
    <Link
      href={href}
      className="group flex shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2"
      aria-label={`${BRAND.name} — home`}
    >
      {inner}
    </Link>
  );
}

/** Footer logo on navy — lighten for contrast */
export function BrandLogoStacked({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_LOGO.footerSrc}
      alt={BRAND_LOGO.alt}
      width={BRAND_LOGO.width}
      height={BRAND_LOGO.height}
      className={`h-12 w-auto max-w-[192px] object-contain object-left ${className}`}
      loading="lazy"
      decoding="async"
      style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}
    />
  );
}

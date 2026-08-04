import Link from 'next/link';

/**
 * Header logo: full horizontal LenderTrustHub lockup (triangle mark + wordmark).
 * Source: Consumer Trust Hub brand pack — LenderTrustHub-logo-transparent.png
 * Matches Insurance/Move family (shared mark geometry; green "Trust Hub").
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
    <span className="flex min-w-0 max-w-[min(280px,70vw)] items-center sm:max-w-[300px] md:max-w-[340px]">
      <img
        src="/brand/LenderTrustHub-logo-transparent.png"
        srcSet="/brand/LenderTrustHub-logo-transparent.png 1x, /brand/lender-trust-hub-logo-header.png 1x"
        sizes="(max-width: 640px) 180px, (max-width: 768px) 220px, 260px"
        alt="Lender Trust Hub"
        width={480}
        height={151}
        className="h-10 w-auto max-h-11 object-contain object-left sm:h-11 md:h-12"
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
      className="group flex shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2"
      aria-label="Lender Trust Hub — home"
    >
      {inner}
    </Link>
  );
}

/** Footer / compact logo (same horizontal lockup). */
export function BrandLogoStacked({ className = '' }: { className?: string }) {
  return (
    <img
      src="/brand/LenderTrustHub-logo-transparent.png"
      alt="Lender Trust Hub"
      width={600}
      height={150}
      className={`h-auto w-[140px] object-contain object-left py-1 sm:w-[180px] ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}

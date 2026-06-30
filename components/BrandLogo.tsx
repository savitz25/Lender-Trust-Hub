import Link from 'next/link';

/**
 * Lender Trust Hub logo — true-transparent PNG emblem + HTML wordmark.
 * Avoids composite PNG checkerboard artifacts; navy #0A2540 matches brand.
 */
export function BrandLogo({
  href = '/',
  priority = false,
}: {
  href?: string;
  priority?: boolean;
}) {
  const load = priority ? 'eager' : 'lazy';

  const emblem = (
    <img
      src="/brand/lender-trust-hub-icon-192.png"
      srcSet="/brand/lender-trust-hub-icon-192.png 192w, /brand/lender-trust-hub-icon.png 512w"
      sizes="(max-width: 640px) 36px, 44px"
      alt=""
      aria-hidden="true"
      width={192}
      height={192}
      className="h-9 w-9 shrink-0 object-contain md:h-11 md:w-11"
      loading={load}
      decoding="async"
    />
  );

  const wordmark = (
    <span className="flex min-w-0 flex-col leading-tight">
      <span className="truncate text-base font-bold tracking-tight text-[#0A2540] transition-colors group-hover:text-[#14B8A6] md:text-lg">
        Lender Trust Hub
      </span>
      <span className="hidden text-[10px] font-medium tracking-wider text-zinc-500 sm:block">
        VERIFIED LENDING DIRECTORIES
      </span>
    </span>
  );

  const content = (
    <span className="flex min-w-0 items-center gap-2.5 md:gap-3">
      {emblem}
      {wordmark}
    </span>
  );

  if (!href) {
    return <div className="flex items-center">{content}</div>;
  }

  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}

/** Stacked logo for footer — invert on dark backgrounds via className */
export function BrandLogoStacked({ className = '' }: { className?: string }) {
  return (
    <img
      src="/brand/lender-trust-hub-logo-stacked-sm.png"
      srcSet="/brand/lender-trust-hub-logo-stacked-sm.png 600w, /brand/lender-trust-hub-logo-stacked.png 1200w"
      sizes="(max-width: 640px) 100px, 140px"
      alt="Lender Trust Hub"
      width={600}
      height={600}
      className={`h-auto w-[100px] object-contain sm:w-[130px] ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}

/** Full horizontal PNG — use only where a single image asset is required (OG, email) */
export function BrandLogoHorizontalImage({ className = '' }: { className?: string }) {
  return (
    <img
      src="/brand/lender-trust-hub-logo-horizontal-sm.png"
      srcSet="/brand/lender-trust-hub-logo-horizontal-sm.png 600w, /brand/lender-trust-hub-logo-horizontal.png 1200w"
      sizes="(max-width: 1024px) 200px, 260px"
      alt="Lender Trust Hub"
      width={600}
      height={161}
      className={`h-10 w-auto max-w-[min(260px,50vw)] object-contain object-left md:h-12 ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}
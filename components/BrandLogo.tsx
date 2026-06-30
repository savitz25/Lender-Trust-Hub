import Link from 'next/link';

/**
 * Responsive Lender Trust Hub logo — transparent PNG, retina srcSet.
 * Horizontal on desktop (sm+); icon + label on mobile (320px+).
 */
export function BrandLogo({
  href = '/',
  priority = false,
}: {
  href?: string;
  priority?: boolean;
}) {
  const desktopLogo = (
    <img
      src="/brand/lender-trust-hub-logo-horizontal-sm.png"
      srcSet="/brand/lender-trust-hub-logo-horizontal-sm.png 600w, /brand/lender-trust-hub-logo-horizontal.png 1200w"
      sizes="(max-width: 1024px) 220px, 280px"
      alt="Lender Trust Hub — verified lending directories"
      width={600}
      height={161}
      className="hidden h-10 w-auto max-w-[min(280px,42vw)] object-contain object-left transition-opacity group-hover:opacity-90 sm:block md:h-12"
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );

  const mobileLogo = (
    <span className="flex min-w-0 items-center gap-2 sm:hidden">
      <img
        src="/brand/lender-trust-hub-icon-192.png"
        srcSet="/brand/lender-trust-hub-icon-192.png 192w, /brand/lender-trust-hub-icon.png 512w"
        sizes="36px"
        alt=""
        aria-hidden="true"
        width={192}
        height={192}
        className="h-9 w-9 shrink-0 object-contain"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-bold tracking-tight text-[#0A2540] transition-colors group-hover:text-[#14B8A6]">
          Lender Trust Hub
        </span>
        <span className="text-[9px] font-medium tracking-wider text-zinc-500">
          VERIFIED DIRECTORIES
        </span>
      </span>
    </span>
  );

  const content = (
    <>
      {desktopLogo}
      {mobileLogo}
    </>
  );

  if (!href) return <div className="flex items-center">{content}</div>;

  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}

/** Stacked logo for footer or compact placements */
export function BrandLogoStacked({ className = '' }: { className?: string }) {
  return (
    <img
      src="/brand/lender-trust-hub-logo-stacked-sm.png"
      srcSet="/brand/lender-trust-hub-logo-stacked-sm.png 600w, /brand/lender-trust-hub-logo-stacked.png 1200w"
      sizes="(max-width: 640px) 120px, 160px"
      alt="Lender Trust Hub"
      width={600}
      height={600}
      className={`h-auto w-[120px] object-contain sm:w-[140px] ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}
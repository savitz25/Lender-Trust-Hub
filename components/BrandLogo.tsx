import Link from 'next/link';

/**
 * Header-optimized Lender Trust Hub logo.
 * Uses padded nav PNG (full icon + wordmark, no bottom clip) on desktop;
 * compact emblem + text on very small screens.
 */
export function BrandLogo({
  href = '/',
  priority = false,
}: {
  href?: string;
  priority?: boolean;
}) {
  const load = priority ? 'eager' : 'lazy';

  /* Desktop / tablet: single horizontal asset with built-in vertical padding */
  const navLogo = (
    <img
      src="/brand/lender-trust-hub-logo-nav-sm.png"
      srcSet="/brand/lender-trust-hub-logo-nav-sm.png 600w, /brand/lender-trust-hub-logo-nav.png 1200w"
      sizes="(max-width: 640px) 200px, (max-width: 1024px) 240px, 280px"
      alt="Lender Trust Hub — verified lending directories"
      width={600}
      height={257}
      className="hidden h-12 w-auto max-w-[min(280px,55vw)] object-contain object-left py-0.5 sm:block md:h-14 md:max-h-16"
      loading={load}
      decoding="async"
    />
  );

  /* Mobile: emblem + HTML wordmark — avoids tiny horizontal PNG illegibility */
  const mobileLogo = (
    <span className="flex min-w-0 items-center gap-2.5 sm:hidden">
      <img
        src="/brand/lender-trust-hub-icon-192.png"
        srcSet="/brand/lender-trust-hub-icon-192.png 192w, /brand/lender-trust-hub-icon.png 512w"
        sizes="40px"
        alt=""
        aria-hidden="true"
        width={192}
        height={192}
        className="h-10 w-10 shrink-0 object-contain"
        loading={load}
        decoding="async"
      />
      <span className="flex min-w-0 flex-col justify-center gap-0.5 py-0.5">
        <span className="text-[15px] font-bold leading-snug tracking-tight text-[#0A2540] transition-colors group-hover:text-[#14B8A6]">
          Lender Trust Hub
        </span>
        <span className="text-[8px] font-medium leading-snug tracking-wider text-zinc-500">
          VERIFIED DIRECTORIES
        </span>
      </span>
    </span>
  );

  const inner = (
    <>
      {navLogo}
      {mobileLogo}
    </>
  );

  if (!href) {
    return <div className="flex items-center py-1">{inner}</div>;
  }

  return (
    <Link
      href={href}
      className="group flex shrink-0 items-center py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2 rounded-lg"
    >
      {inner}
    </Link>
  );
}

/** Stacked logo for footer */
export function BrandLogoStacked({ className = '' }: { className?: string }) {
  return (
    <img
      src="/brand/lender-trust-hub-logo-stacked-sm.png"
      srcSet="/brand/lender-trust-hub-logo-stacked-sm.png 600w, /brand/lender-trust-hub-logo-stacked.png 1200w"
      sizes="(max-width: 640px) 110px, 140px"
      alt="Lender Trust Hub"
      width={600}
      height={600}
      className={`h-auto w-[110px] object-contain py-1 sm:w-[140px] ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}
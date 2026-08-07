'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, ChevronDown, Bookmark, LogOut } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { SearchBar } from '@/components/SearchBar';
import { SwitchHubMenu } from '@/components/switch-hub-menu';
import { Button } from '@/components/ui/button';
import { useMyLendingOptional } from '@/components/my-lending/my-lending-provider';
import { FDIC_CATEGORY, MORTGAGE_CATEGORY, AUTO_CATEGORY } from '@/lib/directory/categories';
import {
  LENDER_BRAND,
  LENDER_HEADER_CTA,
  LENDER_HEADER_NAV,
} from '@/lib/design/lender-design-system';
import { guestSavedCount } from '@/lib/my-lending/storage';
import { cn } from '@/lib/utils';

/**
 * Lender header — Phase 1 design system.
 * Logo · finance nav · My Lending · Calculators CTA · Switch Hub.
 */
export default function Navbar() {
  const pathname = usePathname() || '/';
  const [isOpen, setIsOpen] = useState(false);
  const [directoriesOpen, setDirectoriesOpen] = useState(false);
  const [accountBadge, setAccountBadge] = useState(0);
  const ml = useMyLendingOptional();
  const signedIn = Boolean(ml?.user);
  const authReady = !ml?.loading;

  useEffect(() => {
    const sync = () => {
      if (!ml?.user) {
        setAccountBadge(0);
        return;
      }
      setAccountBadge(guestSavedCount());
    };
    sync();
    window.addEventListener('lth-my-lending-store', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('lth-my-lending-store', sync);
      window.removeEventListener('storage', sync);
    };
  }, [ml?.user]);

  const showBadge = authReady && signedIn && accountBadge > 0;

  async function handleSignOut() {
    await ml?.signOutLocal();
    setAccountBadge(0);
    setIsOpen(false);
  }

  const linkClass = (href: string) => {
    const active =
      pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
    return cn(
      'font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 rounded-sm',
      active ? 'text-[#0D9488]' : 'text-[#0A2540] hover:text-[#0D9488]'
    );
  };

  const myLendingButton = (
    <Link
      href="/my-lending"
      aria-label={showBadge ? `My Lending, ${accountBadge} saved items` : 'My Lending'}
      title={
        signedIn
          ? 'My Lending — financing research HQ'
          : 'My Lending — research passport (sign in optional on HQ)'
      }
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border bg-white px-3 text-xs font-semibold transition-colors"
      style={{
        borderColor: LENDER_BRAND.border,
        color: LENDER_BRAND.navy,
      }}
    >
      <Bookmark className="h-3.5 w-3.5" style={{ color: LENDER_BRAND.teal }} aria-hidden />
      <span className="hidden sm:inline">My Lending</span>
      {showBadge ? (
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums"
          style={{ backgroundColor: LENDER_BRAND.forest }}
        >
          {accountBadge > 99 ? '99+' : accountBadge}
        </span>
      ) : null}
    </Link>
  );

  return (
    <nav
      data-hub="lender"
      aria-label="Main navigation"
      className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90"
      style={{ borderColor: LENDER_BRAND.border }}
    >
      <div className="container mx-auto flex min-h-16 items-center justify-between gap-3 px-4 py-1 md:min-h-20">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <BrandLogo priority />
          <span
            className="hidden max-w-[6.5rem] text-[10px] font-semibold leading-tight tracking-wide xl:block"
            style={{ color: LENDER_BRAND.navy }}
          >
            Wealth &amp; finance
          </span>
        </div>

        <div className="hidden max-w-xs flex-1 lg:block xl:max-w-sm">
          <SearchBar className="[&_input]:h-10 [&_input]:border-[#E2E8F0] [&_input]:bg-white [&_input]:text-sm [&_button]:hidden" />
        </div>

        <div className="hidden items-center gap-3 text-sm lg:flex xl:gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setDirectoriesOpen(!directoriesOpen)}
              className="inline-flex items-center gap-1 font-semibold text-[#0A2540] hover:text-[#0D9488]"
              aria-expanded={directoriesOpen}
            >
              Directories <ChevronDown className="h-4 w-4" style={{ color: LENDER_BRAND.teal }} />
            </button>
            {directoriesOpen && (
              <div
                className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border bg-white py-2 shadow-lg"
                style={{ borderColor: LENDER_BRAND.border }}
              >
                <Link
                  href={MORTGAGE_CATEGORY.hubPath}
                  className="block px-4 py-2 text-sm font-medium text-[#0A2540] hover:bg-[#CCFBF1]/50 hover:text-[#0D9488]"
                  onClick={() => setDirectoriesOpen(false)}
                >
                  Mortgage Lenders
                </Link>
                <Link
                  href={FDIC_CATEGORY.hubPath}
                  className="block px-4 py-2 text-sm font-medium text-[#0A2540] hover:bg-[#CCFBF1]/50 hover:text-[#0D9488]"
                  onClick={() => setDirectoriesOpen(false)}
                >
                  FDIC Insured Banks
                </Link>
                <Link
                  href={AUTO_CATEGORY.hubPath}
                  className="block px-4 py-2 text-sm font-medium text-[#0A2540] hover:bg-[#CCFBF1]/50 hover:text-[#0D9488]"
                  onClick={() => setDirectoriesOpen(false)}
                >
                  Auto Loan Companies
                </Link>
              </div>
            )}
          </div>

          {LENDER_HEADER_NAV.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}

          {myLendingButton}

          <Link href={LENDER_HEADER_CTA.href} className="lth-cta h-9 px-4 text-xs sm:text-sm">
            {LENDER_HEADER_CTA.label}
          </Link>

          <SwitchHubMenu />
        </div>

        <div className="flex items-center gap-1.5 lg:hidden">
          <Link
            href="/my-lending"
            className="inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-1.5 py-1"
            style={{ color: LENDER_BRAND.teal }}
            aria-label={showBadge ? `My Lending, ${accountBadge} saved items` : 'My Lending'}
          >
            <span className="relative">
              <Bookmark className="h-4 w-4" aria-hidden />
              {showBadge ? (
                <span
                  className="absolute -right-2 -top-1 rounded-full px-1 text-[9px] font-semibold leading-none text-white tabular-nums"
                  style={{ backgroundColor: LENDER_BRAND.forest }}
                >
                  {accountBadge > 99 ? '99+' : accountBadge}
                </span>
              ) : null}
            </span>
            <span className="text-[10px] font-semibold leading-none">My Lending</span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2"
            style={{ color: LENDER_BRAND.navy }}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="border-t bg-white px-4 py-4 lg:hidden"
          style={{ borderColor: LENDER_BRAND.border }}
        >
          <SearchBar className="mb-4" />
          <div className="flex flex-col gap-1">
            {LENDER_HEADER_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-2 py-3 text-base font-semibold text-[#0A2540] hover:bg-[#CCFBF1]/50 hover:text-[#0D9488]"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={MORTGAGE_CATEGORY.hubPath}
              className="rounded-xl px-2 py-3 text-base font-semibold text-[#0A2540]"
              onClick={() => setIsOpen(false)}
            >
              Mortgage Lenders
            </Link>
            <Link
              href={FDIC_CATEGORY.hubPath}
              className="rounded-xl px-2 py-3 text-base font-semibold text-[#0A2540]"
              onClick={() => setIsOpen(false)}
            >
              FDIC Banks
            </Link>
            <Link
              href="/my-lending"
              className="flex items-center gap-2 rounded-xl px-2 py-3 font-semibold"
              style={{ color: LENDER_BRAND.teal }}
              onClick={() => setIsOpen(false)}
            >
              <Bookmark className="h-4 w-4" aria-hidden />
              My Lending
              {showBadge ? (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums"
                  style={{ backgroundColor: LENDER_BRAND.forest }}
                >
                  {accountBadge > 99 ? '99+' : accountBadge}
                </span>
              ) : null}
            </Link>
            {signedIn ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-2 py-3 text-left font-semibold text-[#0A2540]"
                onClick={() => void handleSignOut()}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            ) : null}
            <Link
              href={LENDER_HEADER_CTA.href}
              className="lth-cta mt-2 min-h-11 w-full"
              onClick={() => setIsOpen(false)}
            >
              {LENDER_HEADER_CTA.label}
            </Link>
            <div className="mt-3 border-t pt-3" style={{ borderColor: LENDER_BRAND.border }}>
              <p
                className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: LENDER_BRAND.teal }}
              >
                Switch Hub
              </p>
              <SwitchHubMenu className="w-full [&>button]:w-full [&>button]:justify-center" />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

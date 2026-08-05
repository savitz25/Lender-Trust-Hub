'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, ChevronDown, Bookmark, LogOut } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { useMyLendingOptional } from '@/components/my-lending/my-lending-provider';
import { FDIC_CATEGORY, MORTGAGE_CATEGORY, AUTO_CATEGORY } from '@/lib/directory/categories';
import { guestSavedCount } from '@/lib/my-lending/storage';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: MORTGAGE_CATEGORY.hubPath, label: 'Mortgage Lenders' },
  { href: FDIC_CATEGORY.hubPath, label: 'FDIC Banks' },
  { href: '/calculators', label: 'Calculators' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/about', label: 'Trust & Transparency' },
];

/**
 * Header account control:
 * - Logged out: “My Lending” only — no guest badge, no separate Sign in
 * - Logged in: badge only when shortlist count > 0 (session passport; cloud sync is Phase 4)
 * Sign-in lives on HQ / modal — not a second top-nav control.
 */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [directoriesOpen, setDirectoriesOpen] = useState(false);
  const [accountBadge, setAccountBadge] = useState(0);
  const ml = useMyLendingOptional();
  const signedIn = Boolean(ml?.user);
  const authReady = !ml?.loading;

  useEffect(() => {
    const sync = () => {
      // Never show guest local counts while logged out (or while session still loading).
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

  const myLendingButton = (
    <Link
      href="/my-lending"
      aria-label={
        showBadge ? `My Lending, ${accountBadge} saved items` : 'My Lending'
      }
      title={
        signedIn
          ? 'My Lending — financing research HQ'
          : 'My Lending — research passport (sign in optional on HQ)'
      }
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-[#0A2540] transition-colors hover:border-emerald-300 hover:bg-emerald-50/50"
    >
      <Bookmark className="h-3.5 w-3.5 text-emerald-700" aria-hidden />
      <span className="hidden sm:inline">My Lending</span>
      {showBadge ? (
        <span className="rounded-full bg-[#059669] px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
          {accountBadge > 99 ? '99+' : accountBadge}
        </span>
      ) : null}
    </Link>
  );

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white"
    >
      <div className="container mx-auto flex min-h-16 items-center justify-between gap-3 px-4 py-1 md:min-h-20">
        <BrandLogo priority />

        <div className="hidden max-w-xs flex-1 lg:block xl:max-w-sm">
          <SearchBar className="[&_input]:h-10 [&_input]:border-zinc-200 [&_input]:bg-white [&_input]:text-sm [&_button]:hidden" />
        </div>

        <div className="hidden items-center gap-4 text-sm md:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => setDirectoriesOpen(!directoriesOpen)}
              className="inline-flex items-center gap-1 font-medium text-zinc-600 hover:text-emerald-800"
              aria-expanded={directoriesOpen}
            >
              Directories <ChevronDown className="h-4 w-4" />
            </button>
            {directoriesOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-zinc-200 bg-white py-2 shadow-lg">
                <Link
                  href={FDIC_CATEGORY.hubPath}
                  className="block px-4 py-2 text-sm text-zinc-700 hover:bg-emerald-50 hover:text-emerald-900"
                  onClick={() => setDirectoriesOpen(false)}
                >
                  FDIC Insured Banks
                </Link>
                <Link
                  href={MORTGAGE_CATEGORY.hubPath}
                  className="block px-4 py-2 text-sm text-zinc-700 hover:bg-emerald-50 hover:text-emerald-900"
                  onClick={() => setDirectoriesOpen(false)}
                >
                  Mortgage Lenders
                </Link>
                <Link
                  href={AUTO_CATEGORY.hubPath}
                  className="block px-4 py-2 text-sm text-zinc-700 hover:bg-emerald-50 hover:text-emerald-900"
                  onClick={() => setDirectoriesOpen(false)}
                >
                  Auto Loan Companies
                </Link>
                <span className="block px-4 py-2 text-xs text-zinc-400">
                  Credit Repair · MCA soon
                </span>
              </div>
            )}
          </div>
          {navLinks.slice(2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-zinc-600 transition-colors hover:text-emerald-800"
            >
              {link.label}
            </Link>
          ))}
          {myLendingButton}
          <Link href="/calculators">
            <Button size="sm" variant="trust">
              Try Calculators
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          {/* Compact My Lending on mobile — same rules as desktop */}
          <Link
            href="/my-lending"
            className="inline-flex flex-col items-center justify-center gap-0.5 rounded-md px-1.5 py-1 text-emerald-800"
            aria-label={
              showBadge ? `My Lending, ${accountBadge} saved items` : 'My Lending'
            }
            title={
              signedIn
                ? 'My Lending'
                : 'My Lending — research passport (sign in optional on HQ)'
            }
          >
            <span className="relative">
              <Bookmark className="h-4 w-4" aria-hidden />
              {showBadge ? (
                <span className="absolute -right-2 -top-1 rounded-full bg-[#059669] px-1 text-[9px] font-semibold leading-none text-white tabular-nums">
                  {accountBadge > 99 ? '99+' : accountBadge}
                </span>
              ) : null}
            </span>
            <span className="text-[10px] font-semibold leading-none">My Lending</span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-[#0A2540]"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 md:hidden">
          <SearchBar className="mb-4" />
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium text-zinc-700"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/my-lending"
              className="flex items-center gap-2 font-medium text-emerald-800"
              onClick={() => setIsOpen(false)}
            >
              <Bookmark className="h-4 w-4" aria-hidden />
              My Lending
              {showBadge ? (
                <span className="rounded-full bg-[#059669] px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                  {accountBadge > 99 ? '99+' : accountBadge}
                </span>
              ) : null}
            </Link>
            {/* Sign out only when signed in — no redundant Sign in (use HQ / modal) */}
            {signedIn ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 text-left font-medium text-zinc-700"
                onClick={() => void handleSignOut()}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            ) : null}
            <Link href="/calculators" onClick={() => setIsOpen(false)}>
              <Button variant="trust" className="w-full">
                Try Calculators
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, ChevronDown, Bookmark, LogIn, LogOut } from 'lucide-react';
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
 * Main header — always light white chrome (Insurance/Move parity).
 * No dark: variants; no inverted black nav.
 */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [directoriesOpen, setDirectoriesOpen] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  const ml = useMyLendingOptional();

  useEffect(() => {
    const sync = () => setBadgeCount(guestSavedCount());
    sync();
    window.addEventListener('lth-my-lending-store', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('lth-my-lending-store', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  async function handleSignOut() {
    await ml?.signOutLocal();
    setIsOpen(false);
  }

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
              className="inline-flex items-center gap-1 font-medium text-zinc-600 hover:text-[#0A2540] hover:text-emerald-800"
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
                <span className="block px-4 py-2 text-xs text-zinc-400">Credit Repair · MCA soon</span>
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
          <Link href="/my-lending">
            <Button size="sm" variant="outline" className="gap-1.5 border-zinc-200 bg-white">
              <Bookmark className="h-3.5 w-3.5 text-emerald-700" aria-hidden />
              My Lending
              {badgeCount > 0 ? (
                <span className="rounded-full bg-[#059669] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {badgeCount}
                </span>
              ) : null}
            </Button>
          </Link>
          {!ml?.user ? (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5"
              onClick={() => ml?.openAuth({ redirectPath: '/my-lending' })}
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign in</span>
            </Button>
          ) : null}
          <Link href="/calculators">
            <Button size="sm" variant="trust">
              Try Calculators
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
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
              {badgeCount > 0 ? (
                <span className="rounded-full bg-[#059669] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {badgeCount}
                </span>
              ) : null}
            </Link>
            {ml?.user ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 text-left font-medium text-zinc-700"
                onClick={() => void handleSignOut()}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            ) : (
              <button
                type="button"
                className="flex w-full items-center gap-2 text-left font-medium text-zinc-700"
                onClick={() => {
                  ml?.openAuth({ redirectPath: '/my-lending' });
                  setIsOpen(false);
                }}
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </button>
            )}
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

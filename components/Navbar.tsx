'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Bookmark, ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { SearchBar } from '@/components/SearchBar';
import { SwitchHubMenu } from '@/components/switch-hub-menu';
import { useMyLendingOptional } from '@/components/my-lending/my-lending-provider';
import { FDIC_CATEGORY, MORTGAGE_CATEGORY, AUTO_CATEGORY } from '@/lib/directory/categories';
import { LENDER_HEADER_NAV } from '@/lib/design/lender-design-system';
import { guestSavedCount } from '@/lib/my-lending/storage';
import { cn } from '@/lib/utils';

const XL_ONLY = new Set(['Methodology']);

const DIRECTORY_LINKS = [
  { href: MORTGAGE_CATEGORY.hubPath, label: 'Mortgage Lenders' },
  { href: FDIC_CATEGORY.hubPath, label: 'FDIC Insured Banks' },
  { href: AUTO_CATEGORY.hubPath, label: 'Auto Loan Companies' },
] as const;

const DRAWER_EXTRA = [
  { href: '/tools/loan-estimate-analyzer', label: 'Loan Estimate Analyzer' },
  { href: '/tools/compare-loan-estimates', label: 'Compare Loan Estimates' },
  { href: '/tools/program-finder', label: 'Program Finder' },
  { href: '/programs', label: 'FHA · VA · DPA Guides' },
] as const;

function navActive(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
}

/**
 * VISUAL-004 Lender network shell — one sticky header, 69 / 65 / 57.
 * No Ask Network bar. One Switch Hub.
 */
export default function Navbar() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const [directoriesOpen, setDirectoriesOpen] = useState(false);
  const [accountBadge, setAccountBadge] = useState(0);
  const drawerId = useId();
  const dirPanelId = useId();
  const dirRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const ml = useMyLendingOptional();
  const signedIn = Boolean(ml?.user);
  const authReady = !ml?.loading;

  useEffect(() => {
    const resetMenus = window.setTimeout(() => {
      setOpen(false);
      setDirectoriesOpen(false);
    }, 0);
    return () => window.clearTimeout(resetMenus);
  }, [pathname]);

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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!directoriesOpen) return;
    function onDoc(e: MouseEvent) {
      if (!dirRef.current?.contains(e.target as Node)) setDirectoriesOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDirectoriesOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [directoriesOpen]);

  const showBadge = authReady && signedIn && accountBadge > 0;

  async function handleSignOut() {
    await ml?.signOutLocal();
    setAccountBadge(0);
    setOpen(false);
  }

  const myLendingDesktop = (
    <Link
      href="/my-lending"
      aria-label={showBadge ? `My Lending, ${accountBadge} saved items` : 'My Lending'}
      title={
        signedIn
          ? 'My Lending — financing research HQ'
          : 'My Lending — research passport (sign in optional on HQ)'
      }
      className="th-btn-secondary"
    >
      <Bookmark className="h-4 w-4 shrink-0" aria-hidden />
      My Lending
      {showBadge ? (
        <span className="rounded-full bg-[#059669] px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
          {accountBadge > 99 ? '99+' : accountBadge}
        </span>
      ) : null}
    </Link>
  );

  return (
    <header data-hub="lender" className="th-header sticky top-0 z-50">
      <a href="#main-content" className="th-skip">
        Skip to content
      </a>
      <div className="th-header-inner th-shell">
        <BrandLogo />

        <nav aria-label="Primary" className="th-header-nav">
          <div ref={dirRef} className="relative">
            <button
              type="button"
              className={cn('th-nav-link', directoriesOpen && 'th-nav-link-active')}
              aria-expanded={directoriesOpen}
              aria-haspopup="menu"
              aria-controls={dirPanelId}
              onClick={() => setDirectoriesOpen((v) => !v)}
            >
              Directories
              <ChevronDown
                className={cn('h-3.5 w-3.5 shrink-0 transition-transform', directoriesOpen && 'rotate-180')}
                aria-hidden
              />
            </button>
            {directoriesOpen ? (
              <div
                id={dirPanelId}
                role="menu"
                className="th-network-panel absolute left-0 z-[80] mt-2 w-56"
              >
                {DIRECTORY_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className="th-drawer-link"
                    onClick={() => setDirectoriesOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {LENDER_HEADER_NAV.map((item) => {
            const active = navActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'th-nav-link',
                  XL_ONLY.has(item.label) && 'th-nav-xl',
                  active && 'th-nav-link-active',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="th-header-actions">
          {myLendingDesktop}
          <SwitchHubMenu />
        </div>

        <div className="th-header-mobile-actions">
          <Link
            href="/my-lending"
            className="th-btn-icon"
            aria-label={showBadge ? `My Lending, ${accountBadge} saved items` : 'My Lending'}
          >
            <span className="relative">
              <Bookmark className="h-5 w-5" aria-hidden />
              {showBadge ? (
                <span className="absolute -right-2 -top-1 rounded-full bg-[#059669] px-1 text-[9px] font-semibold leading-none text-white tabular-nums">
                  {accountBadge > 99 ? '99+' : accountBadge}
                </span>
              ) : null}
            </span>
          </Link>
          <button
            ref={menuRef}
            type="button"
            className="th-btn-icon"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={drawerId}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <>
          <button
            type="button"
            className="th-drawer-backdrop"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            id={drawerId}
            className="th-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Lender Trust Hub menu"
          >
            <nav aria-label="Mobile" className="flex flex-col">
              <SearchBar className="mb-3" />
              {DIRECTORY_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="th-drawer-link"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {LENDER_HEADER_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="th-drawer-link"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {DRAWER_EXTRA.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="th-drawer-link"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/my-lending"
                className="th-drawer-link"
                onClick={() => setOpen(false)}
              >
                My Lending
                {showBadge ? (
                  <span className="ml-2 rounded-full bg-[#059669] px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                    {accountBadge > 99 ? '99+' : accountBadge}
                  </span>
                ) : null}
              </Link>
              {signedIn ? (
                <button
                  type="button"
                  className="th-drawer-link w-full text-left"
                  onClick={() => void handleSignOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden />
                  Sign out
                </button>
              ) : null}
              <div className="mt-4 border-t border-[#E2E8F0] pt-4">
                <SwitchHubMenu variant="embedded" />
              </div>
            </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}

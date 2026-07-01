'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { SearchBar } from '@/components/SearchBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { FDIC_CATEGORY, MORTGAGE_CATEGORY, AUTO_CATEGORY } from '@/lib/directory/categories';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: MORTGAGE_CATEGORY.hubPath, label: 'Mortgage Lenders' },
  { href: FDIC_CATEGORY.hubPath, label: 'FDIC Banks' },
  { href: '/calculators', label: 'Calculators' },
  { href: '/about', label: 'Trust & Transparency' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [directoriesOpen, setDirectoriesOpen] = useState(false);

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95"
    >
      <div className="container mx-auto flex min-h-16 items-center justify-between gap-3 px-4 py-1 md:min-h-20">
        <BrandLogo priority />

        <div className="hidden max-w-xs flex-1 lg:block xl:max-w-sm">
          <SearchBar className="[&_input]:h-10 [&_input]:text-sm [&_button]:hidden" />
        </div>

        <div className="hidden items-center gap-4 text-sm md:flex">
          <ThemeToggle />
          <div className="relative">
            <button
              type="button"
              onClick={() => setDirectoriesOpen(!directoriesOpen)}
              className="inline-flex items-center gap-1 font-medium text-zinc-600 hover:text-[#0A2540]"
              aria-expanded={directoriesOpen}
            >
              Directories <ChevronDown className="h-4 w-4" />
            </button>
            {directoriesOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-zinc-200 bg-white py-2 shadow-lg">
                <Link
                  href={FDIC_CATEGORY.hubPath}
                  className="block px-4 py-2 text-sm hover:bg-zinc-50"
                  onClick={() => setDirectoriesOpen(false)}
                >
                  FDIC Insured Banks
                </Link>
                <Link
                  href={MORTGAGE_CATEGORY.hubPath}
                  className="block px-4 py-2 text-sm hover:bg-zinc-50"
                  onClick={() => setDirectoriesOpen(false)}
                >
                  Mortgage Lenders
                </Link>
                <Link
                  href={AUTO_CATEGORY.hubPath}
                  className="block px-4 py-2 text-sm hover:bg-zinc-50"
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
              className="font-medium text-zinc-600 transition-colors hover:text-[#0A2540]"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/calculators">
            <Button size="sm" variant="trust">
              Try Calculators
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
        <button
          type="button"
          className="rounded-lg p-2 text-[#0A2540] dark:text-zinc-200"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
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
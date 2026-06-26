'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/local-lenders', label: 'Find Lenders' },
  { href: '/fdic-insured-banks', label: 'FDIC Banks' },
  { href: '/calculators', label: 'Calculators' },
  { href: '/about', label: 'Trust & Transparency' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20">
        <Link href="/" className="group flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A2540] text-white">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-[#0A2540] group-hover:text-[#3B82F6] transition-colors">
              Lender Trust Hub
            </div>
            <div className="hidden text-[10px] font-medium tracking-wider text-zinc-500 sm:block">
              VERIFIED LOCAL LENDERS
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-6 text-sm md:flex">
          {navLinks.map((link) => (
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

        <button
          type="button"
          className="rounded-lg p-2 text-[#0A2540] md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 md:hidden">
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
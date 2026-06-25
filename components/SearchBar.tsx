'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCountyFromZip } from '@/lib/lenders';

export function SearchBar({ className }: { className?: string }) {
  const [zip, setZip] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }
    setError('');
    const county = getCountyFromZip(trimmed);
    if (county) {
      router.push(`/local-lenders/${county.stateSlug}/${county.countySlug}?zip=${trimmed}`);
    } else {
      router.push(`/local-lenders?zip=${trimmed}`);
    }
  }

  return (
    <form onSubmit={handleSearch} className={className} aria-label="Search lenders by ZIP code">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <MapPin
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          />
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            placeholder="Enter your ZIP code (e.g. 33301)"
            value={zip}
            onChange={(e) => {
              setZip(e.target.value.replace(/\D/g, '').slice(0, 5));
              setError('');
            }}
            className="h-14 w-full rounded-xl border border-zinc-200 bg-white pl-12 pr-4 text-base text-[#0A2540] shadow-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
            aria-label="ZIP code"
            aria-invalid={!!error}
            aria-describedby={error ? 'zip-error' : undefined}
          />
        </div>
        <Button type="submit" size="lg" className="h-14 gap-2 px-8">
          <Search className="h-5 w-5" aria-hidden="true" />
          Find Local Lenders
        </Button>
      </div>
      {error && (
        <p id="zip-error" className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
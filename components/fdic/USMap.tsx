'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface StateGeo {
  slug: string;
  name: string;
  code: string;
  path: string;
  curated?: boolean;
}

interface StatesFile {
  viewBox: string;
  states: StateGeo[];
}

export function USMap({
  selectedCode,
  availableCodes,
  onSelect,
}: {
  selectedCode: string | null;
  availableCodes: Set<string>;
  onSelect: (code: string, slug: string) => void;
}) {
  const [geo, setGeo] = useState<StatesFile | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    fetch('/geo/us-states.json')
      .then((r) => r.json())
      .then((d: StatesFile) => setGeo(d));
  }, []);

  if (!geo) {
    return (
      <div
        className="flex h-[320px] items-center justify-center rounded-2xl bg-zinc-100 md:h-[420px]"
        aria-label="Loading US map"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00A3A1] border-t-transparent" />
      </div>
    );
  }

  return (
    <svg
      viewBox={geo.viewBox}
      className="h-auto w-full max-h-[420px]"
      role="img"
      aria-label="Interactive map of United States. Click a state to view FDIC insured banks."
    >
      {geo.states.map((state) => {
        const isSelected = selectedCode === state.code;
        const isHovered = hovered === state.code;
        const hasData = availableCodes.has(state.code);
        const fill = isSelected
          ? '#00A3A1'
          : isHovered
            ? '#33b8b6'
            : hasData
              ? '#b2e0df'
              : '#e2e8f0';

        return (
          <motion.path
            key={state.code}
            d={state.path}
            fill={fill}
            stroke="#ffffff"
            strokeWidth={0.8}
            className="cursor-pointer transition-colors"
            animate={isSelected ? { scale: 1.02 } : { scale: 1 }}
            style={{ transformOrigin: 'center' }}
            onMouseEnter={() => setHovered(state.code)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(state.code, state.slug)}
            data-state={state.code}
            aria-label={`${state.name}${hasData ? ', data available' : ', coming soon'}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(state.code, state.slug);
              }
            }}
          />
        );
      })}
    </svg>
  );
}
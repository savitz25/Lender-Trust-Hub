'use client';

import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface CalcSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  suffix?: string;
  tip?: string;
  className?: string;
}

export function CalcSlider({
  label, value, min, max, step, onChange, format, suffix, tip, className,
}: CalcSliderProps) {
  const display = format ? format(value) : `${value}${suffix ?? ''}`;
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm">
        <span className="font-medium text-[#0F172A] dark:text-zinc-200">
          {label}
          {tip && (
            <span className="ml-1 text-zinc-400" title={tip} aria-label={tip}>ⓘ</span>
          )}
        </span>
        <span className="font-bold text-emerald-600">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        aria-label={label}
      />
    </div>
  );
}
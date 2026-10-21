import type { Lender } from '@/lib/mockData';

type Props = {
  lenders: Lender[];
  selected: string[];
  onToggle: (id: string) => void;
};

/** Shared desktop and mobile lender list. No rating, star, or score slot. */
export function CompareLenderChoices({ lenders, selected, onToggle }: Props) {
  return (
    <div className="mx-auto mb-10 max-w-3xl space-y-3">
      {lenders.map((lender) => {
        const isSelected = selected.includes(lender.id);
        const atLimit = !isSelected && selected.length >= 3;
        return (
          <label
            key={lender.id}
            className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${
              isSelected
                ? 'border-[#059669] bg-emerald-50'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(lender.id)}
              disabled={atLimit}
              className="h-4 w-4 rounded border-zinc-300"
              aria-label={`Select ${lender.name} for comparison`}
            />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[#0A2540]">{lender.name}</div>
              <div className="text-xs text-zinc-500">
                {lender.county} County, {lender.state} · NMLS {lender.nmlsId}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}

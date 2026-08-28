'use client';

import { useMemo, useState } from 'react';

const ITEMS = [
  'Verify NMLS identity',
  'Review license/registration evidence',
  'Review HMDA/public market activity',
  'Review complaint evidence',
  'Review regulatory actions',
  'Compare a Loan Estimate',
  'Save research',
] as const;

export function LenderHomeChecklist() {
  const [checked, setChecked] = useState<boolean[]>(() => ITEMS.map(() => false));
  const done = useMemo(() => checked.filter(Boolean).length, [checked]);
  return (
    <div className="intel-checklist">
      <p className="intel-checklist__progress">
        You&apos;ve reviewed {done} of {ITEMS.length} research areas. This is your process — not a lender score.
      </p>
      <ul className="intel-checklist__list">
        {ITEMS.map((item, index) => (
          <li key={item}>
            <label>
              <input
                type="checkbox"
                checked={checked[index]}
                onChange={() =>
                  setChecked((prev) => prev.map((value, i) => (i === index ? !value : value)))
                }
              />
              {item}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

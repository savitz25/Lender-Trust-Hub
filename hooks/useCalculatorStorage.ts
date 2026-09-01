'use client';

import { useCallback, useEffect, useState } from 'react';

export function useCalculatorStorage<T extends Record<string, unknown>>(
  id: string,
  defaults: T,
): [T, (patch: Partial<T>) => void, () => void] {
  const key = `lth-calc-${id}`;
  const defaultsJson = JSON.stringify(defaults);

  const [state, setState] = useState<T>(defaults);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) setState({ ...(JSON.parse(defaultsJson) as T), ...JSON.parse(raw) });
      } catch {
        /* ignore */
      }
    }, 0);
    return () => window.clearTimeout(initialize);
  }, [defaultsJson, key]);

  const update = useCallback(
    (patch: Partial<T>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [key],
  );

  const reset = useCallback(() => {
    setState(defaults);
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, [defaults, key]);

  return [state, update, reset];
}

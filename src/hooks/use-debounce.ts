// src/hooks/use-debounce.ts
// ============================================================
// DEBOUNCE HOOK
//
// @example
// const debouncedSearch = useDebounce(search, 400)
// useEffect(() => { refetch() }, [debouncedSearch])
// ============================================================

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

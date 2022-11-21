import { useEffect, useState } from 'react';

/**
 * Debounces the value by given amount of time
 * @param value Value to be debounced
 * @param delayMs Debounce delay
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

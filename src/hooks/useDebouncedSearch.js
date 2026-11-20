import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Reusable debounced search hook.
 * Returns the raw value, debounced value (default 300ms), setter, and clear function.
 */
export function useDebouncedSearch(initialValue = '', delay = 300) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setValue('');
    setDebouncedValue('');
  }, []);

  return {
    value,
    debouncedValue,
    setValue,
    clear,
  };
}

import { useEffect, useRef, useCallback } from 'react';

interface UsePersistenceOptions {
  debounceMs?: number;  // Default: 500ms
  onError?: (error: Error) => void;
}

export function usePersistence(options: UsePersistenceOptions = {}) {
  const { debounceMs = 500, onError } = options;
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<(() => Promise<void>) | null>(null);
  
  // Debounced save function
  const debouncedSave = useCallback((saveFn: () => Promise<void>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Store pending save
    pendingSaveRef.current = saveFn;
    
    // Schedule save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveFn();
        pendingSaveRef.current = null;
      } catch (error) {
        onError?.(error as Error);
      }
    }, debounceMs);
  }, [debounceMs, onError]);
  
  // Flush pending saves on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Execute pending save immediately
      if (pendingSaveRef.current) {
        pendingSaveRef.current().catch(onError);
      }
    };
  }, [onError]);
  
  return { debouncedSave };
}

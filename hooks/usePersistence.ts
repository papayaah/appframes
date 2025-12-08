import { useEffect, useRef, useCallback } from 'react';

interface UsePersistenceOptions {
  debounceMs?: number;  // Default: 500ms
  onError?: (error: Error) => void;
  maxRetries?: number;  // Default: 1
  retryDelayMs?: number;  // Default: 1000ms
}

export function usePersistence(options: UsePersistenceOptions = {}) {
  const { debounceMs = 500, onError, maxRetries = 1, retryDelayMs = 1000 } = options;
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<(() => Promise<void>) | null>(null);
  
  // Helper function to execute save with retry logic
  const executeSaveWithRetry = useCallback(async (saveFn: () => Promise<void>, retriesLeft: number = maxRetries) => {
    try {
      await saveFn();
      pendingSaveRef.current = null;
    } catch (error) {
      const err = error as Error;
      
      // Check if it's a quota exceeded error
      const isQuotaError = err.name === 'QuotaExceededError' || 
                          err.message?.includes('quota') ||
                          err.message?.includes('storage');
      
      // If quota error, don't retry - just report it
      if (isQuotaError) {
        console.error('Storage quota exceeded:', err);
        onError?.(new Error('QUOTA_EXCEEDED'));
        pendingSaveRef.current = null;
        return;
      }
      
      // For other errors, retry if we have retries left
      if (retriesLeft > 0) {
        console.warn(`Save failed, retrying in ${retryDelayMs}ms... (${retriesLeft} retries left)`, err);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        
        // Retry
        await executeSaveWithRetry(saveFn, retriesLeft - 1);
      } else {
        // No more retries, report the error
        console.error('Save failed after all retries:', err);
        onError?.(err);
        pendingSaveRef.current = null;
      }
    }
  }, [maxRetries, retryDelayMs, onError]);
  
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
      await executeSaveWithRetry(saveFn);
    }, debounceMs);
  }, [debounceMs, executeSaveWithRetry]);
  
  // Flush pending saves on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Execute pending save immediately (without retry to avoid delays on unmount)
      if (pendingSaveRef.current) {
        pendingSaveRef.current().catch((err) => {
          console.error('Failed to flush pending save on unmount:', err);
          onError?.(err);
        });
      }
    };
  }, [onError]);
  
  return { debouncedSave };
}

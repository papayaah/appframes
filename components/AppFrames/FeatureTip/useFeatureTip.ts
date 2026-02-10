'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '../../../stores/useAppStore';

interface UseFeatureTipOptions {
  /** Unique key for this tip, matches a key in the store's dismissedTips set */
  tipKey: string;
  /** Condition that must be true for the tip to show (e.g., "image was just placed") */
  enabled?: boolean;
  /** Delay in ms before showing the tip after enabled becomes true (default: 500) */
  delay?: number;
}

interface UseFeatureTipReturn {
  /** Whether the tip should currently be visible */
  visible: boolean;
  /** Call to permanently dismiss the tip */
  dismiss: () => void;
}

export function useFeatureTip({
  tipKey,
  enabled = true,
  delay = 500,
}: UseFeatureTipOptions): UseFeatureTipReturn {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTip = useAppStore((s) => s.dismissTip);
  const isDismissed = useAppStore((s) => s.dismissedTips.includes(tipKey));

  useEffect(() => {
    // Once visible, stay visible until explicitly dismissed — don't
    // hide when `enabled` becomes false (e.g. frame deselected).
    if (visible) return;

    if (enabled && !isDismissed) {
      timerRef.current = setTimeout(() => {
        setVisible(true);
      }, delay);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, isDismissed, delay, visible]);

  const dismiss = useCallback(() => {
    setVisible(false);
    dismissTip(tipKey);
  }, [dismissTip, tipKey]);

  return { visible, dismiss };
}

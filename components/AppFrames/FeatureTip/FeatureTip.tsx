'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Box, Text, Button, Transition, Portal, Group, CloseButton } from '@mantine/core';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';

/** Plays a specific frame segment from a Lottie animation using the imperative API */
function LottieSegment({
  animationData,
  segment,
  speed,
  onComplete,
}: {
  animationData: object;
  segment?: [number, number];
  speed?: number;
  onComplete: () => void;
}) {
  const ref = useRef<LottieRefCurrentProps | null>(null);

  useEffect(() => {
    const instance = ref.current;
    if (!instance) return;
    if (speed) instance.setSpeed(speed);
    if (segment) {
      instance.playSegments(segment, true);
    }
  }, [segment, speed]);

  return (
    <Lottie
      lottieRef={ref}
      animationData={animationData}
      loop={false}
      autoplay={!segment}
      onComplete={onComplete}
      style={{ width: 120, height: 120 }}
    />
  );
}

type AnimPhase = 'reveal' | 'pause' | 'loop';

export interface TipItem {
  /** Base name for the Lottie animation pair (without suffix) */
  animationBase: string;
  /** Title text (short, bold) */
  title: string;
  /** Description text (1-2 lines explaining the interaction) */
  description: string;
}

interface FeatureTipProps {
  /** Whether to show the tip */
  visible: boolean;
  /** Called when user dismisses the tip (after last page) */
  onDismiss: () => void;
  /** Array of tip pages to cycle through */
  tips: TipItem[];
  /** Position relative to the anchor - where the tip appears */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Anchor element ref to position near (optional - if omitted, renders inline) */
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** Pause duration in ms between loop cycles (default: 1500) */
  loopPause?: number;
}

export function FeatureTip({
  visible,
  onDismiss,
  tips,
  position = 'right',
  anchorRef,
  loopPause = 1500,
}: FeatureTipProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<AnimPhase>('reveal');
  const [playCount, setPlayCount] = useState(0);
  const [animCache, setAnimCache] = useState<Record<string, {
    data?: object;
    revealSegment?: [number, number];
    loopSegment?: [number, number];
  }>>({});
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [posStyle, setPosStyle] = useState<React.CSSProperties>({});

  const currentTip = tips[currentIndex];
  const isLastTip = currentIndex === tips.length - 1;
  const hasMultiple = tips.length > 1;

  // Load animation JSON and parse markers for reveal/loop segments
  useEffect(() => {
    if (!visible || !currentTip) return;
    const base = currentTip.animationBase;

    // Skip if already cached
    if (animCache[base]?.data) return;

    fetch(`/animations/${base}-in-reveal.json`)
      .then((r) => r.json())
      .then((data) => {
        // Parse Lottie markers to find reveal and loop segments
        const markers: Array<{ tm: number; cm: string; dr: number }> = data.markers ?? [];
        const revealMarker = markers.find((m: { cm: string }) => m.cm.includes('reveal'));
        const loopMarker = markers.find((m: { cm: string }) => m.cm.includes('hover') || m.cm.includes('loop'));

        const revealSegment: [number, number] = revealMarker
          ? [revealMarker.tm, revealMarker.tm + revealMarker.dr]
          : [data.ip ?? 0, data.op ?? 75];

        const loopSegment: [number, number] | undefined = loopMarker
          ? [loopMarker.tm, loopMarker.tm + loopMarker.dr]
          : undefined;

        // Find the true max frame from layer data (layers may extend beyond markers)
        const layers: Array<{ op?: number }> = data.layers ?? [];
        const maxLayerFrame = layers.reduce((max: number, l: { op?: number }) => Math.max(max, l.op ?? 0), 0);
        const maxMarkerFrame = Math.max(
          revealSegment[1],
          loopSegment ? loopSegment[1] : 0
        );
        const extendedData = { ...data, op: Math.max(maxLayerFrame, maxMarkerFrame) };

        setAnimCache((prev) => ({
          ...prev,
          [base]: { data: extendedData, revealSegment, loopSegment },
        }));
      })
      .catch(() => {});
  }, [visible, currentTip?.animationBase]);

  // Reset when becoming visible
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      setPhase('reveal');
      setPlayCount(0);
    }
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
    };
  }, [visible]);

  // Reset animation phase when switching tips
  useEffect(() => {
    setPhase('reveal');
    setPlayCount(0);
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }, [currentIndex]);

  // Position relative to anchor
  useEffect(() => {
    if (!visible || !anchorRef?.current) return;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const style: React.CSSProperties = { position: 'fixed', zIndex: 1000 };

      switch (position) {
        case 'right':
          style.left = rect.right + 12;
          style.top = rect.top + rect.height / 2;
          style.transform = 'translateY(-50%)';
          break;
        case 'left':
          style.right = window.innerWidth - rect.left + 12;
          style.top = rect.top + rect.height / 2;
          style.transform = 'translateY(-50%)';
          break;
        case 'top':
          style.left = rect.left + rect.width / 2;
          style.bottom = window.innerHeight - rect.top + 12;
          style.transform = 'translateX(-50%)';
          break;
        case 'bottom':
          style.left = rect.left + rect.width / 2;
          style.top = rect.bottom + 12;
          style.transform = 'translateX(-50%)';
          break;
      }

      setPosStyle(style);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [visible, anchorRef, position]);

  const cachedAnim = currentTip ? animCache[currentTip.animationBase] : undefined;
  const animData = cachedAnim?.data ?? null;
  const revealSegment = cachedAnim?.revealSegment;
  const loopSegment = cachedAnim?.loopSegment;

  // Fall back to reveal segment when no explicit loop marker exists
  const effectiveLoopSegment = loopSegment ?? revealSegment;

  // Use ref so the onComplete callback always sees latest segment
  const loopSegmentRef = useRef(effectiveLoopSegment);
  loopSegmentRef.current = effectiveLoopSegment;

  const handleComplete = useCallback(() => {
    const seg = loopSegmentRef.current;
    if (!seg) return;

    // Pause, then play/replay the loop animation
    setPhase('pause');
    pauseTimerRef.current = setTimeout(() => {
      setPhase('loop');
      setPlayCount((c) => c + 1);
    }, loopPause);
  }, [loopPause]);

  const handleNext = useCallback(() => {
    if (isLastTip) {
      onDismiss();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [isLastTip, onDismiss]);

  if (!visible || !currentTip) return null;

  const currentSegment = phase === 'loop' ? effectiveLoopSegment : revealSegment;
  const containerStyle: React.CSSProperties = anchorRef?.current
    ? posStyle
    : {};

  return (
    <Portal>
      <Transition mounted={visible} transition="slide-up" duration={200}>
        {(transitionStyles) => (
          <Box
            ref={tipRef}
            data-export-hide="true"
            style={{
              ...containerStyle,
              ...transitionStyles,
              position: containerStyle.position ?? 'relative',
              width: 280,
              backgroundColor: 'white',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              zIndex: containerStyle.zIndex ?? 1000,
            }}
          >
            {/* Close button */}
            <CloseButton
              size="sm"
              onClick={onDismiss}
              style={{ position: 'absolute', top: 8, right: 8 }}
              aria-label="Dismiss tip"
            />

            {/* Lottie animation */}
            {animData && phase !== 'pause' ? (
              <LottieSegment
                key={`${currentTip.animationBase}-${phase}-${playCount}`}
                animationData={animData}
                segment={currentSegment}
                speed={1.5}
                onComplete={handleComplete}
              />
            ) : (
              <Box style={{ width: 120, height: 120 }} />
            )}

            <Text fw={600} size="sm" ta="center">
              {currentTip.title}
            </Text>
            <Text size="xs" c="dimmed" ta="center" lh={1.4}>
              {currentTip.description}
            </Text>

            {/* Pagination dots */}
            {hasMultiple && (
              <Group gap={6} justify="center">
                {tips.map((_, i) => (
                  <Box
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: i === currentIndex ? '#228be6' : '#dee2e6',
                      transition: 'background-color 0.2s ease',
                    }}
                  />
                ))}
              </Group>
            )}

            <Group gap={8} mt={4}>
              {currentIndex > 0 && (
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => setCurrentIndex((i) => i - 1)}
                >
                  Back
                </Button>
              )}
              <Button
                variant="light"
                size="xs"
                onClick={handleNext}
              >
                {isLastTip ? 'Got it' : 'Next'}
              </Button>
            </Group>
          </Box>
        )}
      </Transition>
    </Portal>
  );
}

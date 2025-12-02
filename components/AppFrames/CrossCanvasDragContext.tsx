'use client';

import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';

interface CanvasBounds {
  screenIndex: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

interface DraggedDevice {
  screenIndex: number;
  frameIndex: number;
  // Current position offset in pixels (relative to its original position)
  offsetX: number;
  offsetY: number;
  // Device dimensions for overflow calculation
  deviceWidth: number;
  deviceHeight: number;
  // Original device position within the canvas
  originalX: number;
  originalY: number;
}

// Represents a device that spans across canvases (persisted after drag)
interface SharedDevice {
  sourceScreenIndex: number;
  frameIndex: number;
  // The overflow info for target canvas
  targetScreenIndex: number;
  clipLeft: number;
  clipRight: number;
  offsetX: number;
  offsetY: number;
}

interface CrossCanvasDragContextType {
  // Register a canvas's DOM bounds
  registerCanvas: (screenIndex: number, element: HTMLElement) => void;
  unregisterCanvas: (screenIndex: number) => void;

  // Drag tracking
  startDrag: (screenIndex: number, frameIndex: number, deviceWidth: number, deviceHeight: number, originalX: number, originalY: number) => void;
  updateDrag: (deltaX: number, deltaY: number) => void;
  endDrag: () => void;

  // Get overflow info for a specific canvas (during drag or from persisted shared devices)
  getOverflowForCanvas: (screenIndex: number) => {
    visible: boolean;
    clipLeft: number;
    clipRight: number;
    offsetX: number;
    offsetY: number;
    sourceScreenIndex: number;
    frameIndex: number;
  } | null;

  // State
  isDragging: boolean;
  draggedDevice: DraggedDevice | null;
  canvasBounds: Map<number, CanvasBounds>;
  sharedDevices: SharedDevice[];
}

const CrossCanvasDragContext = createContext<CrossCanvasDragContextType | null>(null);

export function CrossCanvasDragProvider({ children }: { children: ReactNode }) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedDevice, setDraggedDevice] = useState<DraggedDevice | null>(null);
  const [sharedDevices, setSharedDevices] = useState<SharedDevice[]>([]);
  const canvasBoundsRef = useRef<Map<number, CanvasBounds>>(new Map());
  const draggedDeviceRef = useRef<DraggedDevice | null>(null);
  const [, forceUpdate] = useState({});

  // Keep ref in sync with state
  draggedDeviceRef.current = draggedDevice;

  const registerCanvas = useCallback((screenIndex: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    canvasBoundsRef.current.set(screenIndex, {
      screenIndex,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  const unregisterCanvas = useCallback((screenIndex: number) => {
    canvasBoundsRef.current.delete(screenIndex);
  }, []);

  const startDrag = useCallback((
    screenIndex: number,
    frameIndex: number,
    deviceWidth: number,
    deviceHeight: number,
    originalX: number,
    originalY: number
  ) => {
    // Clear any existing shared device for this frame when starting a new drag
    setSharedDevices(prev => prev.filter(
      sd => !(sd.sourceScreenIndex === screenIndex && sd.frameIndex === frameIndex)
    ));
    setIsDragging(true);
    setDraggedDevice({
      screenIndex,
      frameIndex,
      offsetX: 0,
      offsetY: 0,
      deviceWidth,
      deviceHeight,
      originalX,
      originalY,
    });
  }, []);

  const updateDrag = useCallback((deltaX: number, deltaY: number) => {
    setDraggedDevice(prev => {
      if (!prev) return null;
      return {
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY,
      };
    });
    forceUpdate({});
  }, []);

  const endDrag = useCallback(() => {
    // Before ending drag, check if there's an overflow to persist
    // Use ref to get current value (avoids stale closure)
    const device = draggedDeviceRef.current;
    if (device) {
      const sourceCanvas = canvasBoundsRef.current.get(device.screenIndex);
      if (sourceCanvas) {
        // Check all registered canvases for potential overflow
        canvasBoundsRef.current.forEach((targetCanvas, targetScreenIndex) => {
          if (targetScreenIndex === device.screenIndex) return;

          // Calculate device position relative to source canvas
          const deviceRelativeLeft = device.originalX + device.offsetX;
          const deviceRelativeRight = deviceRelativeLeft + device.deviceWidth;
          const deviceRelativeTop = device.originalY + device.offsetY;

          // Check if device goes outside source canvas boundaries
          const exitsLeft = deviceRelativeLeft < 0;
          const exitsRight = deviceRelativeRight > sourceCanvas.width;

          // Determine if target canvas is adjacent
          const targetIsToRight = targetCanvas.left > sourceCanvas.right - 100;
          const targetIsToLeft = targetCanvas.right < sourceCanvas.left + 100;

          // Only persist if device exits toward the target canvas
          if ((targetIsToRight && exitsRight) || (targetIsToLeft && exitsLeft)) {
            let overflowAmount = 0;
            let clipLeft = 0;
            let clipRight = 0;
            let offsetX = 0;

            if (targetIsToRight && exitsRight) {
              overflowAmount = deviceRelativeRight - sourceCanvas.width;
              clipLeft = ((device.deviceWidth - overflowAmount) / device.deviceWidth) * 100;
              // Position so visible portion appears at left edge of target
              offsetX = -(device.deviceWidth - overflowAmount);
            } else if (targetIsToLeft && exitsLeft) {
              overflowAmount = Math.abs(deviceRelativeLeft);
              clipRight = ((device.deviceWidth - overflowAmount) / device.deviceWidth) * 100;
              // Position so visible portion appears at right edge of target
              offsetX = targetCanvas.width - overflowAmount;
            }

            if (overflowAmount > 0) {
              setSharedDevices(prev => {
                // Remove any existing shared device for this source frame to target
                const filtered = prev.filter(
                  sd => !(sd.sourceScreenIndex === device.screenIndex &&
                         sd.frameIndex === device.frameIndex &&
                         sd.targetScreenIndex === targetScreenIndex)
                );
                return [...filtered, {
                  sourceScreenIndex: device.screenIndex,
                  frameIndex: device.frameIndex,
                  targetScreenIndex,
                  clipLeft,
                  clipRight,
                  offsetX,
                  offsetY: deviceRelativeTop,
                }];
              });
            }
          }
        });
      }
    }
    setIsDragging(false);
    setDraggedDevice(null);
  }, []);

  const getOverflowForCanvas = useCallback((targetScreenIndex: number): {
    visible: boolean;
    clipLeft: number;
    clipRight: number;
    offsetX: number;
    offsetY: number;
    sourceScreenIndex: number;
    frameIndex: number;
  } | null => {
    // First check if we're actively dragging
    if (draggedDevice) {
      const sourceCanvas = canvasBoundsRef.current.get(draggedDevice.screenIndex);
      const targetCanvas = canvasBoundsRef.current.get(targetScreenIndex);

      if (!sourceCanvas || !targetCanvas) return null;
      if (draggedDevice.screenIndex === targetScreenIndex) return null;

      // Calculate device position relative to source canvas
      const deviceRelativeLeft = draggedDevice.originalX + draggedDevice.offsetX;
      const deviceRelativeRight = deviceRelativeLeft + draggedDevice.deviceWidth;
      const deviceRelativeTop = draggedDevice.originalY + draggedDevice.offsetY;

      // Check if device goes outside source canvas boundaries
      const exitsLeft = deviceRelativeLeft < 0;
      const exitsRight = deviceRelativeRight > sourceCanvas.width;

      // Determine if target canvas is adjacent (left or right of source)
      const targetIsToRight = targetCanvas.left > sourceCanvas.right - 100; // Allow some tolerance
      const targetIsToLeft = targetCanvas.right < sourceCanvas.left + 100;

      // Only show overflow if device exits toward the target canvas
      if (targetIsToRight && !exitsRight) return null;
      if (targetIsToLeft && !exitsLeft) return null;
      if (!targetIsToRight && !targetIsToLeft) return null;

      // Calculate how much of the device overflows outside the source canvas
      let overflowAmount = 0;
      let clipLeft = 0;
      let clipRight = 0;

      if (targetIsToRight && exitsRight) {
        // Device exits right edge of source canvas -> appears on LEFT edge of target
        overflowAmount = deviceRelativeRight - sourceCanvas.width;
        // Clip the portion that's still in the source canvas (clip from the LEFT side of the overflow)
        clipLeft = ((draggedDevice.deviceWidth - overflowAmount) / draggedDevice.deviceWidth) * 100;
      } else if (targetIsToLeft && exitsLeft) {
        // Device exits left edge of source canvas -> appears on RIGHT edge of target
        overflowAmount = Math.abs(deviceRelativeLeft);
        // Clip the portion that's still in the source canvas (clip from the RIGHT side of the overflow)
        clipRight = ((draggedDevice.deviceWidth - overflowAmount) / draggedDevice.deviceWidth) * 100;
      }

      if (overflowAmount <= 0) return null;

      // Calculate position in target canvas
      // When exiting right -> appears on LEFT edge of target (negative X to show clipped portion)
      // When exiting left -> appears on RIGHT edge of target
      let offsetX = 0;
      if (targetIsToRight) {
        // Position so the visible (right) portion of device appears at left edge of target
        // The device is clipped on the left, so we need negative offset to position correctly
        offsetX = -(draggedDevice.deviceWidth - overflowAmount);
      } else if (targetIsToLeft) {
        // Position so the visible (left) portion of device appears at right edge of target
        offsetX = targetCanvas.width - overflowAmount;
      }

      // Y position should match the device's vertical position in source canvas
      const offsetY = deviceRelativeTop;

      return {
        visible: true,
        clipLeft,
        clipRight,
        offsetX,
        offsetY,
        sourceScreenIndex: draggedDevice.screenIndex,
        frameIndex: draggedDevice.frameIndex,
      };
    }

    // If not dragging, check persisted shared devices
    const sharedDevice = sharedDevices.find(sd => sd.targetScreenIndex === targetScreenIndex);
    if (sharedDevice) {
      return {
        visible: true,
        clipLeft: sharedDevice.clipLeft,
        clipRight: sharedDevice.clipRight,
        offsetX: sharedDevice.offsetX,
        offsetY: sharedDevice.offsetY,
        sourceScreenIndex: sharedDevice.sourceScreenIndex,
        frameIndex: sharedDevice.frameIndex,
      };
    }

    return null;
  }, [draggedDevice, sharedDevices]);

  return (
    <CrossCanvasDragContext.Provider value={{
      registerCanvas,
      unregisterCanvas,
      startDrag,
      updateDrag,
      endDrag,
      getOverflowForCanvas,
      isDragging,
      draggedDevice,
      canvasBounds: canvasBoundsRef.current,
      sharedDevices,
    }}>
      {children}
    </CrossCanvasDragContext.Provider>
  );
}

export function useCrossCanvasDrag() {
  const context = useContext(CrossCanvasDragContext);
  if (!context) {
    throw new Error('useCrossCanvasDrag must be used within CrossCanvasDragProvider');
  }
  return context;
}

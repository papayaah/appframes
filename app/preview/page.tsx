'use client';

import { StorePreviewRenderer } from '@/components/AppFrames/StorePreviewRenderer';
import { InteractionLockProvider } from '@/components/AppFrames/InteractionLockContext';

export default function PreviewPage() {
  return (
    <InteractionLockProvider>
      <StorePreviewRenderer />
    </InteractionLockProvider>
  );
}



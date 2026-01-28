'use client';

import { Box } from '@mantine/core';
import type { CameraLayout } from '../../types';

interface CameraModuleProps {
  scale: number;
  layout: CameraLayout;
  flash: boolean;
}

export function CameraModule({ scale, layout, flash }: CameraModuleProps) {
  const renderCamera = (size: number, key?: string) => (
    <Box
      key={key}
      style={{
        width: size * scale,
        height: size * scale,
        borderRadius: '50%',
        backgroundColor: '#1a1a1a',
        border: `2px solid #333`,
        boxShadow: 'inset 0 0 4px rgba(0,0,0,0.5)',
      }}
    />
  );

  const renderFlash = () =>
    flash && (
      <Box
        style={{
          width: 8 * scale,
          height: 8 * scale,
          borderRadius: '50%',
          backgroundColor: '#f5e6a3',
        }}
      />
    );

  const renderSingle = () => (
    <Box
      style={{
        position: 'absolute',
        top: 20 * scale,
        left: 20 * scale,
        display: 'flex',
        alignItems: 'center',
        gap: 8 * scale,
      }}
    >
      {renderCamera(24)}
      {renderFlash()}
    </Box>
  );

  const renderDualVertical = () => (
    <Box
      style={{
        position: 'absolute',
        top: 20 * scale,
        left: 20 * scale,
        display: 'flex',
        flexDirection: 'column',
        gap: 8 * scale,
      }}
    >
      {renderCamera(24, '1')}
      {renderCamera(24, '2')}
      {renderFlash()}
    </Box>
  );

  const renderDualHorizontal = () => (
    <Box
      style={{
        position: 'absolute',
        top: 20 * scale,
        left: 20 * scale,
        display: 'flex',
        gap: 8 * scale,
        alignItems: 'center',
      }}
    >
      {renderCamera(24, '1')}
      {renderCamera(24, '2')}
      {renderFlash()}
    </Box>
  );

  const renderTripleTriangle = () => (
    <Box
      style={{
        position: 'absolute',
        top: 20 * scale,
        left: 20 * scale,
        display: 'flex',
        flexDirection: 'column',
        gap: 6 * scale,
      }}
    >
      <Box style={{ display: 'flex', gap: 6 * scale }}>
        {renderCamera(22, '1')}
        {renderCamera(22, '2')}
      </Box>
      <Box style={{ display: 'flex', gap: 6 * scale, alignItems: 'center' }}>
        {renderCamera(22, '3')}
        {renderFlash()}
      </Box>
    </Box>
  );

  const renderTripleVertical = () => (
    <Box
      style={{
        position: 'absolute',
        top: 20 * scale,
        left: 20 * scale,
        display: 'flex',
        flexDirection: 'column',
        gap: 6 * scale,
      }}
    >
      {renderCamera(22, '1')}
      {renderCamera(22, '2')}
      {renderCamera(22, '3')}
      {flash && <Box style={{ marginTop: 4 * scale }}>{renderFlash()}</Box>}
    </Box>
  );

  const renderTripleHorizontal = () => (
    <Box
      style={{
        position: 'absolute',
        top: 20 * scale,
        left: 20 * scale,
        display: 'flex',
        gap: 6 * scale,
        alignItems: 'center',
      }}
    >
      {renderCamera(22, '1')}
      {renderCamera(22, '2')}
      {renderCamera(22, '3')}
      {renderFlash()}
    </Box>
  );

  const renderQuadSquare = () => (
    <Box
      style={{
        position: 'absolute',
        top: 20 * scale,
        left: 20 * scale,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 6 * scale,
      }}
    >
      {renderCamera(20, '1')}
      {renderCamera(20, '2')}
      {renderCamera(20, '3')}
      {renderCamera(20, '4')}
      {flash && <Box style={{ marginTop: 4 * scale }}>{renderFlash()}</Box>}
    </Box>
  );

  const renderQuadVertical = () => (
    <Box
      style={{
        position: 'absolute',
        top: 20 * scale,
        left: 20 * scale,
        display: 'flex',
        flexDirection: 'column',
        gap: 5 * scale,
      }}
    >
      {renderCamera(20, '1')}
      {renderCamera(20, '2')}
      {renderCamera(20, '3')}
      {renderCamera(20, '4')}
      {flash && <Box style={{ marginTop: 4 * scale }}>{renderFlash()}</Box>}
    </Box>
  );

  const renderPenta = () => (
    <Box
      style={{
        position: 'absolute',
        top: 20 * scale,
        left: 20 * scale,
        display: 'flex',
        flexDirection: 'column',
        gap: 5 * scale,
      }}
    >
      <Box style={{ display: 'flex', gap: 5 * scale }}>
        {renderCamera(18, '1')}
        {renderCamera(18, '2')}
      </Box>
      <Box style={{ display: 'flex', gap: 5 * scale }}>
        {renderCamera(18, '3')}
        {renderCamera(18, '4')}
      </Box>
      <Box style={{ display: 'flex', gap: 5 * scale, alignItems: 'center' }}>
        {renderCamera(18, '5')}
        {renderFlash()}
      </Box>
    </Box>
  );

  const renderIslandSquare = () => (
    <Box
      style={{
        position: 'absolute',
        top: 20 * scale,
        left: 20 * scale,
        width: 75 * scale,
        height: 75 * scale,
        borderRadius: 18 * scale,
        backgroundColor: '#2a2a2a',
        padding: 8 * scale,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 6 * scale,
      }}
    >
      {renderCamera(22, '1')}
      {renderCamera(22, '2')}
      {renderCamera(22, '3')}
      {flash ? renderFlash() : <Box />}
    </Box>
  );

  const renderIslandCircle = () => (
    <Box
      style={{
        position: 'absolute',
        top: 20 * scale,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 70 * scale,
        height: 70 * scale,
        borderRadius: '50%',
        backgroundColor: '#2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4 * scale,
        padding: 8 * scale,
      }}
    >
      {renderCamera(20, '1')}
      <Box style={{ display: 'flex', gap: 4 * scale, alignItems: 'center' }}>
        {renderCamera(20, '2')}
        {flash && renderFlash()}
      </Box>
    </Box>
  );

  switch (layout) {
    case 'single':
      return renderSingle();
    case 'dual-vertical':
      return renderDualVertical();
    case 'dual-horizontal':
      return renderDualHorizontal();
    case 'triple-triangle':
      return renderTripleTriangle();
    case 'triple-vertical':
      return renderTripleVertical();
    case 'triple-horizontal':
      return renderTripleHorizontal();
    case 'quad-square':
      return renderQuadSquare();
    case 'quad-vertical':
      return renderQuadVertical();
    case 'penta':
      return renderPenta();
    case 'island-square':
      return renderIslandSquare();
    case 'island-circle':
      return renderIslandCircle();
    default:
      return renderSingle();
  }
}

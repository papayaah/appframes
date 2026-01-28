'use client';

import { Stack, Divider, Text } from '@mantine/core';
import type {
  DIYOptions,
  PhoneDIYOptions,
  FlipDIYOptions,
  FoldableDIYOptions,
  TabletDIYOptions,
  LaptopDIYOptions,
  DesktopDIYOptions,
  PhoneTopCutout,
  PhoneBottom,
  TabletTopCutout,
  TabletBottom,
  LaptopTopCutout,
} from './types';
import {
  ViewSelector,
  BezelSelector,
  CornerSelector,
  TopCutoutSelector,
  BottomSelector,
  CameraLayoutSelector,
  StandSelector,
  ChinSelector,
  BaseStyleSelector,
  HingeSelector,
  StateSelector,
  CoverScreenToggle,
  FlashToggle,
  AllInOneToggle,
} from './DIYOptions';

interface DIYSettingsPanelProps {
  options: DIYOptions;
  onChange: (options: DIYOptions) => void;
}

export function DIYSettingsPanel({ options, onChange }: DIYSettingsPanelProps) {
  switch (options.type) {
    case 'phone':
      return <PhoneSettings options={options} onChange={onChange} />;
    case 'flip':
      return <FlipSettings options={options} onChange={onChange} />;
    case 'foldable':
      return <FoldableSettings options={options} onChange={onChange} />;
    case 'tablet':
      return <TabletSettings options={options} onChange={onChange} />;
    case 'laptop':
      return <LaptopSettings options={options} onChange={onChange} />;
    case 'desktop':
      return <DesktopSettings options={options} onChange={onChange} />;
    default:
      return null;
  }
}

function PhoneSettings({
  options,
  onChange,
}: {
  options: PhoneDIYOptions;
  onChange: (options: DIYOptions) => void;
}) {
  const update = <K extends keyof PhoneDIYOptions>(key: K, value: PhoneDIYOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <Stack gap="sm">
      <ViewSelector value={options.view} onChange={(v) => update('view', v)} />
      <BezelSelector value={options.bezel} onChange={(v) => update('bezel', v)} />
      {options.view === 'front' && (
        <>
          <TopCutoutSelector
            value={options.topCutout}
            onChange={(v) => update('topCutout', v as PhoneTopCutout)}
            deviceType="phone"
          />
          <BottomSelector
            value={options.bottom}
            onChange={(v) => update('bottom', v as PhoneBottom)}
            deviceType="phone"
          />
        </>
      )}
      <CornerSelector value={options.corners} onChange={(v) => update('corners', v)} />
      {options.view === 'back' && (
        <>
          <Divider label="Camera" labelPosition="center" />
          <CameraLayoutSelector
            value={options.cameraLayout || 'single'}
            onChange={(v) => update('cameraLayout', v)}
          />
          <FlashToggle value={options.flash || false} onChange={(v) => update('flash', v)} />
        </>
      )}
    </Stack>
  );
}

function FlipSettings({
  options,
  onChange,
}: {
  options: FlipDIYOptions;
  onChange: (options: DIYOptions) => void;
}) {
  const update = <K extends keyof FlipDIYOptions>(key: K, value: FlipDIYOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <Stack gap="sm">
      <ViewSelector value={options.view} onChange={(v) => update('view', v)} />
      <BezelSelector
        value={options.bezel}
        onChange={(v) => update('bezel', v as 'thin' | 'standard')}
        options={['thin', 'standard']}
      />
      <CoverScreenToggle value={options.coverScreen} onChange={(v) => update('coverScreen', v)} />
      <CornerSelector
        value={options.corners}
        onChange={(v) => update('corners', v as 'rounded' | 'very-rounded')}
        options={['rounded', 'very-rounded']}
      />
    </Stack>
  );
}

function FoldableSettings({
  options,
  onChange,
}: {
  options: FoldableDIYOptions;
  onChange: (options: DIYOptions) => void;
}) {
  const update = <K extends keyof FoldableDIYOptions>(key: K, value: FoldableDIYOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <Stack gap="sm">
      <ViewSelector value={options.view} onChange={(v) => update('view', v)} />
      <StateSelector value={options.state} onChange={(v) => update('state', v)} />
      <BezelSelector
        value={options.bezel}
        onChange={(v) => update('bezel', v as 'thin' | 'standard')}
        options={['thin', 'standard']}
      />
      <CornerSelector
        value={options.corners}
        onChange={(v) => update('corners', v as 'rounded' | 'very-rounded')}
        options={['rounded', 'very-rounded']}
      />
    </Stack>
  );
}

function TabletSettings({
  options,
  onChange,
}: {
  options: TabletDIYOptions;
  onChange: (options: DIYOptions) => void;
}) {
  const update = <K extends keyof TabletDIYOptions>(key: K, value: TabletDIYOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <Stack gap="sm">
      <ViewSelector value={options.view} onChange={(v) => update('view', v)} />
      <BezelSelector value={options.bezel} onChange={(v) => update('bezel', v)} />
      {options.view === 'front' && (
        <>
          <TopCutoutSelector
            value={options.topCutout}
            onChange={(v) => update('topCutout', v as TabletTopCutout)}
            deviceType="tablet"
          />
          <BottomSelector
            value={options.bottom}
            onChange={(v) => update('bottom', v as TabletBottom)}
            deviceType="tablet"
          />
        </>
      )}
      <CornerSelector value={options.corners} onChange={(v) => update('corners', v)} />
      {options.view === 'back' && (
        <>
          <Divider label="Camera" labelPosition="center" />
          <CameraLayoutSelector
            value={options.cameraLayout || 'single'}
            onChange={(v) => update('cameraLayout', v)}
          />
          <FlashToggle value={options.flash || false} onChange={(v) => update('flash', v)} />
        </>
      )}
    </Stack>
  );
}

function LaptopSettings({
  options,
  onChange,
}: {
  options: LaptopDIYOptions;
  onChange: (options: DIYOptions) => void;
}) {
  const update = <K extends keyof LaptopDIYOptions>(key: K, value: LaptopDIYOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <Stack gap="sm">
      <BezelSelector value={options.bezel} onChange={(v) => update('bezel', v)} />
      <TopCutoutSelector
        value={options.topCutout}
        onChange={(v) => update('topCutout', v as LaptopTopCutout)}
        deviceType="laptop"
      />
      <CornerSelector
        value={options.corners}
        onChange={(v) => update('corners', v as 'sharp' | 'rounded')}
        options={['sharp', 'rounded']}
      />
      <Divider label="Keyboard" labelPosition="center" />
      <BaseStyleSelector value={options.baseStyle} onChange={(v) => update('baseStyle', v)} />
      <HingeSelector value={options.hinge} onChange={(v) => update('hinge', v)} />
    </Stack>
  );
}

function DesktopSettings({
  options,
  onChange,
}: {
  options: DesktopDIYOptions;
  onChange: (options: DIYOptions) => void;
}) {
  const update = <K extends keyof DesktopDIYOptions>(key: K, value: DesktopDIYOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <Stack gap="sm">
      <BezelSelector value={options.bezel} onChange={(v) => update('bezel', v)} />
      <CornerSelector
        value={options.corners}
        onChange={(v) => update('corners', v as 'sharp' | 'rounded')}
        options={['sharp', 'rounded']}
      />
      <Divider label="Stand & Base" labelPosition="center" />
      <StandSelector value={options.stand} onChange={(v) => update('stand', v)} />
      <ChinSelector value={options.chin} onChange={(v) => update('chin', v)} />
      <AllInOneToggle value={options.allInOne} onChange={(v) => update('allInOne', v)} />
    </Stack>
  );
}

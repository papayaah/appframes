'use client';

import type { ReactNode } from 'react';
import {
  IconAlertCircle,
  IconBrandGoogle,
  IconBrandReddit,
  IconBrandX,
  IconCheck,
  IconClock,
  IconLink,
  IconRefresh,
  IconShield,
  IconTrash,
  IconUnlink,
  IconUser,
  IconX,
} from '@tabler/icons-react';

import type { IconSet } from '@reactkits.dev/better-auth-connect';

function wrap(Icon: (props: { size?: number; className?: string }) => ReactNode) {
  return ({ size, className }: { size?: number; className?: string }) => <Icon size={size} className={className} />;
}

export const integrationIcons: IconSet = {
  Google: wrap(IconBrandGoogle),
  Reddit: wrap(IconBrandReddit),
  X: wrap(IconBrandX),
  AlertCircle: wrap(IconAlertCircle),
  RefreshCw: wrap(IconRefresh),
  Link: wrap(IconLink),
  Unlink: wrap(IconUnlink),
  Check: wrap(IconCheck),
  Close: wrap(IconX),
  User: wrap(IconUser),
  Clock: wrap(IconClock),
  Shield: wrap(IconShield),
  Trash2: wrap(IconTrash),
};


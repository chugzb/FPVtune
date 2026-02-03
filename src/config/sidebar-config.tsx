'use client';

import { Routes } from '@/routes';
import type { NestedMenuItem } from '@/types';
import {
  CircleUserRoundIcon,
  LayoutDashboardIcon,
  LockKeyholeIcon,
  Settings2Icon,
  ClipboardListIcon,
  TicketIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Get sidebar config with translations
 */
export function getSidebarLinks(): NestedMenuItem[] {
  const t = useTranslations('Dashboard');

  return [
    {
      title: t('dashboard.title'),
      icon: <LayoutDashboardIcon className="size-4 shrink-0" />,
      href: Routes.Dashboard,
      external: false,
    },
    {
      title: t('settings.title'),
      icon: <Settings2Icon className="size-4 shrink-0" />,
      items: [
        {
          title: t('settings.profile.title'),
          icon: <CircleUserRoundIcon className="size-4 shrink-0" />,
          href: Routes.SettingsProfile,
          external: false,
        },
        {
          title: t('settings.orders.title'),
          icon: <ClipboardListIcon className="size-4 shrink-0" />,
          href: Routes.SettingsOrders,
          external: false,
        },
        {
          title: t('settings.security.title'),
          icon: <LockKeyholeIcon className="size-4 shrink-0" />,
          href: Routes.SettingsSecurity,
          external: false,
        },
        {
          title: t('settings.promo.title'),
          icon: <TicketIcon className="size-4 shrink-0" />,
          href: '/admin/promo',
          external: false,
          authorizeOnly: ['admin'],
        },
      ],
    },
  ];
}

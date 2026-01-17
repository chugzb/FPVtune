'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/ui/logo';
import { websiteConfig } from '@/config/website';
import {
  LocaleLink,
  useLocalePathname,
  useLocaleRouter,
} from '@/i18n/navigation';
import { useLocaleStore } from '@/stores/locale-store';
import { type Locale, useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useTransition } from 'react';

function LocaleSwitcher() {
  const showLocaleSwitch = Object.keys(websiteConfig.i18n.locales).length > 1;
  if (!showLocaleSwitch) {
    return null;
  }

  const router = useLocaleRouter();
  const pathname = useLocalePathname();
  const params = useParams();
  const locale = useLocale();
  const { setCurrentLocale } = useLocaleStore();
  const [, startTransition] = useTransition();

  useEffect(() => {
    setCurrentLocale(locale);
  }, [locale, setCurrentLocale]);

  const setLocale = (nextLocale: Locale) => {
    setCurrentLocale(nextLocale);
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        { pathname, params },
        { locale: nextLocale }
      );
    });
  };

  const currentLocaleData =
    websiteConfig.i18n.locales[
      locale as keyof typeof websiteConfig.i18n.locales
    ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="px-3 py-1.5 text-xs font-medium border border-white/20 rounded-md hover:bg-white/10 transition-colors text-white/70 cursor-pointer flex items-center gap-1.5">
          {currentLocaleData?.flag && <span>{currentLocaleData.flag}</span>}
          <span>{currentLocaleData?.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(websiteConfig.i18n.locales).map(
          ([localeOption, data]) => (
            <DropdownMenuItem
              key={localeOption}
              onClick={() => setLocale(localeOption as Locale)}
              className="cursor-pointer"
            >
              {data.flag && <span className="mr-2">{data.flag}</span>}
              <span className="text-sm">{data.name}</span>
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MarketingNavbar() {
  const t = useTranslations('HomePage');

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#030304]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
        <LocaleLink href="/" className="flex items-center group">
          <Logo className="h-6 w-auto" />
        </LocaleLink>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
          <a href="/#features" className="hover:text-white transition-colors">
            {t('nav.features')}
          </a>
          <a
            href="/#how-it-works"
            className="hover:text-white transition-colors"
          >
            {t('nav.howItWorks')}
          </a>
          <LocaleLink
            href="/guides"
            className="hover:text-white transition-colors"
          >
            {t('nav.tutorials')}
          </LocaleLink>
        </div>
        <LocaleSwitcher />
      </div>
    </nav>
  );
}

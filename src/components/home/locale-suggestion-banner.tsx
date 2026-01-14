'use client';

import { websiteConfig } from '@/config/website';
import { useLocalePathname, useLocaleRouter } from '@/i18n/navigation';
import { useLocaleStore } from '@/stores/locale-store';
import { X } from 'lucide-react';
import { type Locale, useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

const LOCALE_SUGGESTION_DISMISSED_KEY = 'fpvtune_locale_suggestion_dismissed';

export function LocaleSuggestionBanner() {
  const [suggestedLocale, setSuggestedLocale] = useState<Locale | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const currentLocale = useLocale();
  const router = useLocaleRouter();
  const pathname = useLocalePathname();
  const params = useParams();
  const { setCurrentLocale } = useLocaleStore();
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem(LOCALE_SUGGESTION_DISMISSED_KEY);
    if (dismissed === currentLocale) {
      setIsDismissed(true);
      return;
    }

    // Detect browser language
    const browserLang = navigator.language.split('-')[0];
    const supportedLocales = Object.keys(websiteConfig.i18n.locales);

    // Map common language codes to supported locales
    const langMap: Record<string, string> = {
      zh: 'zh',
      en: 'en',
    };

    const mappedLocale = langMap[browserLang] || 'en';

    // If browser language differs from current locale and is supported
    if (
      mappedLocale !== currentLocale &&
      supportedLocales.includes(mappedLocale)
    ) {
      setSuggestedLocale(mappedLocale as Locale);
      setIsDismissed(false);
    }
  }, [currentLocale]);

  const handleSwitch = () => {
    if (!suggestedLocale) return;

    setCurrentLocale(suggestedLocale);
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        { pathname, params },
        { locale: suggestedLocale }
      );
    });
    setIsDismissed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem(LOCALE_SUGGESTION_DISMISSED_KEY, currentLocale);
    setIsDismissed(true);
  };

  if (isDismissed || !suggestedLocale) {
    return null;
  }

  const suggestedLocaleData =
    websiteConfig.i18n.locales[
      suggestedLocale as keyof typeof websiteConfig.i18n.locales
    ];
  const currentLocaleData =
    websiteConfig.i18n.locales[
      currentLocale as keyof typeof websiteConfig.i18n.locales
    ];

  // Messages based on suggested locale
  const messages: Record<string, { prompt: string; switchBtn: string }> = {
    zh: {
      prompt: '检测到您的浏览器语言为中文，是否切换到中文版本？',
      switchBtn: '切换到中文',
    },
    en: {
      prompt: 'Your browser language is English. Switch to English version?',
      switchBtn: 'Switch to English',
    },
  };

  const msg = messages[suggestedLocale] || messages.en;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-blue-600/95 backdrop-blur-sm border-b border-blue-500/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-white">
          <span>{suggestedLocaleData?.flag}</span>
          <span>{msg.prompt}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSwitch}
            className="px-3 py-1 text-xs font-medium bg-white text-blue-600 rounded hover:bg-blue-50 transition-colors"
          >
            {msg.switchBtn}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

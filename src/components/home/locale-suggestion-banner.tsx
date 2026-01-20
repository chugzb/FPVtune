'use client';

import { websiteConfig } from '@/config/website';
import { useLocalePathname, useLocaleRouter } from '@/i18n/navigation';
import { LOCALE_COOKIE_NAME } from '@/i18n/routing';
import { useLocaleStore } from '@/stores/locale-store';
import { X } from 'lucide-react';
import { type Locale, useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

const LOCALE_PREFERENCE_KEY = 'fpvtune_locale_preference';

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
    // Check if user has already made a language preference
    const savedPreference = localStorage.getItem(LOCALE_PREFERENCE_KEY);
    if (savedPreference) {
      // User has already chosen, don't show banner
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

    // Save user's language preference to localStorage
    localStorage.setItem(LOCALE_PREFERENCE_KEY, suggestedLocale);
    // Also set the cookie for next-intl to persist the preference
    document.cookie = `${LOCALE_COOKIE_NAME}=${suggestedLocale}; path=/; max-age=31536000; SameSite=Lax`;
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
    // Save current locale as user's preference (they chose to keep it)
    localStorage.setItem(LOCALE_PREFERENCE_KEY, currentLocale);
    // Also set the cookie for next-intl to persist the preference
    document.cookie = `${LOCALE_COOKIE_NAME}=${currentLocale}; path=/; max-age=31536000; SameSite=Lax`;
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
    <div className="fixed bottom-6 right-6 z-50 max-w-xs animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-[#0a0a0b] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{suggestedLocaleData?.flag}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/90 leading-relaxed">
                {msg.prompt}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleSwitch}
                  className="px-4 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {msg.switchBtn}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors"
                >
                  {suggestedLocale === 'zh' ? '保持当前' : 'Keep current'}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 text-white/40 hover:text-white transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

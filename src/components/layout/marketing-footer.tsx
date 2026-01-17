'use client';

import { Logo } from '@/components/ui/logo';
import { LocaleLink } from '@/i18n/navigation';
import { Github, Twitter } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function MarketingFooter() {
  const t = useTranslations('HomePage');
  const tMarketing = useTranslations('Marketing');

  return (
    <footer className="border-t border-white/5 py-12 bg-[#030304] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-8">
            <LocaleLink href="/" className="flex items-center">
              <Logo className="h-6 w-auto" />
            </LocaleLink>
            <p className="text-sm text-gray-500 hidden md:block">
              {t('landing.footer.tagline')}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="/#features"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {t('nav.features')}
            </a>
            <a
              href="/#how-it-works"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {t('nav.howItWorks')}
            </a>
            <LocaleLink
              href="/guides"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {t('nav.tutorials')}
            </LocaleLink>
          </div>
        </div>
        <div className="border-t border-white/5 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-xs text-gray-500">
              2025 {t('landing.footer.copyright')}
            </p>
            <div className="flex items-center gap-4 text-xs">
              <LocaleLink
                href="/privacy"
                className="text-gray-500 hover:text-white transition-colors"
              >
                {tMarketing('footer.legal.items.privacyPolicy')}
              </LocaleLink>
              <LocaleLink
                href="/terms"
                className="text-gray-500 hover:text-white transition-colors"
              >
                {tMarketing('footer.legal.items.termsOfService')}
              </LocaleLink>
              <LocaleLink
                href="/refund"
                className="text-gray-500 hover:text-white transition-colors"
              >
                {tMarketing('footer.legal.items.refundPolicy')}
              </LocaleLink>
              <LocaleLink
                href="/contact"
                className="text-gray-500 hover:text-white transition-colors"
              >
                {tMarketing('navbar.pages.items.contact.title')}
              </LocaleLink>
            </div>
          </div>
          <div className="flex gap-4">
            <a
              href="https://github.com/fpvtune"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com/fpvtune"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

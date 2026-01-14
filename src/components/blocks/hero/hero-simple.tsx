'use client';

import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';
import { ArrowRight, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function HeroSimple() {
  const t = useTranslations('HomePage.hero');

  return (
    <section className="relative py-20 lg:py-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* 标题 */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
          {t('title')}
        </h1>

        {/* 描述 */}
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('description')}
        </p>

        {/* CTA 按钮 */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="rounded-lg px-8">
            <LocaleLink href="/#tuning">
              <Upload className="mr-2 w-5 h-5" />
              {t('primary')}
            </LocaleLink>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-lg px-8"
          >
            <LocaleLink href="/docs">
              {t('secondary')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </LocaleLink>
          </Button>
        </div>
      </div>
    </section>
  );
}

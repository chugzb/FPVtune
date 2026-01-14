'use client';

import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';
import { ArrowRight, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';

// 方案D: 左对齐 + 大字体 + 极简
export default function HeroOptionD() {
  const t = useTranslations('HomePage.hero');

  return (
    <section className="relative min-h-[80vh] flex items-center bg-background">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-3xl">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-foreground leading-[0.95] tracking-tight mb-8">
            {t('titleLine1')} {t('titleLine2')}
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-xl">
            {t('description')}
          </p>

          <div className="flex gap-4 mb-16">
            <Button asChild size="lg" className="rounded-none px-8">
              <LocaleLink href="/#tuning">
                {t('primary')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </LocaleLink>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-none px-8"
            >
              <LocaleLink href="/docs">{t('secondary')}</LocaleLink>
            </Button>
          </div>

          <div className="flex gap-16 text-sm">
            <div>
              <div className="text-4xl font-bold text-foreground">10K+</div>
              <div className="text-muted-foreground mt-1">
                {t('stats.logs')}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-foreground">98%</div>
              <div className="text-muted-foreground mt-1">
                {t('stats.accuracy')}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-foreground">5s</div>
              <div className="text-muted-foreground mt-1">
                {t('stats.speed')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';
import { ArrowRight, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';

// 方案A: 居中布局 + 渐变背景 + 简洁
export default function HeroOptionA() {
  const t = useTranslations('HomePage.hero');

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-50 via-background to-background dark:from-violet-950/20 dark:via-background" />

      {/* 装饰圆 */}
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-violet-200/30 dark:bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
          AI-Powered Analysis
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-6">
          {t('titleLine1')}
          <br />
          <span className="text-primary">{t('titleLine2')}</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          {t('description')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button asChild size="lg" className="rounded-full px-8 text-base">
            <LocaleLink href="/#tuning">
              <Upload className="mr-2 w-5 h-5" />
              {t('primary')}
            </LocaleLink>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full px-8 text-base"
          >
            <LocaleLink href="/docs">
              {t('secondary')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </LocaleLink>
          </Button>
        </div>

        <div className="flex justify-center gap-12 text-center">
          <div>
            <div className="text-3xl font-bold text-foreground">10K+</div>
            <div className="text-sm text-muted-foreground">
              {t('stats.logs')}
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground">98%</div>
            <div className="text-sm text-muted-foreground">
              {t('stats.accuracy')}
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground">5s</div>
            <div className="text-sm text-muted-foreground">
              {t('stats.speed')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

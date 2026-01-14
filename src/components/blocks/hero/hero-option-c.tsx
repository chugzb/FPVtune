'use client';

import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';
import { ArrowRight, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';

// 方案C: 全宽深色背景 + 居中 + 简约
export default function HeroOptionC() {
  const t = useTranslations('HomePage.hero');

  return (
    <section className="relative min-h-[85vh] flex items-center bg-slate-950 text-white">
      {/* 微妙网格背景 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-8">
          {t('titleLine1')}
          <br />
          {t('titleLine2')}
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          {t('description')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            asChild
            size="lg"
            className="bg-white text-slate-900 hover:bg-slate-100 rounded-lg px-8"
          >
            <LocaleLink href="/#tuning">
              <Upload className="mr-2 w-5 h-5" />
              {t('primary')}
            </LocaleLink>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-slate-700 text-white hover:bg-slate-800 rounded-lg px-8"
          >
            <LocaleLink href="/docs">
              {t('secondary')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </LocaleLink>
          </Button>
        </div>

        <div className="inline-flex gap-12 px-8 py-6 rounded-2xl bg-slate-900/50 border border-slate-800">
          <div className="text-center">
            <div className="text-3xl font-bold">10K+</div>
            <div className="text-sm text-slate-500">{t('stats.logs')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">98%</div>
            <div className="text-sm text-slate-500">{t('stats.accuracy')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">5s</div>
            <div className="text-sm text-slate-500">{t('stats.speed')}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

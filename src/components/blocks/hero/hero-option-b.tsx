'use client';

import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';
import { ArrowRight, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';

// 方案B: 左右布局 + 深色卡片 + 代码风格
export default function HeroOptionB() {
  const t = useTranslations('HomePage.hero');

  return (
    <section className="relative min-h-[85vh] flex items-center bg-background">
      <div className="max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* 左侧 */}
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1]">
              {t('titleLine1')}
              <span className="text-primary"> {t('titleLine2')}</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-md">
              {t('description')}
            </p>

            <div className="flex gap-3">
              <Button asChild size="lg">
                <LocaleLink href="/#tuning">
                  <Upload className="mr-2 w-4 h-4" />
                  {t('primary')}
                </LocaleLink>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <LocaleLink href="/docs">
                  {t('secondary')}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </LocaleLink>
              </Button>
            </div>

            <div className="flex gap-10 pt-4">
              <div>
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-sm text-muted-foreground">
                  {t('stats.logs')}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">98%</div>
                <div className="text-sm text-muted-foreground">
                  {t('stats.accuracy')}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">5s</div>
                <div className="text-sm text-muted-foreground">
                  {t('stats.speed')}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧 - 终端风格卡片 */}
          <div className="bg-slate-900 rounded-xl p-6 font-mono text-sm shadow-2xl">
            <div className="flex gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="space-y-3 text-slate-300">
              <div>
                <span className="text-green-400">$</span> fpvtune analyze
                flight_001.bbl
              </div>
              <div className="text-slate-500">Analyzing blackbox log...</div>
              <div className="text-slate-500">Processing gyro data...</div>
              <div className="text-slate-500">Detecting noise profile...</div>
              <div className="mt-4 text-white">Analysis Complete</div>
              <div className="grid grid-cols-3 gap-4 mt-2 pt-4 border-t border-slate-700">
                <div>
                  <div className="text-slate-500">Roll P</div>
                  <div className="text-cyan-400">4.2</div>
                </div>
                <div>
                  <div className="text-slate-500">Roll I</div>
                  <div className="text-cyan-400">8.0</div>
                </div>
                <div>
                  <div className="text-slate-500">Roll D</div>
                  <div className="text-cyan-400">3.5</div>
                </div>
              </div>
              <div className="pt-2">
                <span className="text-green-400">$</span>{' '}
                <span className="animate-pulse">_</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';
import { ArrowRight, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function HeroSplit() {
  const t = useTranslations('HomePage.hero');

  return (
    <section className="relative min-h-[85vh] flex items-center bg-background">
      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* 左侧文字 */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
              {t('titleLine1')}
              <span className="block text-primary">{t('titleLine2')}</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              {t('description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild size="lg" className="rounded-lg px-6">
                <LocaleLink href="/#tuning">
                  <Upload className="mr-2 w-4 h-4" />
                  {t('primary')}
                </LocaleLink>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-lg px-6"
              >
                <LocaleLink href="/docs">
                  {t('secondary')}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </LocaleLink>
              </Button>
            </div>

            <div className="flex gap-8 pt-4 text-sm">
              <div>
                <div className="text-2xl font-semibold text-foreground">
                  10K+
                </div>
                <div className="text-muted-foreground">{t('stats.logs')}</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">
                  98%
                </div>
                <div className="text-muted-foreground">
                  {t('stats.accuracy')}
                </div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">5s</div>
                <div className="text-muted-foreground">{t('stats.speed')}</div>
              </div>
            </div>
          </div>

          {/* 右侧 - 数据波形可视化 */}
          <div className="relative h-[400px] lg:h-[450px]">
            <div className="absolute inset-0 bg-muted/30 rounded-2xl border overflow-hidden">
              {/* 顶部标签栏 */}
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">
                  blackbox_log_001.bbl
                </span>
              </div>

              {/* 波形区域 */}
              <div className="p-6 space-y-6">
                {/* Gyro 波形 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Gyro Roll
                    </span>
                    <span className="text-xs font-mono text-primary">
                      P: 4.2 | I: 8.0 | D: 3.5
                    </span>
                  </div>
                  <svg
                    className="w-full h-16"
                    viewBox="0 0 400 60"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,30 Q20,10 40,30 T80,30 T120,30 T160,30 T200,30 T240,30 T280,30 T320,30 T360,30 T400,30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-primary"
                    />
                    <path
                      d="M0,30 Q25,45 50,30 T100,30 T150,30 T200,30 T250,30 T300,30 T350,30 T400,30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-muted-foreground/50"
                    />
                  </svg>
                </div>

                {/* Motor 波形 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Motor Output
                    </span>
                    <span className="text-xs font-mono text-green-500">
                      Optimized
                    </span>
                  </div>
                  <svg
                    className="w-full h-16"
                    viewBox="0 0 400 60"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,45 L20,20 L40,40 L60,15 L80,35 L100,25 L120,45 L140,20 L160,40 L180,30 L200,35 L220,25 L240,40 L260,20 L280,35 L300,30 L320,40 L340,25 L360,35 L380,30 L400,35"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-green-500"
                    />
                  </svg>
                </div>

                {/* Filter 频谱 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Noise Spectrum
                    </span>
                    <span className="text-xs font-mono text-orange-500">
                      Filter: 120Hz
                    </span>
                  </div>
                  <div className="flex items-end gap-1 h-12">
                    {[
                      20, 35, 50, 70, 85, 60, 45, 30, 55, 75, 90, 65, 40, 25,
                      45, 60, 35, 20, 30, 15,
                    ].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-orange-500/60 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 底部状态 */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 border-t bg-muted/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Analysis complete
                  </span>
                  <span className="text-green-500 font-medium">
                    Ready to export
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

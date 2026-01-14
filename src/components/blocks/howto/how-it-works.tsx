'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Cpu, Download, FileUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function HowItWorks() {
  const t = useTranslations('HomePage.howItWorks');

  const steps = [
    {
      icon: FileUp,
      step: '1',
      title: t('step1.title'),
      description: t('step1.description'),
    },
    {
      icon: Cpu,
      step: '2',
      title: t('step2.title'),
      description: t('step2.description'),
    },
    {
      icon: Download,
      step: '3',
      title: t('step3.title'),
      description: t('step3.description'),
    },
  ];

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-5xl mx-auto px-6">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t('title')}
          </h2>
        </div>

        {/* 步骤 */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item, index) => (
            <Card key={index} className="relative">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary mb-2">
                    {t('stepLabel')} {item.step}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

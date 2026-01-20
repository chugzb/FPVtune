import { CheckCircle, Zap, Shield, FileText, Terminal, Mail } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { LocaleLink } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('PricingPage');
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function PricingPage() {
  const t = await getTranslations('PricingPage');

  return (
    <div className="min-h-screen bg-[#030304] text-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {t('title')}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Price Card */}
        <div className="bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/20 rounded-3xl p-8 sm:p-12 mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-green-500/30 bg-green-500/10">
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium text-green-400">
                  {t('badge')}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {t('productName')}
              </h2>
              <p className="text-gray-400">{t('productDesc')}</p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">$9.99</span>
                <span className="text-gray-500 line-through text-xl">$19.99</span>
              </div>
              <p className="text-sm text-green-400 mt-1">{t('discount')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('perAnalysis')}</p>
            </div>
          </div>

          <LocaleLink
            href="/tune"
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-b from-white to-gray-200 text-black font-semibold px-8 py-4 rounded-xl hover:scale-[1.02] transition-transform text-lg mb-8"
          >
            {t('cta')}
          </LocaleLink>

          {/* Features */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">{t('features.pid.title')}</p>
                <p className="text-sm text-gray-400">{t('features.pid.desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">{t('features.filter.title')}</p>
                <p className="text-sm text-gray-400">{t('features.filter.desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">{t('features.feedforward.title')}</p>
                <p className="text-sm text-gray-400">{t('features.feedforward.desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">{t('features.cli.title')}</p>
                <p className="text-sm text-gray-400">{t('features.cli.desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">{t('features.report.title')}</p>
                <p className="text-sm text-gray-400">{t('features.report.desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">{t('features.email.title')}</p>
                <p className="text-sm text-gray-400">{t('features.email.desc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-white mb-6 text-center">
            {t('howItWorks.title')}
          </h3>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <h4 className="font-medium text-white mb-2">{t('howItWorks.step1.title')}</h4>
              <p className="text-sm text-gray-400">{t('howItWorks.step1.desc')}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-400 font-bold">2</span>
              </div>
              <h4 className="font-medium text-white mb-2">{t('howItWorks.step2.title')}</h4>
              <p className="text-sm text-gray-400">{t('howItWorks.step2.desc')}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-400 font-bold">3</span>
              </div>
              <h4 className="font-medium text-white mb-2">{t('howItWorks.step3.title')}</h4>
              <p className="text-sm text-gray-400">{t('howItWorks.step3.desc')}</p>
            </div>
          </div>
        </div>

        {/* Guarantees */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium">{t('guarantees.refund.title')}</p>
              <p className="text-sm text-gray-400">{t('guarantees.refund.desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium">{t('guarantees.support.title')}</p>
              <p className="text-sm text-gray-400">{t('guarantees.support.desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Terminal className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium">{t('guarantees.compatible.title')}</p>
              <p className="text-sm text-gray-400">{t('guarantees.compatible.desc')}</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h3 className="text-xl font-bold text-white mb-6 text-center">
            {t('faq.title')}
          </h3>
          <div className="space-y-4">
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
              <h4 className="font-medium text-white mb-2">{t('faq.q1.question')}</h4>
              <p className="text-sm text-gray-400">{t('faq.q1.answer')}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
              <h4 className="font-medium text-white mb-2">{t('faq.q2.question')}</h4>
              <p className="text-sm text-gray-400">{t('faq.q2.answer')}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
              <h4 className="font-medium text-white mb-2">{t('faq.q3.question')}</h4>
              <p className="text-sm text-gray-400">{t('faq.q3.answer')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

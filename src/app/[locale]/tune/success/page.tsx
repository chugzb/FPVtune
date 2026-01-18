'use client';

import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  Download,
  FileText,
  Loader2,
  Mail,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type ProcessStep = 'generating' | 'sending' | 'completed';

function SuccessContent() {
  const t = useTranslations('TunePage.success');
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessStep>('generating');

  useEffect(() => {
    setMounted(true);

    // 模拟处理流程
    const timer1 = setTimeout(() => {
      setCurrentStep('sending');
    }, 3000); // 3秒后进入发送邮件阶段

    const timer2 = setTimeout(() => {
      setCurrentStep('completed');
    }, 6000); // 6秒后完成

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030304] via-[#0a0b0f] to-[#030304] text-white flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-[#030304]/80 backdrop-blur-xl relative z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-center items-center">
          <a
            href="/"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <Logo className="h-6 w-auto" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 relative z-10">
        <div
          className={cn(
            'max-w-lg w-full text-center space-y-8 transition-all duration-1000',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          {/* Success Icon with Animation */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-full flex items-center justify-center mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full animate-ping" />
              <CheckCircle
                className="w-12 h-12 text-green-400 relative z-10"
                strokeWidth={2.5}
              />
            </div>
            <Sparkles className="w-6 h-6 text-yellow-400 absolute top-0 right-1/3 animate-bounce" />
            <Sparkles className="w-4 h-4 text-blue-400 absolute bottom-2 left-1/3 animate-bounce delay-300" />
          </div>

          {/* Title with Gradient */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-gray-400 text-lg">{t('description')}</p>
          </div>

          {/* Order Number */}
          {orderNumber && (
            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 p-5 backdrop-blur-sm hover:border-white/30 transition-all group">
              <p className="text-sm text-gray-400 mb-2 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                {t('orderNumber')}
              </p>
              <p className="font-mono text-xl text-white tracking-wider">
                {orderNumber}
              </p>
            </div>
          )}

          {/* Status Cards with Dynamic Progress */}
          <div className="space-y-3">
            {/* Generating Report */}
            <div
              className={cn(
                'flex items-start gap-4 rounded-2xl p-5 backdrop-blur-sm transition-all group',
                currentStep === 'generating'
                  ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 hover:border-blue-400/50'
                  : 'bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform',
                  currentStep === 'generating'
                    ? 'bg-blue-500/20 group-hover:scale-110'
                    : 'bg-green-500/20'
                )}
              >
                {currentStep === 'generating' ? (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
              </div>
              <div className="text-left flex-1">
                <p
                  className={cn(
                    'text-base font-semibold mb-1',
                    currentStep === 'generating'
                      ? 'text-blue-300'
                      : 'text-green-300'
                  )}
                >
                  {currentStep === 'generating'
                    ? t('processing')
                    : 'Report Generated'}
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {currentStep === 'generating'
                    ? t('processingHint')
                    : 'AI analysis completed successfully'}
                </p>
              </div>
            </div>

            {/* Sending Email */}
            <div
              className={cn(
                'flex items-start gap-4 rounded-2xl p-5 backdrop-blur-sm transition-all group',
                currentStep === 'sending'
                  ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 hover:border-purple-400/50'
                  : currentStep === 'completed'
                    ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30'
                    : 'bg-gradient-to-br from-white/10 to-white/5 border border-white/20'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform',
                  currentStep === 'sending'
                    ? 'bg-purple-500/20 group-hover:scale-110'
                    : currentStep === 'completed'
                      ? 'bg-green-500/20'
                      : 'bg-white/10'
                )}
              >
                {currentStep === 'sending' ? (
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                ) : currentStep === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Mail className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="text-left flex-1">
                <p
                  className={cn(
                    'text-base font-semibold mb-1',
                    currentStep === 'sending'
                      ? 'text-purple-300'
                      : currentStep === 'completed'
                        ? 'text-green-300'
                        : 'text-gray-400'
                  )}
                >
                  {currentStep === 'sending'
                    ? 'Sending Email...'
                    : currentStep === 'completed'
                      ? 'Email Sent'
                      : t('emailSoon')}
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {currentStep === 'sending'
                    ? 'Delivering your report to your inbox'
                    : currentStep === 'completed'
                      ? 'Check your email for the complete report'
                      : t('emailHint')}
                </p>
              </div>
            </div>

            {/* PDF Report */}
            <div
              className={cn(
                'flex items-start gap-4 rounded-2xl p-5 backdrop-blur-sm transition-all group',
                currentStep === 'completed'
                  ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30'
                  : 'bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:border-white/30'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform',
                  currentStep === 'completed'
                    ? 'bg-green-500/20'
                    : 'bg-white/10 group-hover:scale-110'
                )}
              >
                {currentStep === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="text-left flex-1">
                <p
                  className={cn(
                    'text-base font-semibold mb-1',
                    currentStep === 'completed'
                      ? 'text-green-300'
                      : 'text-white'
                  )}
                >
                  {currentStep === 'completed'
                    ? 'PDF Report Ready'
                    : t('pdfReport')}
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {currentStep === 'completed'
                    ? 'Download from your email attachment'
                    : t('pdfHint')}
                </p>
              </div>
            </div>
          </div>

          {/* What's Next Section */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6 text-left">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-400" />
              What's Next?
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">1.</span>
                <span>Check your email for the detailed PID tuning report</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">2.</span>
                <span>Download the PDF attachment with CLI commands</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">3.</span>
                <span>
                  Connect your flight controller and apply the settings
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">4.</span>
                <span>Test fly and enjoy your improved tune!</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <a
              href="/"
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              {t('backToHome')}
            </a>
            <a
              href="/guides"
              className="flex-1 py-4 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition-all border border-white/20 hover:border-white/30"
            >
              View Guides
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030304] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

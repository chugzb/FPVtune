'use client';

import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Check,
  CheckCircle,
  Copy,
  Download,
  Loader2,
  Mail,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'failed';

interface AnalysisResult {
  analysis: {
    summary: string;
    issues: string[];
    recommendations: string[];
  };
  pid: {
    roll: { p: number; i: number; d: number; f: number };
    pitch: { p: number; i: number; d: number; f: number };
    yaw: { p: number; i: number; d: number; f: number };
  };
  filters: {
    gyro_lowpass_hz: number;
    gyro_lowpass2_hz: number;
    dterm_lowpass_hz: number;
    dterm_lowpass2_hz: number;
    dyn_notch_count: number;
    dyn_notch_q: number;
    dyn_notch_min_hz: number;
    dyn_notch_max_hz: number;
  };
  cli_commands: string;
}

interface OrderData {
  orderNumber: string;
  status: OrderStatus;
  email: string;
  problems: string;
  goals: string;
  flyingStyle: string;
  frameSize: string;
  analysis: AnalysisResult | null;
  cliCommands: string | null;
}

function SuccessContent() {
  const t = useTranslations('TunePage.success');
  const tResults = useTranslations('TunePage.wizard.results');
  const tStyles = useTranslations('TunePage.wizard.styles.items');
  const tFrames = useTranslations('TunePage.wizard.frames.items');
  const tProblems = useTranslations('TunePage.wizard.problems.items');
  const tGoals = useTranslations('TunePage.wizard.goals.items');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchOrderStatus = useCallback(async () => {
    if (!orderNumber) return;

    try {
      const response = await fetch(`/api/tune/order/${orderNumber}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError(t('error.notFound'));
        } else {
          setError(t('error.loadFailed'));
        }
        return;
      }

      const data = await response.json();
      setOrder(data.order);
    } catch {
      setError(t('error.loadFailed'));
    }
  }, [orderNumber, t]);

  useEffect(() => {
    setMounted(true);
    fetchOrderStatus();
  }, [fetchOrderStatus]);

  // 轮询订单状态
  useEffect(() => {
    if (!orderNumber || !order) return;
    if (order.status === 'completed' || order.status === 'failed') return;

    const interval = setInterval(fetchOrderStatus, 3000);
    return () => clearInterval(interval);
  }, [orderNumber, order, fetchOrderStatus]);

  // 当订单完成时自动显示结果
  useEffect(() => {
    if (order?.status === 'completed' && order.analysis) {
      setShowResults(true);
    }
  }, [order?.status, order?.analysis]);

  const handleCopy = async () => {
    if (!order?.analysis?.cli_commands) return;
    try {
      await navigator.clipboard.writeText(order.analysis.cli_commands);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    if (!order?.analysis?.cli_commands) return;
    const blob = new Blob([order.analysis.cli_commands], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fpvtune-${orderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 获取可读名称
  const getStyleName = (id: string) => {
    try {
      return tStyles(`${id}.name` as any);
    } catch {
      return id;
    }
  };

  const getFrameName = (id: string) => {
    try {
      return tFrames(`${id}.name` as any);
    } catch {
      return id;
    }
  };

  const getProblemNames = (ids: string) => {
    if (!ids) return [];
    return ids.split(', ').map((id) => {
      try {
        return tProblems(`${id.trim()}.name` as any);
      } catch {
        return id;
      }
    });
  };

  const getGoalNames = (ids: string) => {
    if (!ids) return [];
    return ids.split(', ').map((id) => {
      try {
        return tGoals(`${id.trim()}.name` as any);
      } catch {
        return id;
      }
    });
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#030304] text-white flex flex-col items-center justify-center px-6">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{error}</h1>
        <a
          href={`/${locale}/tune`}
          className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium transition-colors"
        >
          {t('newAnalysis')}
        </a>
      </div>
    );
  }

  // 显示结果页面
  if (showResults && order?.analysis) {
    return (
      <ResultsView
        order={order}
        tResults={tResults}
        locale={locale}
        copied={copied}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onBack={() => setShowResults(false)}
      />
    );
  }

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
            'max-w-lg w-full text-center space-y-6 transition-all duration-1000',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          {/* Success Icon */}
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-full flex items-center justify-center mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full animate-ping" />
              <CheckCircle
                className="w-10 h-10 text-green-400 relative z-10"
                strokeWidth={2.5}
              />
            </div>
            <Sparkles className="w-5 h-5 text-yellow-400 absolute top-0 right-1/3 animate-bounce" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-gray-400">{t('description')}</p>
          </div>

          {/* Order Number */}
          {orderNumber && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <p className="text-sm text-gray-400 mb-1 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                {t('orderNumber')}
              </p>
              <p className="font-mono text-lg text-white">{orderNumber}</p>
            </div>
          )}

          {/* Status Progress */}
          <div className="space-y-3">
            {/* Step 1: Payment */}
            <StatusCard
              icon={<CheckCircle className="w-5 h-5 text-green-400" />}
              title={t('status.paid')}
              hint={t('status.paidHint')}
              isActive={false}
              isCompleted={true}
            />

            {/* Step 2: Processing */}
            <StatusCard
              icon={getStatusIcon(
                order?.status === 'processing'
                  ? 'processing'
                  : order?.status === 'completed' || order?.status === 'failed'
                    ? 'completed'
                    : 'pending'
              )}
              title={t('status.processing')}
              hint={t('status.processingHint')}
              isActive={order?.status === 'processing'}
              isCompleted={
                order?.status === 'completed' || order?.status === 'failed'
              }
              isFailed={order?.status === 'failed'}
            />

            {/* Step 3: Email */}
            <StatusCard
              icon={
                order?.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Mail className="w-5 h-5 text-gray-400" />
                )
              }
              title={
                order?.status === 'completed'
                  ? t('emailSent')
                  : t('status.sendingEmail')
              }
              hint={
                order?.status === 'completed'
                  ? t('emailSentHint')
                  : t('status.sendingEmailHint')
              }
              isActive={false}
              isCompleted={order?.status === 'completed'}
            />
          </div>

          {/* User Configuration Summary */}
          {order && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-left">
              <h3 className="text-sm font-medium text-white mb-3">
                {t('yourConfig')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('problems')}</span>
                  <span className="text-white text-right max-w-[200px]">
                    {getProblemNames(order.problems).join(', ') || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('goals')}</span>
                  <span className="text-white text-right max-w-[200px]">
                    {getGoalNames(order.goals).join(', ') || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('flyingStyle')}</span>
                  <span className="text-white">
                    {getStyleName(order.flyingStyle)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('frameSize')}</span>
                  <span className="text-white">
                    {getFrameName(order.frameSize)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {order?.status === 'completed' && order.analysis && (
              <button
                type="button"
                onClick={() => setShowResults(true)}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 font-semibold transition-all"
              >
                {t('viewResults')}
              </button>
            )}
            <a
              href={`/${locale}`}
              className={cn(
                'py-3.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition-all border border-white/20',
                order?.status === 'completed' && order.analysis
                  ? 'flex-1'
                  : 'flex-1'
              )}
            >
              {t('backToHome')}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusCard({
  icon,
  title,
  hint,
  isActive,
  isCompleted,
  isFailed,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  isActive: boolean;
  isCompleted: boolean;
  isFailed?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-4 rounded-xl p-4 backdrop-blur-sm transition-all',
        isActive
          ? 'bg-blue-500/10 border border-blue-500/30'
          : isCompleted
            ? isFailed
              ? 'bg-red-500/10 border border-red-500/30'
              : 'bg-green-500/10 border border-green-500/30'
            : 'bg-white/5 border border-white/10'
      )}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
          isActive
            ? 'bg-blue-500/20'
            : isCompleted
              ? isFailed
                ? 'bg-red-500/20'
                : 'bg-green-500/20'
              : 'bg-white/10'
        )}
      >
        {icon}
      </div>
      <div className="text-left flex-1">
        <p
          className={cn(
            'text-sm font-medium mb-0.5',
            isActive
              ? 'text-blue-300'
              : isCompleted
                ? isFailed
                  ? 'text-red-300'
                  : 'text-green-300'
                : 'text-gray-400'
          )}
        >
          {title}
        </p>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
    </div>
  );
}

function ResultsView({
  order,
  tResults,
  locale,
  copied,
  onCopy,
  onDownload,
  onBack,
}: {
  order: OrderData;
  tResults: any;
  locale: string;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onBack: () => void;
}) {
  const result = order.analysis!;

  return (
    <div className="min-h-screen bg-[#030304] text-white">
      <header className="border-b border-white/5 bg-[#030304]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-16 flex justify-between items-center">
          <button
            type="button"
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Back
          </button>
          <Logo className="h-6 w-auto" />
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-1">{tResults('title')}</h1>
          <p className="text-gray-500 text-sm">{tResults('description')}</p>
        </div>

        {/* Analysis Summary */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="font-medium text-white mb-3 text-sm">
            {tResults('analysisSummary')}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {result.analysis.summary}
          </p>
        </div>

        {/* Issues Found */}
        {result.analysis.issues.length > 0 && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <h3 className="font-medium text-white mb-3 text-sm">
              {tResults('issuesIdentified')}
            </h3>
            <ul className="space-y-2">
              {result.analysis.issues.map((issue, i) => (
                <li key={i} className="text-gray-400 text-sm flex gap-2">
                  <span className="text-gray-500 flex-shrink-0">-</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {result.analysis.recommendations.length > 0 && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <h3 className="font-medium text-white mb-3 text-sm">
              {tResults('recommendations')}
            </h3>
            <ul className="space-y-2">
              {result.analysis.recommendations.map((rec, i) => (
                <li key={i} className="text-gray-400 text-sm flex gap-2">
                  <span className="text-gray-500 flex-shrink-0">-</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* PID Values */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10">
            <h3 className="font-medium text-white text-sm">
              {tResults('optimizedPID')}
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
              <div className="text-gray-500">{tResults('axis')}</div>
              <div className="text-gray-500">P</div>
              <div className="text-gray-500">I</div>
              <div className="text-gray-500">D</div>
            </div>
            <div className="space-y-2">
              {['roll', 'pitch', 'yaw'].map((axis) => (
                <div
                  key={axis}
                  className="grid grid-cols-4 gap-2 text-center bg-white/5 rounded-lg py-2.5"
                >
                  <div className="text-white text-sm">{tResults(axis)}</div>
                  <div className="text-white text-sm font-mono">
                    {result.pid[axis as keyof typeof result.pid].p}
                  </div>
                  <div className="text-white text-sm font-mono">
                    {result.pid[axis as keyof typeof result.pid].i}
                  </div>
                  <div className="text-white text-sm font-mono">
                    {result.pid[axis as keyof typeof result.pid].d}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Settings */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10">
            <h3 className="font-medium text-white text-sm">
              {tResults('filterSettings')}
            </h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{tResults('gyroLPF')}</span>
              <span className="text-white font-mono">
                {result.filters.gyro_lowpass_hz} Hz
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{tResults('dtermLPF')}</span>
              <span className="text-white font-mono">
                {result.filters.dterm_lowpass_hz} Hz
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{tResults('dynNotchCount')}</span>
              <span className="text-white font-mono">
                {result.filters.dyn_notch_count}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{tResults('dynNotchQ')}</span>
              <span className="text-white font-mono">
                {result.filters.dyn_notch_q}
              </span>
            </div>
          </div>
        </div>

        {/* CLI Commands */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-medium text-white text-sm">
              {tResults('cliCommands')}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? tResults('copied') : tResults('copy')}
              </button>
              <button
                type="button"
                onClick={onDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                {tResults('download')}
              </button>
            </div>
          </div>
          <div className="p-4 max-h-60 overflow-y-auto bg-black/20 cli-scrollbar">
            <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
              {result.cli_commands}
            </pre>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="font-medium text-white mb-3 text-sm">
            {tResults('howToApply')}
          </h3>
          <ol className="space-y-2 text-gray-400 text-sm">
            {[1, 2, 3, 4, 5].map((step) => (
              <li key={step} className="flex gap-3">
                <span className="text-gray-500 font-mono text-xs w-4">
                  {step}.
                </span>
                <span>{tResults(`applySteps.step${step}`)}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Back to Home */}
        <a
          href={`/${locale}`}
          className="block w-full text-center py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
        >
          {tResults('backToHome')}
        </a>
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

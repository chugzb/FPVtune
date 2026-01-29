'use client';

import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Loader2,
  X,
  Zap,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
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
    roll: { p: number; i: number; d: number };
    pitch: { p: number; i: number; d: number };
    yaw: { p: number; i: number; d: number };
  };
  filters: {
    gyro_lowpass_hz: number;
    dterm_lowpass_hz: number;
    dyn_notch_count: number;
    dyn_notch_q: number;
  };
  cli_commands: string;
}

interface OrderData {
  orderNumber: string;
  status: OrderStatus;
  email: string;
  analysis?: AnalysisResult;
}

function SuccessPageContent() {
  const t = useTranslations('TunePage.wizard.results');
  const tSuccess = useTranslations('TunePage.success');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [sections, setSections] = useState({
    summaryDetail: false,
    issues: false,
    recommendations: false,
    filters: false,
  });

  const isZh = locale === 'zh';

  const fetchOrderStatus = useCallback(async () => {
    if (!orderNumber) {
      setError(isZh ? '缺少订单号' : 'Missing order number');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/tune/order/${orderNumber}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError(tSuccess('error.notFound'));
        } else {
          setError(tSuccess('error.loadFailed'));
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setOrder(data.order);
      setLoading(false);
    } catch {
      setError(tSuccess('error.loadFailed'));
      setLoading(false);
    }
  }, [orderNumber, tSuccess, isZh]);

  useEffect(() => {
    fetchOrderStatus();
  }, [fetchOrderStatus]);

  // 轮询未完成的订单
  useEffect(() => {
    if (!order) return;
    if (order.status === 'completed' || order.status === 'failed') return;

    const interval = setInterval(fetchOrderStatus, 3000);
    return () => clearInterval(interval);
  }, [order, fetchOrderStatus]);

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const getOneLineConclusion = (text: string) => {
    if (!text)
      return isZh ? '已生成调参方案' : 'Tuning recommendations generated';
    const first = text.split(/(?<=[。！？.!?])/)[0]?.trim();
    if (!first) return text.length > 80 ? `${text.slice(0, 80)}...` : text;
    return first.length <= 80 ? first : `${first.slice(0, 80)}...`;
  };

  const issueLabels = isZh
    ? ['高风险', '手感问题', '热量风险', '响应不足', '动态过激', '噪声关注']
    : [
        'High Risk',
        'Feel Issue',
        'Heat Risk',
        'Low Response',
        'Over Dynamic',
        'Noise',
      ];

  const expectedEffects = isZh
    ? [
        '降低桨洗振荡，抑制 D 峰值',
        '减少滤波延迟，提升跟随性',
        '高油门锁定感更稳定',
        '提升跟手感，减小滞后',
        '急加减油更稳',
        '陷波更贴合噪声段',
        '逐步扩大余量',
      ]
    : [
        'Reduce propwash, suppress D peaks',
        'Reduce filter delay, improve tracking',
        'More stable lock-in at high throttle',
        'Better stick feel, less lag',
        'Smoother throttle transitions',
        'Notch better aligned to noise',
        'Gradually increase headroom',
      ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030304] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{isZh ? '加载中...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#030304] flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
          <Link
            href={`/${locale}/tune`}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl font-medium transition-colors text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            {isZh ? '返回' : 'Go Back'}
          </Link>
        </div>
      </div>
    );
  }

  // Processing state (not yet completed)
  if (order && order.status !== 'completed') {
    return (
      <div className="min-h-screen bg-[#030304] flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {tSuccess('status.processing')}
          </h2>
          <p className="text-gray-400 mb-4">
            {tSuccess('status.processingHint')}
          </p>
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <p className="text-sm text-gray-400 mb-1">
              {tSuccess('orderNumber')}
            </p>
            <p className="font-mono text-lg text-white">{orderNumber}</p>
          </div>
        </div>
      </div>
    );
  }

  // No analysis data
  if (!order?.analysis) {
    return (
      <div className="min-h-screen bg-[#030304] flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {isZh ? '分析结果不可用' : 'Analysis not available'}
          </h2>
          <p className="text-gray-400 mb-6">
            {isZh
              ? '请检查您的邮箱获取完整报告'
              : 'Please check your email for the full report'}
          </p>
          <Link
            href={`/${locale}/tune`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl font-medium transition-colors text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            {isZh ? '返回' : 'Go Back'}
          </Link>
        </div>
      </div>
    );
  }

  const result = order.analysis;

  return (
    <div className="min-h-screen bg-[#030304] text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#030304]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Logo className="h-6 w-auto" />
          </Link>
          <Link
            href={`/${locale}/tune`}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isZh ? '新分析' : 'New Analysis'}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
            <p className="text-gray-400">{t('description')}</p>
            {orderNumber && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">
                  {tSuccess('orderNumber')}:
                </span>
                <span className="font-mono text-white">{orderNumber}</span>
              </div>
            )}
          </div>

          {/* Analysis Summary */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <h3 className="font-medium text-white mb-3">
              {t('analysisSummary')}
            </h3>
            <div className="rounded-lg bg-black/20 p-3 text-sm leading-relaxed text-white/85">
              <div className="flex items-start gap-2">
                <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300 flex-shrink-0">
                  {isZh ? '结论' : 'Summary'}
                </span>
                <p className="flex-1">
                  {getOneLineConclusion(result.analysis.summary)}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-2 text-xs text-white/60 hover:text-white/80"
              onClick={() => toggleSection('summaryDetail')}
            >
              {sections.summaryDetail ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {sections.summaryDetail
                ? isZh
                  ? '收起详细摘要'
                  : 'Collapse details'
                : isZh
                  ? '展开详细摘要'
                  : 'Expand details'}
            </button>
            {sections.summaryDetail && (
              <div className="mt-3 rounded-lg bg-black/20 p-4 text-sm leading-relaxed text-white/75 whitespace-pre-wrap">
                {result.analysis.summary}
              </div>
            )}
          </div>

          {/* Issues */}
          {result.analysis.issues.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">
                  {t('issuesIdentified')}
                </h3>
                <button
                  type="button"
                  className="text-xs text-white/60 hover:text-white/80 flex items-center gap-1"
                  onClick={() => toggleSection('issues')}
                >
                  {sections.issues ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  {sections.issues
                    ? isZh
                      ? '收起'
                      : 'Collapse'
                    : isZh
                      ? '展开'
                      : 'Expand'}
                </button>
              </div>
              {sections.issues ? (
                <ul className="space-y-3">
                  {result.analysis.issues.map((issue, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-black/20 p-3 text-sm leading-relaxed text-white/80"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                          {issueLabels[i] || (isZh ? '提示' : 'Note')}
                        </span>
                        <span className="text-xs text-white/45">#{i + 1}</span>
                      </div>
                      <div className="whitespace-pre-wrap">{issue}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-white/55">
                  {isZh
                    ? `已折叠 ${result.analysis.issues.length} 个问题（点击展开查看）`
                    : `${result.analysis.issues.length} issues collapsed (click to expand)`}
                </p>
              )}
            </div>
          )}

          {/* Recommendations */}
          {result.analysis.recommendations.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">
                  {t('recommendations')}
                </h3>
                <button
                  type="button"
                  className="text-xs text-white/60 hover:text-white/80 flex items-center gap-1"
                  onClick={() => toggleSection('recommendations')}
                >
                  {sections.recommendations ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  {sections.recommendations
                    ? isZh
                      ? '收起'
                      : 'Collapse'
                    : isZh
                      ? '展开'
                      : 'Expand'}
                </button>
              </div>
              {sections.recommendations ? (
                <ul className="space-y-3">
                  {result.analysis.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-black/20 p-3 text-sm leading-relaxed text-white/80"
                    >
                      <div className="whitespace-pre-wrap">{rec}</div>
                      <div className="mt-2 text-xs text-white/55">
                        {isZh ? '预期效果：' : 'Expected: '}
                        {expectedEffects[i] ||
                          (isZh ? '整体锁定感更强' : 'Better overall feel')}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-white/55">
                  {isZh
                    ? `已折叠 ${result.analysis.recommendations.length} 条建议（点击展开查看）`
                    : `${result.analysis.recommendations.length} recommendations collapsed (click to expand)`}
                </p>
              )}
            </div>
          )}

          {/* PID Values */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="font-medium text-white">{t('optimizedPID')}</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                <div className="text-gray-500">{t('axis')}</div>
                <div className="text-gray-500">P</div>
                <div className="text-gray-500">I</div>
                <div className="text-gray-500">D</div>
              </div>
              <div className="space-y-2">
                {['roll', 'pitch', 'yaw'].map((axis) => (
                  <div
                    key={axis}
                    className="grid grid-cols-4 gap-2 text-center bg-white/5 rounded-lg py-3"
                  >
                    <div className="text-white font-medium">{t(axis)}</div>
                    <div className="text-white font-mono">
                      {result.pid[axis as keyof typeof result.pid].p}
                    </div>
                    <div className="text-white font-mono">
                      {result.pid[axis as keyof typeof result.pid].i}
                    </div>
                    <div className="text-white font-mono">
                      {result.pid[axis as keyof typeof result.pid].d}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Settings */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-medium text-white">{t('filterSettings')}</h3>
              <button
                type="button"
                className="text-xs text-white/60 hover:text-white/80 flex items-center gap-1"
                onClick={() => toggleSection('filters')}
              >
                {sections.filters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {sections.filters
                  ? isZh
                    ? '收起'
                    : 'Collapse'
                  : isZh
                    ? '展开'
                    : 'Expand'}
              </button>
            </div>
            {sections.filters ? (
              <div className="p-5 grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('gyroLPF')}</span>
                  <span className="text-white font-mono">
                    {result.filters.gyro_lowpass_hz} Hz
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('dtermLPF')}</span>
                  <span className="text-white font-mono">
                    {result.filters.dterm_lowpass_hz} Hz
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('dynNotchCount')}</span>
                  <span className="text-white font-mono">
                    {result.filters.dyn_notch_count}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('dynNotchQ')}</span>
                  <span className="text-white font-mono">
                    {result.filters.dyn_notch_q}
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-5 py-3 text-xs text-white/55">
                {isZh
                  ? '已折叠滤波器设置（点击展开查看）'
                  : 'Filter settings collapsed (click to expand)'}
              </div>
            )}
          </div>

          {/* CLI Commands */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-medium text-white">{t('cliCommands')}</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? t('copied') : t('copy')}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('download')}
                </button>
              </div>
            </div>
            <div className="mx-5 mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200/80">
              {isZh
                ? '建议粘贴前先 diff all 备份，如有异常振动或发热请立即回退'
                : 'Backup with "diff all" before pasting. Revert immediately if abnormal vibration or heat occurs'}
            </div>
            <div className="p-5 max-h-60 overflow-y-auto bg-black/20 mx-5 mb-5 mt-3 rounded-lg">
              <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                {result.cli_commands}
              </pre>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <h3 className="font-medium text-white mb-4">{t('howToApply')}</h3>
            <ol className="space-y-3 text-gray-400 text-sm">
              {[1, 2, 3, 4, 5].map((step) => (
                <li key={step} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white flex-shrink-0">
                    {step}
                  </span>
                  <span className="pt-0.5">{t(`applySteps.step${step}`)}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Back Button */}
          <div className="pt-4">
            <Link
              href={`/${locale}/tune`}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToHome')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#030304] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessPageContent />
    </Suspense>
  );
}

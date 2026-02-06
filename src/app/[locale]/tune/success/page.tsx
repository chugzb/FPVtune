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
    issues: (string | { title: string; detail: string })[];
    recommendations: (string | { title: string; detail: string })[];
  };
  pid: {
    roll: { p: number; i: number; d: number; f?: number; ff?: number };
    pitch: { p: number; i: number; d: number; f?: number; ff?: number };
    yaw: { p: number; i: number; d: number; f?: number; ff?: number };
  };
  filters: {
    gyro_lpf1_dyn_min_hz: number;
    gyro_lpf1_dyn_max_hz: number;
    gyro_lpf2_static_hz: number;
    dterm_lpf1_dyn_min_hz: number;
    dterm_lpf1_dyn_max_hz: number;
    dterm_lpf2_static_hz: number;
    dyn_notch_count: number;
    dyn_notch_q: number;
    dyn_notch_min_hz: number;
    dyn_notch_max_hz: number;
  };
  other: {
    d_max_gain: number;
    d_min_roll: number;
    d_min_pitch: number;
    tpa_rate: number;
    tpa_breakpoint: number;
    feedforward_boost: number;
    iterm_relax_cutoff: number;
  };
  cliCommands: string;
}

type CliDiffEntry = {
  key: string;
  before?: string;
  after: string;
  status: 'changed' | 'added';
};

type CliDiff = {
  entries: CliDiffEntry[];
  summary: {
    changed: number;
    added: number;
    unchanged: number;
  };
  warnings: string[];
};

interface OrderData {
  orderNumber: string;
  status: OrderStatus;
  email: string;
  analysis?: AnalysisResult;
  cliCommands?: string;
  cliDiff?: CliDiff;
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
    issues: true,
    recommendations: true,
    filters: false,
    cliDiff: true,
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

  const cliDiffWarnings = (warnings: string[]) => {
    if (!warnings.length) return [];
    return warnings.map((warning) => {
      switch (warning) {
        case 'missing_cli_dump':
          return t('cliDiffWarnings.missing_cli_dump');
        case 'missing_cli_commands':
          return t('cliDiffWarnings.missing_cli_commands');
        case 'no_changes_detected':
          return t('cliDiffWarnings.no_changes_detected');
        default:
          return warning;
      }
    });
  };

  const handleCopy = async () => {
    const commands = order?.cliCommands || order?.analysis?.cliCommands;
    if (!commands) return;
    try {
      await navigator.clipboard.writeText(commands);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const commands = order?.cliCommands || order?.analysis?.cliCommands;
    if (!commands) return;
    const blob = new Blob([commands], {
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
  const cliDiff = order.cliDiff;
  const cliDiffWarningTexts = cliDiff ? cliDiffWarnings(cliDiff.warnings) : [];

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
                      <div className="whitespace-pre-wrap">
                        {typeof issue === 'string' ? issue : (
                          <>
                            {(issue as any).title && <div className="font-medium text-white mb-1">{(issue as any).title}</div>}
                            {(issue as any).detail && <div>{(issue as any).detail}</div>}
                          </>
                        )}
                      </div>
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
                      <div className="whitespace-pre-wrap">
                        {typeof rec === 'string' ? rec : (
                          <>
                            {(rec as any).title && <div className="font-medium text-white mb-1">{(rec as any).title}</div>}
                            {(rec as any).detail && <div>{(rec as any).detail}</div>}
                          </>
                        )}
                      </div>
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
              <div className="grid grid-cols-5 gap-2 text-center text-xs mb-3">
                <div className="text-gray-500">{t('axis')}</div>
                <div className="text-gray-500">P</div>
                <div className="text-gray-500">I</div>
                <div className="text-gray-500">D</div>
                <div className="text-gray-500">F</div>
              </div>
              <div className="space-y-2">
                {['roll', 'pitch', 'yaw'].map((axis) => {
                  const pidAxis = result.pid[axis as keyof typeof result.pid];
                  const fValue = pidAxis?.f ?? pidAxis?.ff;
                  return (
                    <div
                      key={axis}
                      className="grid grid-cols-5 gap-2 text-center bg-white/5 rounded-lg py-3"
                    >
                      <div className="text-white font-medium">
                        {t(axis as any)}
                      </div>
                      <div className="text-white font-mono">
                        {pidAxis?.p ?? '-'}
                      </div>
                      <div className="text-white font-mono">
                        {pidAxis?.i ?? '-'}
                      </div>
                      <div className="text-white font-mono">
                        {pidAxis?.d ?? '-'}
                      </div>
                      <div className="text-white font-mono">
                        {fValue ?? '-'}
                      </div>
                    </div>
                  );
                })}
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
              <div className="p-5 space-y-4">
                {/* Gyro Filters */}
                <div>
                  <h4 className="text-xs text-gray-500 mb-2">
                    {isZh ? '陀螺仪滤波器' : 'Gyro Filters'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-gray-400">LPF1 Min</span>
                      <span className="text-white font-mono">
                        {result.filters?.gyro_lpf1_dyn_min_hz ?? '-'} Hz
                      </span>
                    </div>
                    <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-gray-400">LPF1 Max</span>
                      <span className="text-white font-mono">
                        {result.filters?.gyro_lpf1_dyn_max_hz ?? '-'} Hz
                      </span>
                    </div>
                    <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-gray-400">LPF2 Static</span>
                      <span className="text-white font-mono">
                        {result.filters?.gyro_lpf2_static_hz ?? '-'} Hz
                      </span>
                    </div>
                  </div>
                </div>
                {/* D-term Filters */}
                <div>
                  <h4 className="text-xs text-gray-500 mb-2">
                    {isZh ? 'D-term 滤波器' : 'D-term Filters'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-gray-400">LPF1 Min</span>
                      <span className="text-white font-mono">
                        {result.filters?.dterm_lpf1_dyn_min_hz ?? '-'} Hz
                      </span>
                    </div>
                    <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-gray-400">LPF1 Max</span>
                      <span className="text-white font-mono">
                        {result.filters?.dterm_lpf1_dyn_max_hz ?? '-'} Hz
                      </span>
                    </div>
                    <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-gray-400">LPF2 Static</span>
                      <span className="text-white font-mono">
                        {result.filters?.dterm_lpf2_static_hz ?? '-'} Hz
                      </span>
                    </div>
                  </div>
                </div>
                {/* Dynamic Notch */}
                <div>
                  <h4 className="text-xs text-gray-500 mb-2">
                    {isZh ? '动态陷波滤波器' : 'Dynamic Notch'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-gray-400">Count</span>
                      <span className="text-white font-mono">
                        {result.filters?.dyn_notch_count ?? '-'}
                      </span>
                    </div>
                    <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-gray-400">Q</span>
                      <span className="text-white font-mono">
                        {result.filters?.dyn_notch_q ?? '-'}
                      </span>
                    </div>
                    <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-gray-400">Min Hz</span>
                      <span className="text-white font-mono">
                        {result.filters?.dyn_notch_min_hz ?? '-'} Hz
                      </span>
                    </div>
                    <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-gray-400">Max Hz</span>
                      <span className="text-white font-mono">
                        {result.filters?.dyn_notch_max_hz ?? '-'} Hz
                      </span>
                    </div>
                  </div>
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

          {/* Other Parameters - only show if has actual data */}
          {result.other &&
            (result.other.d_max_gain ||
              result.other.d_min_roll ||
              result.other.d_min_pitch ||
              result.other.tpa_rate ||
              result.other.tpa_breakpoint ||
              result.other.feedforward_boost ||
              result.other.iterm_relax_cutoff) && (
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <h3 className="font-medium text-white">
                    {isZh ? '其他参数' : 'Other Parameters'}
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  {/* D-max Settings */}
                  {(result.other?.d_max_gain ||
                    result.other?.d_min_roll ||
                    result.other?.d_min_pitch) && (
                    <div>
                      <h4 className="text-xs text-gray-500 mb-2">
                        {isZh ? 'D 增益设置' : 'D Gain Settings'}
                      </h4>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        {result.other?.d_max_gain && (
                          <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                            <span className="text-gray-400">D Max Gain</span>
                            <span className="text-white font-mono">
                              {result.other.d_max_gain}
                            </span>
                          </div>
                        )}
                        {result.other?.d_min_roll && (
                          <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                            <span className="text-gray-400">D Min Roll</span>
                            <span className="text-white font-mono">
                              {result.other.d_min_roll}
                            </span>
                          </div>
                        )}
                        {result.other?.d_min_pitch && (
                          <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                            <span className="text-gray-400">D Min Pitch</span>
                            <span className="text-white font-mono">
                              {result.other.d_min_pitch}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* TPA Settings */}
                  {(result.other?.tpa_rate || result.other?.tpa_breakpoint) && (
                    <div>
                      <h4 className="text-xs text-gray-500 mb-2">TPA</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {result.other?.tpa_rate && (
                          <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                            <span className="text-gray-400">TPA Rate</span>
                            <span className="text-white font-mono">
                              {result.other.tpa_rate}
                            </span>
                          </div>
                        )}
                        {result.other?.tpa_breakpoint && (
                          <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                            <span className="text-gray-400">
                              TPA Breakpoint
                            </span>
                            <span className="text-white font-mono">
                              {result.other.tpa_breakpoint}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Other */}
                  {(result.other?.feedforward_boost ||
                    result.other?.iterm_relax_cutoff) && (
                    <div>
                      <h4 className="text-xs text-gray-500 mb-2">
                        {isZh ? '其他' : 'Other'}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {result.other?.feedforward_boost && (
                          <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                            <span className="text-gray-400">FF Boost</span>
                            <span className="text-white font-mono">
                              {result.other.feedforward_boost}
                            </span>
                          </div>
                        )}
                        {result.other?.iterm_relax_cutoff && (
                          <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                            <span className="text-gray-400">I-term Relax</span>
                            <span className="text-white font-mono">
                              {result.other.iterm_relax_cutoff}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* CLI Diff */}
          {cliDiff && (
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-white">
                    {t('cliDiffTitle')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('cliDiffSubtitle')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {t('cliDiffSummary', {
                      changed: cliDiff.summary.changed,
                      added: cliDiff.summary.added,
                    })}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-white/60 hover:text-white/80 flex items-center gap-1"
                    onClick={() => toggleSection('cliDiff')}
                  >
                    {sections.cliDiff ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {sections.cliDiff
                      ? isZh
                        ? '收起'
                        : 'Collapse'
                      : isZh
                        ? '展开'
                        : 'Expand'}
                  </button>
                </div>
              </div>
              {sections.cliDiff ? (
                <div className="p-5 space-y-3">
                  {cliDiffWarningTexts.length > 0 && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200/90 space-y-1">
                      {cliDiffWarningTexts.map((warning) => (
                        <div key={warning}>{warning}</div>
                      ))}
                    </div>
                  )}
                  {cliDiff.entries.length > 0 ? (
                    <ul className="space-y-2 max-h-72 overflow-y-auto">
                      {cliDiff.entries.map((entry) => (
                        <li
                          key={entry.key}
                          className="rounded-lg bg-black/20 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-white">
                              {entry.key}
                            </span>
                            <span
                              className={cn(
                                'text-[11px] px-2 py-0.5 rounded-full',
                                entry.status === 'added'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-blue-500/20 text-blue-300'
                              )}
                            >
                              {entry.status === 'added'
                                ? t('cliDiffStatusAdded')
                                : t('cliDiffStatusChanged')}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-gray-500">
                                {t('cliDiffBefore')}
                              </p>
                              <p className="font-mono text-white/80 break-all">
                                {entry.before ?? '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">
                                {t('cliDiffAfter')}
                              </p>
                              <p className="font-mono text-white/90 break-all">
                                {entry.after}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-white/60">{t('cliDiffEmpty')}</p>
                  )}
                </div>
              ) : (
                <div className="px-5 py-3 text-xs text-white/55">
                  {isZh
                    ? '已折叠 CLI 变更（点击展开查看）'
                    : 'CLI changes collapsed (click to expand)'}
                </div>
              )}
            </div>
          )}

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
                {order?.cliCommands ||
                  result.cliCommands ||
                  (isZh ? '无 CLI 命令' : 'No CLI commands')}
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
                  <span className="pt-0.5">
                    {t(`applySteps.step${step}` as any)}
                  </span>
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

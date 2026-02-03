'use client';

import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  FileText,
  Loader2,
  Lock,
  Mail,
  Shield,
  Terminal,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;
type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'failed';

interface FormData {
  blackboxFile: File | null;
  cliDumpFile: File | null;
  problems: string[];
  goals: string[];
  additionalNotes: string;
  customGoal: string;
  flyingStyle: string;
  frameSize: string;
  motorSize: string;
  motorKv: string;
  battery: string;
  propeller: string;
  motorTemp: string;
  weight: string;
  email: string;
}

interface OrderData {
  orderNumber: string;
  status: OrderStatus;
  email: string;
}

type PrecheckStatus = 'idle' | 'checking' | 'ready' | 'error';
type PrecheckResult = {
  status: 'ok' | 'warn';
  file: {
    sizeKB: number;
  };
  meta?: {
    duration_s?: number;
    sample_rate_hz?: number;
    points?: number;
    segments_found?: number;
    logs_found?: number;
    fw?: string;
    board?: string;
    craft?: string;
  } | null;
  issues: string[];
  thresholds: {
    minDurationSec: number;
    minSampleRateHz: number;
    minFileSizeKB: number;
  };
};

const TOTAL_STEPS = 6;
const problemIds = [
  'propwash',
  'hotmotors',
  'sluggish',
  'oscillation',
  'bouncy',
  'noise',
];
const goalIds = ['locked', 'smooth', 'snappy', 'efficient', 'balanced'];
const styleIds = ['freestyle', 'racing', 'cinematic', 'longrange'];
const frameIds = ['inch2_3', 'inch5', 'inch7', 'inch10plus'];
const batteryOptionIds = new Set(['1s', '2s', '3s', '4s', '5s', '6s', '8s']);

function parseCliDump(content: string): {
  motorKv?: string;
  battery?: string;
} {
  const motorKvMatch = content.match(/^[\t ]*set\s+motor_kv\s*=\s*(\d+)/m);
  const batteryMatch = content.match(
    /^[\t ]*set\s+force_battery_cell_count\s*=\s*(\d+)/m
  );

  const result: { motorKv?: string; battery?: string } = {};

  if (motorKvMatch?.[1]) {
    result.motorKv = motorKvMatch[1];
  }

  if (batteryMatch?.[1]) {
    const cells = Number.parseInt(batteryMatch[1], 10);
    if (!Number.isNaN(cells) && cells > 0) {
      const battery = `${cells}s`;
      if (batteryOptionIds.has(battery)) {
        result.battery = battery;
      }
    }
  }

  return result;
}

export function TuneWizard() {
  const t = useTranslations('TunePage.wizard');
  const tUpload = useTranslations('TunePage.wizard.upload');
  const tSuccess = useTranslations('TunePage.success');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<FormData>({
    blackboxFile: null,
    cliDumpFile: null,
    problems: [],
    goals: [],
    additionalNotes: '',
    customGoal: '',
    flyingStyle: '',
    frameSize: '',
    motorSize: '',
    motorKv: '',
    battery: '',
    propeller: '',
    motorTemp: '',
    weight: '',
    email: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testCode, setTestCode] = useState('');
  const [precheckStatus, setPrecheckStatus] = useState<PrecheckStatus>('idle');
  const [precheckResult, setPrecheckResult] = useState<PrecheckResult | null>(
    null
  );
  const [precheckError, setPrecheckError] = useState<string | null>(null);
  const precheckRequestId = useRef(0);
  const cliParseRequestId = useRef(0);

  // 处理中弹窗相关
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // 数据不足错误弹窗
  const [showDataErrorModal, setShowDataErrorModal] = useState(false);
  const [dataErrorInfo, setDataErrorInfo] = useState<{
    error: string;
    details: string;
    code?: string;
  } | null>(null);

  // 获取订单状态
  const fetchOrderStatus = useCallback(async () => {
    if (!orderNumber) return;

    try {
      const response = await fetch(`/api/tune/order/${orderNumber}`);
      if (!response.ok) {
        if (response.status === 404) {
          setOrderError(tSuccess('error.notFound'));
        } else {
          setOrderError(tSuccess('error.loadFailed'));
        }
        return;
      }

      const data = await response.json();
      setOrder(data.order);

      // 处理完成后跳转到结果页面
      if (data.order.status === 'completed') {
        window.location.href = `/${locale}/tune/success?order=${orderNumber}`;
      }
    } catch {
      setOrderError(tSuccess('error.loadFailed'));
    }
  }, [orderNumber, tSuccess, locale]);

  // 检测 URL 中的 order 参数，显示处理中弹窗
  useEffect(() => {
    if (orderNumber) {
      setShowProcessingModal(true);
      fetchOrderStatus();
    }
  }, [orderNumber, fetchOrderStatus]);

  // 轮询订单状态
  useEffect(() => {
    if (!orderNumber || !order) return;
    if (order.status === 'completed' || order.status === 'failed') return;

    const interval = setInterval(fetchOrderStatus, 3000);
    return () => clearInterval(interval);
  }, [orderNumber, order, fetchOrderStatus]);

  const handleCloseProcessingModal = () => {
    setShowProcessingModal(false);
    // 清除 URL 中的 order 参数
    window.history.replaceState({}, '', `/${locale}/tune`);
  };

  const stepLabels = [
    t('steps.upload'),
    t('steps.problems'),
    t('steps.goals'),
    t('steps.style'),
    t('steps.hardware'),
    t('steps.payment'),
  ];

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return formData.blackboxFile !== null && formData.cliDumpFile !== null;
      case 2:
        return formData.problems.length > 0;
      case 3:
        return formData.goals.length > 0;
      case 4:
        return formData.flyingStyle !== '';
      case 5:
        // 机架尺寸、电机信息、电池类型、螺旋桨、电机温度必填，重量选填
        return (
          formData.frameSize !== '' &&
          formData.motorSize !== '' &&
          formData.motorKv !== '' &&
          formData.battery !== '' &&
          formData.propeller !== '' &&
          formData.motorTemp !== ''
        );
      case 6:
        return formData.email !== '';
      default:
        return false;
    }
  }, [currentStep, formData]);

  const handleNext = () => {
    if (canProceed() && currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const runPrecheck = useCallback(
    async (file: File) => {
      const requestId = precheckRequestId.current + 1;
      precheckRequestId.current = requestId;

      setPrecheckStatus('checking');
      setPrecheckError(null);
      setPrecheckResult(null);

      const formData = new FormData();
      formData.append('blackbox', file);
      formData.append('locale', locale);

      try {
        const response = await fetch('/api/tune/precheck', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json().catch(() => null);

        if (precheckRequestId.current !== requestId) return;

        if (!response.ok) {
          const code = data?.code as string | undefined;
          const minKB = data?.minKB as number | undefined;
          const errorMessage =
            code === 'INVALID_BBL_FORMAT'
              ? tUpload('precheck.errorInvalidFormat')
              : code === 'FILE_TOO_SMALL'
                ? tUpload('precheck.errorTooSmall', {
                    minKB: minKB || 50,
                  })
                : tUpload('precheck.errorMissing');

          setPrecheckStatus('error');
          setPrecheckError(errorMessage);
          return;
        }

        setPrecheckStatus('ready');
        setPrecheckResult(data as PrecheckResult);
      } catch (error) {
        if (precheckRequestId.current !== requestId) return;
        setPrecheckStatus('error');
        setPrecheckError(
          error instanceof Error
            ? error.message
            : tUpload('precheck.errorMissing')
        );
      }
    },
    [locale, tUpload]
  );

  const handleFileChange = async (
    type: 'blackbox' | 'cliDump',
    file: File | null
  ) => {
    if (type === 'blackbox') {
      setFormData((prev) => ({ ...prev, blackboxFile: file }));
      if (file) {
        runPrecheck(file);
      } else {
        setPrecheckStatus('idle');
        setPrecheckResult(null);
        setPrecheckError(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, cliDumpFile: file }));
      if (!file) return;

      const requestId = cliParseRequestId.current + 1;
      cliParseRequestId.current = requestId;

      try {
        const content = await file.text();
        if (cliParseRequestId.current !== requestId) return;

        const parsed = parseCliDump(content);
        if (!parsed.motorKv && !parsed.battery) return;

        setFormData((prev) => {
          const next = { ...prev };
          if (parsed.motorKv && !prev.motorKv) {
            next.motorKv = parsed.motorKv;
          }
          if (parsed.battery && !prev.battery) {
            next.battery = parsed.battery;
          }
          return next;
        });
      } catch {
        // ignore parse errors
      }
    }
  };

  const toggleProblem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      problems: prev.problems.includes(id)
        ? prev.problems.filter((p) => p !== id)
        : [...prev.problems, id],
    }));
  };

  const toggleGoal = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(id)
        ? prev.goals.filter((g) => g !== id)
        : [...prev.goals, id],
    }));
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const apiFormData = new FormData();
      if (formData.blackboxFile) {
        apiFormData.append('blackbox', formData.blackboxFile);
      }
      if (formData.cliDumpFile) {
        apiFormData.append('cliDump', formData.cliDumpFile);
      }
      apiFormData.append('problems', formData.problems.join(', '));
      apiFormData.append('goals', formData.goals.join(', '));
      apiFormData.append('customGoal', formData.customGoal);
      apiFormData.append('flyingStyle', formData.flyingStyle);
      apiFormData.append('frameSize', formData.frameSize);
      apiFormData.append('motorSize', formData.motorSize);
      apiFormData.append('motorKv', formData.motorKv);
      apiFormData.append('battery', formData.battery);
      apiFormData.append('propeller', formData.propeller);
      apiFormData.append('motorTemp', formData.motorTemp);
      apiFormData.append('weight', formData.weight);
      apiFormData.append('additionalNotes', formData.additionalNotes);
      apiFormData.append('email', formData.email);
      apiFormData.append('locale', locale);

      const response = await fetch('/api/tune/checkout', {
        method: 'POST',
        body: apiFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Checkout failed');
      }

      const result = await response.json();

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      // 检查是否是数据不足错误
      if (err instanceof Error && err.message) {
        const isDataError =
          err.message.includes('飞行数据不足') ||
          err.message.includes('Insufficient flight data') ||
          err.message.includes('未检测到飞行数据') ||
          err.message.includes('No flight data detected');
        if (isDataError) {
          setDataErrorInfo({
            error: err.message,
            details: '',
            code: 'INSUFFICIENT_FLIGHT_DATA',
          });
          setShowDataErrorModal(true);
          setIsProcessing(false);
          return;
        }
      }
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsProcessing(false);
    }
  };

  const handleTestCodeSubmit = async () => {
    // 测试码验证由后端处理
    if (!testCode.trim()) {
      setError('Please enter a test code');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const apiFormData = new FormData();
      if (formData.blackboxFile) {
        apiFormData.append('blackbox', formData.blackboxFile);
      }
      if (formData.cliDumpFile) {
        apiFormData.append('cliDump', formData.cliDumpFile);
      }
      apiFormData.append('problems', formData.problems.join(', '));
      apiFormData.append('goals', formData.goals.join(', '));
      apiFormData.append('customGoal', formData.customGoal);
      apiFormData.append('flyingStyle', formData.flyingStyle);
      apiFormData.append('frameSize', formData.frameSize);
      apiFormData.append('motorSize', formData.motorSize);
      apiFormData.append('motorKv', formData.motorKv);
      apiFormData.append('battery', formData.battery);
      apiFormData.append('propeller', formData.propeller);
      apiFormData.append('motorTemp', formData.motorTemp);
      apiFormData.append('weight', formData.weight);
      apiFormData.append('additionalNotes', formData.additionalNotes);
      // 测试模式使用默认邮箱
      apiFormData.append('email', formData.email || 'test@fpvtune.com');
      apiFormData.append('locale', locale);
      apiFormData.append('testCode', testCode.toUpperCase());

      // 调用测试订单 API（创建订单 + 处理 + 发邮件）
      const response = await fetch('/api/tune/test-checkout', {
        method: 'POST',
        body: apiFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Test checkout failed');
      }

      const result = await response.json();

      // 更新 URL 并显示订单弹窗
      if (result.orderNumber) {
        window.history.pushState(
          {},
          '',
          `/${locale}/tune?order=${result.orderNumber}`
        );
        setShowProcessingModal(true);
        // 开始获取订单状态
        const orderResponse = await fetch(
          `/api/tune/order/${result.orderNumber}`
        );
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          setOrder(orderData.order);
        }
        setIsProcessing(false);
      } else {
        throw new Error('No order number returned');
      }
    } catch (err) {
      // 检查是否是数据不足错误
      if (err instanceof Error && err.message) {
        const isDataError =
          err.message.includes('飞行数据不足') ||
          err.message.includes('Insufficient flight data') ||
          err.message.includes('未检测到飞行数据') ||
          err.message.includes('No flight data detected');
        if (isDataError) {
          setDataErrorInfo({
            error: err.message,
            details: '',
            code: 'INSUFFICIENT_FLIGHT_DATA',
          });
          setShowDataErrorModal(true);
          setIsProcessing(false);
          return;
        }
      }
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030304] text-white">
      {/* 处理中弹窗 */}
      {showProcessingModal && (
        <ProcessingModal
          order={order}
          orderNumber={orderNumber}
          orderError={orderError}
          onClose={handleCloseProcessingModal}
          tSuccess={tSuccess}
          locale={locale}
        />
      )}

      {/* 数据不足错误弹窗 */}
      {showDataErrorModal && dataErrorInfo && (
        <InsufficientDataModal
          error={dataErrorInfo.error}
          details={dataErrorInfo.details}
          code={dataErrorInfo.code}
          onClose={() => {
            setShowDataErrorModal(false);
            setDataErrorInfo(null);
          }}
          locale={locale}
        />
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#030304]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <a href="/" className="flex items-center">
            <Logo className="h-6 w-auto" />
          </a>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Lock className="w-4 h-4" />
            <span>{t('header.secureCheckout')}</span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="fixed top-16 w-full z-40 bg-[#030304] border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(
              (step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                      currentStep === step
                        ? 'bg-blue-500 text-white'
                        : currentStep > step
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-gray-500'
                    )}
                  >
                    {currentStep > step ? <Check className="w-4 h-4" /> : step}
                  </div>
                  {step < TOTAL_STEPS && (
                    <div
                      className={cn(
                        'w-8 sm:w-12 h-0.5 mx-1',
                        currentStep > step ? 'bg-green-500' : 'bg-white/10'
                      )}
                    />
                  )}
                </div>
              )
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {stepLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-40 pb-32 px-6">
        <div className="max-w-2xl mx-auto">
          {currentStep === 1 && (
            <StepUpload
              blackboxFile={formData.blackboxFile}
              cliDumpFile={formData.cliDumpFile}
              onFileChange={handleFileChange}
              precheckStatus={precheckStatus}
              precheckResult={precheckResult}
              precheckError={precheckError}
            />
          )}
          {currentStep === 2 && (
            <StepProblems
              selected={formData.problems}
              onToggle={toggleProblem}
              notes={formData.additionalNotes}
              onNotesChange={(notes) =>
                setFormData((prev) => ({ ...prev, additionalNotes: notes }))
              }
            />
          )}
          {currentStep === 3 && (
            <StepGoals
              selected={formData.goals}
              onToggle={toggleGoal}
              customGoal={formData.customGoal}
              onCustomGoalChange={(customGoal) =>
                setFormData((prev) => ({ ...prev, customGoal }))
              }
            />
          )}
          {currentStep === 4 && (
            <StepFlyingStyle
              selected={formData.flyingStyle}
              onSelect={(style) =>
                setFormData((prev) => ({ ...prev, flyingStyle: style }))
              }
            />
          )}
          {currentStep === 5 && (
            <StepHardware
              frameSize={formData.frameSize}
              motorSize={formData.motorSize}
              motorKv={formData.motorKv}
              battery={formData.battery}
              propeller={formData.propeller}
              motorTemp={formData.motorTemp}
              weight={formData.weight}
              onFrameSizeChange={(size) =>
                setFormData((prev) => ({ ...prev, frameSize: size }))
              }
              onMotorSizeChange={(motorSize) =>
                setFormData((prev) => ({ ...prev, motorSize }))
              }
              onMotorKvChange={(motorKv) =>
                setFormData((prev) => ({ ...prev, motorKv }))
              }
              onBatteryChange={(battery) =>
                setFormData((prev) => ({ ...prev, battery }))
              }
              onPropellerChange={(propeller) =>
                setFormData((prev) => ({ ...prev, propeller }))
              }
              onMotorTempChange={(motorTemp) =>
                setFormData((prev) => ({ ...prev, motorTemp }))
              }
              onWeightChange={(weight) =>
                setFormData((prev) => ({ ...prev, weight }))
              }
            />
          )}
          {currentStep === 6 && (
            <StepPayment
              formData={formData}
              email={formData.email}
              onEmailChange={(email) =>
                setFormData((prev) => ({ ...prev, email }))
              }
              onPayment={handlePayment}
              isProcessing={isProcessing}
              error={error}
              testCode={testCode}
              onTestCodeChange={setTestCode}
              onTestCodeSubmit={handleTestCodeSubmit}
            />
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      {currentStep < TOTAL_STEPS && (
        <div className="fixed bottom-0 w-full border-t border-white/5 bg-[#030304]/95 backdrop-blur-xl">
          <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                currentStep === 1
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              {t('navigation.back')}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all',
                canProceed()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
              )}
            >
              {t('navigation.continue')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 1: Upload Files
function StepUpload({
  blackboxFile,
  cliDumpFile,
  onFileChange,
  precheckStatus,
  precheckResult,
  precheckError,
}: {
  blackboxFile: File | null;
  cliDumpFile: File | null;
  onFileChange: (type: 'blackbox' | 'cliDump', file: File | null) => void;
  precheckStatus: PrecheckStatus;
  precheckResult: PrecheckResult | null;
  precheckError: string | null;
}) {
  const t = useTranslations('TunePage.wizard.upload');
  const precheckTone =
    precheckStatus === 'checking'
      ? 'checking'
      : precheckStatus === 'error'
        ? 'error'
        : precheckResult?.status === 'warn'
          ? 'warn'
          : precheckResult
            ? 'ok'
            : 'idle';

  const issueLabel = (issue: string) => {
    if (!precheckResult) return issue;
    const thresholds = precheckResult.thresholds;

    switch (issue) {
      case 'short_duration':
        return t('precheck.issueShortDuration', {
          minSeconds: thresholds.minDurationSec,
        });
      case 'low_sample_rate':
        return t('precheck.issueLowSampleRate', {
          minHz: thresholds.minSampleRateHz,
        });
      case 'multiple_segments':
        return t('precheck.issueMultipleSegments');
      case 'multiple_logs':
        return t('precheck.issueMultipleLogs');
      case 'decoder_failed':
        return t('precheck.issueDecoderFailed');
      default:
        return issue;
    }
  };

  const formatNumber = (value: number | undefined, digits = 1) =>
    typeof value === 'number' ? value.toFixed(digits) : '-';

  const formatInt = (value: number | undefined) =>
    typeof value === 'number' ? value.toString() : '-';

  const formatText = (value: string | undefined) =>
    value && value.trim().length > 0 ? value.trim() : '-';

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">{t('title')}</h1>
        <p className="text-gray-400">{t('description')}</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="file"
            accept=".bbl,.bfl,.txt"
            onChange={(e) =>
              onFileChange('blackbox', e.target.files?.[0] || null)
            }
            className="absolute inset-0 z-10 cursor-pointer opacity-0"
          />
          <div
            className={cn(
              'flex items-center gap-4 rounded-xl border-2 border-dashed p-6 transition-all',
              blackboxFile
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5'
            )}
          >
            <div
              className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center',
                blackboxFile ? 'bg-green-500/20' : 'bg-white/5'
              )}
            >
              {blackboxFile ? (
                <CheckCircle className="w-7 h-7 text-green-400" />
              ) : (
                <FileText className="w-7 h-7 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white mb-1">
                {t('blackboxLog')}{' '}
                <span className="text-red-400">{t('blackboxRequired')}</span>
              </p>
              {blackboxFile ? (
                <p className="text-sm text-green-400">{blackboxFile.name}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-500">{t('blackboxHint')}</p>
                  <Link
                    href="/guides/export-blackbox"
                    target="_blank"
                    className="relative z-20 text-sm text-blue-400 hover:text-blue-300 underline mt-1 inline-block pointer-events-auto"
                  >
                    {t('howToExport')}
                  </Link>
                </>
              )}
            </div>
            <Upload className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        <div className="relative">
          <input
            type="file"
            accept=".txt"
            onChange={(e) =>
              onFileChange('cliDump', e.target.files?.[0] || null)
            }
            className="absolute inset-0 z-10 cursor-pointer opacity-0"
          />
          <div
            className={cn(
              'flex items-center gap-4 rounded-xl border-2 border-dashed p-6 transition-all',
              cliDumpFile
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5'
            )}
          >
            <div
              className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center',
                cliDumpFile ? 'bg-green-500/20' : 'bg-white/5'
              )}
            >
              {cliDumpFile ? (
                <CheckCircle className="w-7 h-7 text-green-400" />
              ) : (
                <Terminal className="w-7 h-7 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white mb-1">
                {t('cliDump')}{' '}
                <span className="text-red-400">{t('cliDumpRequired')}</span>
              </p>
              {cliDumpFile ? (
                <p className="text-sm text-green-400">{cliDumpFile.name}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-500">{t('cliDumpHint')}</p>
                  <Link
                    href="/guides/export-cli-dump"
                    target="_blank"
                    className="relative z-20 text-sm text-blue-400 hover:text-blue-300 underline mt-1 inline-block pointer-events-auto"
                  >
                    {t('howToExport')}
                  </Link>
                </>
              )}
            </div>
            <Upload className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>

      {blackboxFile && (
        <div
          className={cn(
            'rounded-xl border p-4 text-sm transition-all',
            precheckTone === 'checking'
              ? 'border-blue-500/30 bg-blue-500/10'
              : precheckTone === 'error'
                ? 'border-red-500/30 bg-red-500/10'
                : precheckTone === 'warn'
                  ? 'border-amber-500/30 bg-amber-500/10'
                  : precheckTone === 'ok'
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-white/10 bg-white/5'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {precheckTone === 'checking' && (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              )}
              {precheckTone === 'ok' && (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
              {(precheckTone === 'warn' || precheckTone === 'error') && (
                <AlertCircle
                  className={cn(
                    'w-4 h-4',
                    precheckTone === 'error' ? 'text-red-400' : 'text-amber-400'
                  )}
                />
              )}
              <span className="font-semibold text-white">
                {t('precheck.title')}
              </span>
            </div>
            {precheckTone !== 'idle' && (
              <span
                className={cn(
                  'text-xs font-medium',
                  precheckTone === 'checking'
                    ? 'text-blue-300'
                    : precheckTone === 'error'
                      ? 'text-red-300'
                      : precheckTone === 'warn'
                        ? 'text-amber-300'
                        : 'text-green-300'
                )}
              >
                {precheckTone === 'checking'
                  ? t('precheck.checking')
                  : precheckTone === 'error'
                    ? t('precheck.statusError')
                    : precheckTone === 'warn'
                      ? t('precheck.statusWarn')
                      : t('precheck.statusOk')}
              </span>
            )}
          </div>

          {precheckStatus === 'error' && precheckError && (
            <p className="mt-2 text-xs text-red-300">{precheckError}</p>
          )}

          {precheckStatus === 'ready' && precheckResult && (
            <div className="mt-3 space-y-3 text-xs text-gray-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    {t('precheck.fileSize')}
                  </span>
                  <span>{precheckResult.file.sizeKB} KB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    {t('precheck.duration')}
                  </span>
                  <span>{formatNumber(precheckResult.meta?.duration_s)}s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    {t('precheck.sampleRate')}
                  </span>
                  <span>
                    {formatInt(precheckResult.meta?.sample_rate_hz)}Hz
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{t('precheck.points')}</span>
                  <span>{formatInt(precheckResult.meta?.points)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    {t('precheck.segments')}
                  </span>
                  <span>{formatInt(precheckResult.meta?.segments_found)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{t('precheck.logs')}</span>
                  <span>{formatInt(precheckResult.meta?.logs_found)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">
                    {t('precheck.firmware')}
                  </span>
                  <span
                    className="text-gray-300 truncate max-w-[220px]"
                    title={formatText(precheckResult.meta?.fw)}
                  >
                    {formatText(precheckResult.meta?.fw)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">{t('precheck.board')}</span>
                  <span
                    className="text-gray-300 truncate max-w-[220px]"
                    title={formatText(precheckResult.meta?.board)}
                  >
                    {formatText(precheckResult.meta?.board)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">{t('precheck.craft')}</span>
                  <span
                    className="text-gray-300 truncate max-w-[220px]"
                    title={formatText(precheckResult.meta?.craft)}
                  >
                    {formatText(precheckResult.meta?.craft)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {precheckResult?.issues?.length ? (
            <ul className="mt-3 space-y-1 text-xs text-amber-200">
              {precheckResult.issues.map((issue) => (
                <li key={issue}>{issueLabel(issue)}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <p className="text-sm text-gray-400">
          <strong className="text-white">{t('tip')}</strong> {t('tipContent')}
        </p>
      </div>
    </div>
  );
}

// Step 2: Problems
function StepProblems({
  selected,
  onToggle,
  notes,
  onNotesChange,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}) {
  const t = useTranslations('TunePage.wizard.problems');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">{t('title')}</h1>
        <p className="text-gray-400">{t('description')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {problemIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            className={cn(
              'p-4 rounded-xl border-2 text-left transition-all',
              selected.includes(id)
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                  selected.includes(id)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-white/30'
                )}
              >
                {selected.includes(id) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  {t(`items.${id}.name` as any)}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t(`items.${id}.description` as any)}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-white mb-2"
        >
          {t('additionalDetails')}{' '}
          <span className="text-gray-500">
            {t('additionalDetailsOptional')}
          </span>
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t('additionalDetailsPlaceholder')}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>
    </div>
  );
}

// Step 3: Goals
function StepGoals({
  selected,
  onToggle,
  customGoal,
  onCustomGoalChange,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  customGoal: string;
  onCustomGoalChange: (value: string) => void;
}) {
  const t = useTranslations('TunePage.wizard.goals');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">{t('title')}</h1>
        <p className="text-gray-400">{t('description')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {goalIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            className={cn(
              'p-4 rounded-xl border-2 text-left transition-all',
              selected.includes(id)
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                  selected.includes(id)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-white/30'
                )}
              >
                {selected.includes(id) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  {t(`items.${id}.name` as any)}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t(`items.${id}.description` as any)}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div>
        <label
          htmlFor="custom-goal"
          className="block text-sm font-medium text-white mb-2"
        >
          {t('otherGoals')}{' '}
          <span className="text-gray-500">{t('otherGoalsOptional')}</span>
        </label>
        <textarea
          id="custom-goal"
          value={customGoal}
          onChange={(e) => onCustomGoalChange(e.target.value)}
          placeholder={t('otherGoalsPlaceholder')}
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>
    </div>
  );
}

// Step 4: Flying Style
function StepFlyingStyle({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (style: string) => void;
}) {
  const t = useTranslations('TunePage.wizard.styles');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">{t('title')}</h1>
        <p className="text-gray-400">{t('description')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {styleIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={cn(
              'p-6 rounded-xl border-2 text-left transition-all',
              selected === id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            )}
          >
            <h3 className="font-semibold text-white text-lg mb-1">
              {t(`items.${id}.name` as any)}
            </h3>
            <p className="text-sm text-gray-500">
              {t(`items.${id}.description` as any)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 5: Hardware Info (Frame Size + Motor + Battery + Propeller + Motor Temp + Weight)
function StepHardware({
  frameSize,
  motorSize,
  motorKv,
  battery,
  propeller,
  motorTemp,
  weight,
  onFrameSizeChange,
  onMotorSizeChange,
  onMotorKvChange,
  onBatteryChange,
  onPropellerChange,
  onMotorTempChange,
  onWeightChange,
}: {
  frameSize: string;
  motorSize: string;
  motorKv: string;
  battery: string;
  propeller: string;
  motorTemp: string;
  weight: string;
  onFrameSizeChange: (size: string) => void;
  onMotorSizeChange: (size: string) => void;
  onMotorKvChange: (kv: string) => void;
  onBatteryChange: (battery: string) => void;
  onPropellerChange: (propeller: string) => void;
  onMotorTempChange: (temp: string) => void;
  onWeightChange: (weight: string) => void;
}) {
  const t = useTranslations('TunePage.wizard.hardware');
  const tFrames = useTranslations('TunePage.wizard.frames');

  const batteryOptions = ['1s', '2s', '3s', '4s', '5s', '6s', '8s'];
  const motorTempOptions = ['normal', 'warm', 'hot'];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">{t('title')}</h1>
        <p className="text-gray-400">{t('description')}</p>
      </div>

      {/* Frame Size Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">
          {t('frameSize')} <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {frameIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onFrameSizeChange(id)}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                frameSize === id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              )}
            >
              <div className="text-2xl font-bold text-white mb-1">
                {tFrames(`items.${id}.name` as any)}
              </div>
              <p className="text-xs text-gray-500">
                {tFrames(`items.${id}.description` as any)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Motor Input - Two fields: Size and KV */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">
          {t('motor')} <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              id="motorSize"
              type="text"
              value={motorSize}
              onChange={(e) => onMotorSizeChange(e.target.value)}
              placeholder={t('motorSizePlaceholder')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
              {t('motorSizeUnit')}
            </span>
          </div>
          <div className="relative">
            <input
              id="motorKv"
              type="text"
              value={motorKv}
              onChange={(e) => onMotorKvChange(e.target.value)}
              placeholder={t('motorKvPlaceholder')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
              KV
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <span className="text-blue-400">&#9432;</span>
          {t('motorHint')}
        </p>
      </div>

      {/* Battery Type Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">
          {t('battery')} <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {batteryOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onBatteryChange(opt)}
              className={cn(
                'p-3 rounded-xl border-2 text-center transition-all',
                battery === opt
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              )}
            >
              <span className="text-white font-medium text-sm">
                {t(`batteryOptions.${opt}` as any)}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <span className="text-blue-400">&#9432;</span>
          {t('batteryHint')}
        </p>
      </div>

      {/* Propeller Input */}
      <div className="space-y-3">
        <label
          htmlFor="propeller"
          className="block text-sm font-medium text-white"
        >
          {t('propeller')} <span className="text-red-400">*</span>
        </label>
        <input
          id="propeller"
          type="text"
          value={propeller}
          onChange={(e) => onPropellerChange(e.target.value)}
          placeholder={t('propellerPlaceholder')}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <span className="text-blue-400">&#9432;</span>
          {t('propellerHint')}
        </p>
      </div>

      {/* Motor Temperature Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">
          {t('motorTemp')} <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {motorTempOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onMotorTempChange(opt)}
              className={cn(
                'p-3 rounded-xl border-2 text-center transition-all',
                motorTemp === opt
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              )}
            >
              <span className="text-white text-sm">
                {t(`motorTempOptions.${opt}` as any)}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <span className="text-blue-400">&#9432;</span>
          {t('motorTempHint')}
        </p>
      </div>

      {/* Weight Input (Optional) */}
      <div className="space-y-3">
        <label
          htmlFor="weight"
          className="block text-sm font-medium text-white"
        >
          {t('weight')} <span className="text-gray-500">({t('optional')})</span>
        </label>
        <div className="relative">
          <input
            id="weight"
            type="number"
            value={weight}
            onChange={(e) => onWeightChange(e.target.value)}
            placeholder={t('weightPlaceholder')}
            min="50"
            max="10000"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-16 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            g
          </span>
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <span className="text-blue-400">&#9432;</span>
          {t('weightHint')}
        </p>
      </div>
    </div>
  );
}

// Step 6: Payment (Test Mode - Only Test Code)
function StepPayment({
  formData,
  email,
  onEmailChange,
  onPayment,
  isProcessing,
  error,
  testCode,
  onTestCodeChange,
  onTestCodeSubmit,
}: {
  formData: FormData;
  email: string;
  onEmailChange: (email: string) => void;
  onPayment: () => void;
  isProcessing: boolean;
  error: string | null;
  testCode: string;
  onTestCodeChange: (code: string) => void;
  onTestCodeSubmit: () => void;
}) {
  const t = useTranslations('TunePage.wizard.payment');
  const tStyles = useTranslations('TunePage.wizard.styles.items');
  const tFrames = useTranslations('TunePage.wizard.frames.items');
  const tProblems = useTranslations('TunePage.wizard.problems.items');
  const tGoals = useTranslations('TunePage.wizard.goals.items');
  const tHardware = useTranslations('TunePage.wizard.hardware');
  // Test mode: always show test code input
  const [showTestCode, setShowTestCode] = useState(true);

  const styleName = tStyles(`${formData.flyingStyle}.name` as any);
  const sizeName = tFrames(`${formData.frameSize}.name` as any);
  const problemNames = formData.problems.map((p) =>
    tProblems(`${p}.name` as any)
  );
  const goalNames = formData.goals.map((g) => tGoals(`${g}.name` as any));
  const allGoals = formData.customGoal
    ? [...goalNames, formData.customGoal]
    : goalNames;

  // 获取电机温度的翻译文本
  const motorTempName = formData.motorTemp
    ? tHardware(`motorTempOptions.${formData.motorTemp}` as any)
    : '';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">{t('title')}</h1>
        <p className="text-gray-400">{t('description')}</p>
      </div>

      {/* Order Summary */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5">
          <h3 className="font-semibold text-white">{t('orderSummary')}</h3>
        </div>
        <div className="divide-y divide-white/5 text-sm">
          <div className="p-4 flex justify-between">
            <span className="text-gray-400">{t('blackboxLog')}</span>
            <span className="text-white truncate max-w-[200px]">
              {formData.blackboxFile?.name}
            </span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="text-gray-400">{t('problemsToFix')}</span>
            <span className="text-white text-right">
              {problemNames.join(', ')}
            </span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="text-gray-400">{t('tuningGoals')}</span>
            <span className="text-white text-right">{allGoals.join(', ')}</span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="text-gray-400">{t('flyingStyle')}</span>
            <span className="text-white">{styleName}</span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="text-gray-400">{t('frameSize')}</span>
            <span className="text-white">{sizeName}</span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="text-gray-400">{t('motor')}</span>
            <span className="text-white">
              {formData.motorSize} {formData.motorKv}KV
            </span>
          </div>
          {formData.battery && (
            <div className="p-4 flex justify-between">
              <span className="text-gray-400">{t('battery')}</span>
              <span className="text-white">
                {formData.battery.toUpperCase()}
              </span>
            </div>
          )}
          {formData.propeller && (
            <div className="p-4 flex justify-between">
              <span className="text-gray-400">{t('propeller')}</span>
              <span className="text-white">{formData.propeller}</span>
            </div>
          )}
          {formData.motorTemp && (
            <div className="p-4 flex justify-between">
              <span className="text-gray-400">{t('motorTemp')}</span>
              <span className="text-white">{motorTempName}</span>
            </div>
          )}
          {formData.weight && (
            <div className="p-4 flex justify-between">
              <span className="text-gray-400">{t('weight')}</span>
              <span className="text-white">{formData.weight} g</span>
            </div>
          )}
          {formData.additionalNotes && (
            <div className="p-4">
              <span className="text-gray-400 block mb-1">
                {t('additionalNotes')}
              </span>
              <span className="text-white text-sm">
                {formData.additionalNotes}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Test Code Section - Test Mode Only */}
      <div className="bg-gradient-to-b from-green-500/20 to-transparent border border-green-500/30 rounded-2xl p-6">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 text-sm font-semibold px-4 py-2 rounded-full mb-3">
            <Zap className="w-4 h-4" />
            {t('testMode') || '测试模式'}
          </div>
          <p className="text-gray-400 text-sm">{t('testModeHint') || '输入测试码免费获取调参结果'}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="test-code-input"
              className="block text-sm font-medium text-white mb-2"
            >
              {t('testCodeLabel') || '测试码'}
            </label>
            <input
              id="test-code-input"
              type="text"
              value={testCode}
              onChange={(e) => onTestCodeChange(e.target.value)}
              placeholder={t('testCodePlaceholder')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500"
            />
          </div>

          <button
            type="button"
            onClick={onTestCodeSubmit}
            disabled={!testCode || isProcessing}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-lg transition-all',
              testCode && !isProcessing
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('analyzing')}
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                {t('useTestCode')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span>{t('instantDelivery')}</span>
        </div>
      </div>
    </div>
  );
}

// 处理中弹窗 - 简单的状态显示弹窗
function ProcessingModal({
  order,
  orderNumber,
  orderError,
  onClose,
  tSuccess,
  locale,
}: {
  order: OrderData | null;
  orderNumber: string | null;
  orderError: string | null;
  onClose: () => void;
  tSuccess: any;
  locale: string;
}) {
  const isZh = locale === 'zh';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

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

  // 错误状态
  if (orderError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-full max-w-md mx-4 bg-[#0a0b0f] border border-white/10 rounded-2xl shadow-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{orderError}</h2>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl font-medium transition-colors"
          >
            {isZh ? '关闭' : 'Close'}
          </button>
        </div>
      </div>
    );
  }

  // 处理中弹窗
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg mx-4 bg-[#0a0b0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {tSuccess('title')}
              </h2>
              <p className="text-xs text-gray-500">{tSuccess('description')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Order Number */}
          {orderNumber && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
              <p className="text-sm text-gray-400 mb-1 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                {tSuccess('orderNumber')}
              </p>
              <p className="font-mono text-lg text-white">{orderNumber}</p>
            </div>
          )}

          {/* Status Steps */}
          <div className="space-y-3">
            <ProcessingStatusCard
              icon={<CheckCircle className="w-5 h-5 text-green-400" />}
              title={tSuccess('status.paid')}
              hint={tSuccess('status.paidHint')}
              isActive={false}
              isCompleted={true}
            />
            <ProcessingStatusCard
              icon={getStatusIcon(
                order?.status === 'processing'
                  ? 'processing'
                  : order?.status === 'completed' || order?.status === 'failed'
                    ? 'completed'
                    : 'pending'
              )}
              title={tSuccess('status.processing')}
              hint={tSuccess('status.processingHint')}
              isActive={order?.status === 'processing'}
              isCompleted={
                order?.status === 'completed' || order?.status === 'failed'
              }
              isFailed={order?.status === 'failed'}
            />
            <ProcessingStatusCard
              icon={
                order?.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Mail className="w-5 h-5 text-gray-400" />
                )
              }
              title={
                order?.status === 'completed'
                  ? tSuccess('emailSent')
                  : tSuccess('status.sendingEmail')
              }
              hint={
                order?.status === 'completed'
                  ? tSuccess('emailSentHint')
                  : tSuccess('status.sendingEmailHint')
              }
              isActive={false}
              isCompleted={order?.status === 'completed'}
            />
          </div>

          {/* Close Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition-all border border-white/20 text-sm"
            >
              {isZh ? '关闭' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 处理中状态卡片
function ProcessingStatusCard({
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

// 订单状态弹窗
function OrderStatusModal({
  order,
  orderNumber,
  orderError,
  showResults,
  onShowResults,
  onClose,
  tSuccess,
  tResults,
  locale,
  copied,
  onCopy,
  onDownload,
}: {
  order: OrderData | null;
  orderNumber: string | null;
  orderError: string | null;
  showResults: boolean;
  onShowResults: () => void;
  onClose: () => void;
  tSuccess: any;
  tResults: any;
  locale: string;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const isZh = locale === 'zh';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

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

  // 如果显示结果弹窗
  if (showResults && order?.analysis) {
    return (
      <ResultsModal
        order={order}
        tResults={tResults}
        locale={locale}
        copied={copied}
        onCopy={onCopy}
        onDownload={onDownload}
        onClose={onClose}
      />
    );
  }

  // 错误状态
  if (orderError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-full max-w-md mx-4 bg-[#0a0b0f] border border-white/10 rounded-2xl shadow-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{orderError}</h2>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl font-medium transition-colors"
          >
            {isZh ? '关闭' : 'Close'}
          </button>
        </div>
      </div>
    );
  }

  // 订单状态弹窗
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg mx-4 bg-[#0a0b0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {tSuccess('title')}
              </h2>
              <p className="text-xs text-gray-500">{tSuccess('description')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Order Number */}
          {orderNumber && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
              <p className="text-sm text-gray-400 mb-1 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                {tSuccess('orderNumber')}
              </p>
              <p className="font-mono text-lg text-white">{orderNumber}</p>
            </div>
          )}

          {/* Status Steps */}
          <div className="space-y-3">
            <StatusCard
              icon={<CheckCircle className="w-5 h-5 text-green-400" />}
              title={tSuccess('status.paid')}
              hint={tSuccess('status.paidHint')}
              isActive={false}
              isCompleted={true}
            />
            <StatusCard
              icon={getStatusIcon(
                order?.status === 'processing'
                  ? 'processing'
                  : order?.status === 'completed' || order?.status === 'failed'
                    ? 'completed'
                    : 'pending'
              )}
              title={tSuccess('status.processing')}
              hint={tSuccess('status.processingHint')}
              isActive={order?.status === 'processing'}
              isCompleted={
                order?.status === 'completed' || order?.status === 'failed'
              }
              isFailed={order?.status === 'failed'}
            />
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
                  ? tSuccess('emailSent')
                  : tSuccess('status.sendingEmail')
              }
              hint={
                order?.status === 'completed'
                  ? tSuccess('emailSentHint')
                  : tSuccess('status.sendingEmailHint')
              }
              isActive={false}
              isCompleted={order?.status === 'completed'}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {order?.status === 'completed' && order.analysis && (
              <button
                type="button"
                onClick={onShowResults}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 font-semibold transition-all text-sm"
              >
                {tSuccess('viewResults')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition-all border border-white/20 text-sm"
            >
              {isZh ? '关闭' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 状态卡片
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

// 结果弹窗
function ResultsModal({
  order,
  tResults,
  locale,
  copied,
  onCopy,
  onDownload,
  onClose,
}: {
  order: OrderData;
  tResults: any;
  locale: string;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onClose: () => void;
}) {
  const result = order.analysis!;
  const isZh = locale === 'zh';

  const [sections, setSections] = useState({
    summaryDetail: false,
    issues: false,
    recommendations: false,
    filters: false,
  });

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-[#0a0b0f] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {tResults('title')}
              </h2>
              <p className="text-xs text-gray-500">{tResults('description')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Analysis Summary */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <h3 className="font-medium text-white mb-3 text-sm">
              {tResults('analysisSummary')}
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
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                {sections.summaryDetail ? '-' : '+'}
              </span>
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
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white text-sm">
                  {tResults('issuesIdentified')}
                </h3>
                <button
                  type="button"
                  className="text-xs text-white/60 hover:text-white/80"
                  onClick={() => toggleSection('issues')}
                >
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
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white text-sm">
                  {tResults('recommendations')}
                </h3>
                <button
                  type="button"
                  className="text-xs text-white/60 hover:text-white/80"
                  onClick={() => toggleSection('recommendations')}
                >
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
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="font-medium text-white text-sm">
                {tResults('optimizedPID')}
              </h3>
            </div>
            <div className="p-4">
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
            <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-medium text-white text-sm">
                {tResults('filterSettings')}
              </h3>
              <button
                type="button"
                className="text-xs text-white/60 hover:text-white/80"
                onClick={() => toggleSection('filters')}
              >
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
              <div className="p-4 grid grid-cols-2 gap-3 text-sm">
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
                  <span className="text-gray-500">
                    {tResults('dynNotchCount')}
                  </span>
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
            ) : (
              <div className="px-4 py-3 text-xs text-white/55">
                {isZh
                  ? '已折叠滤波器设置（点击展开查看）'
                  : 'Filter settings collapsed (click to expand)'}
              </div>
            )}
          </div>

          {/* CLI Commands */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
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
            <div className="mx-4 mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200/80">
              {isZh
                ? '建议粘贴前先 diff all 备份，如有异常振动或发热请立即回退'
                : 'Backup with "diff all" before pasting. Revert immediately if abnormal vibration or heat occurs'}
            </div>
            <div className="p-4 max-h-60 overflow-y-auto bg-black/20">
              <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                {result.cli_commands}
              </pre>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
          >
            {isZh ? '关闭' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Step 7: Results (保留用于本地测试)
function StepResults({ result }: { result: AnalysisResult }) {
  const t = useTranslations('TunePage.wizard.results');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.cli_commands);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result.cli_commands], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fpvtune-settings.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
        <p className="text-gray-500 text-sm">{t('description')}</p>
      </div>

      {/* Analysis Summary */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="font-medium text-white mb-3 text-sm">
          {t('analysisSummary')}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          {result.analysis.summary}
        </p>
      </div>

      {/* Issues Found */}
      {result.analysis.issues.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="font-medium text-white mb-3 text-sm">
            {t('issuesIdentified')}
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
            {t('recommendations')}
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
            {t('optimizedPID')}
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
            <div className="text-gray-500">{t('axis')}</div>
            <div className="text-gray-500">P</div>
            <div className="text-gray-500">I</div>
            <div className="text-gray-500">D</div>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 text-center bg-white/5 rounded-lg py-2.5">
              <div className="text-white text-sm">{t('roll')}</div>
              <div className="text-white text-sm font-mono">
                {result.pid.roll.p}
              </div>
              <div className="text-white text-sm font-mono">
                {result.pid.roll.i}
              </div>
              <div className="text-white text-sm font-mono">
                {result.pid.roll.d}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center bg-white/5 rounded-lg py-2.5">
              <div className="text-white text-sm">{t('pitch')}</div>
              <div className="text-white text-sm font-mono">
                {result.pid.pitch.p}
              </div>
              <div className="text-white text-sm font-mono">
                {result.pid.pitch.i}
              </div>
              <div className="text-white text-sm font-mono">
                {result.pid.pitch.d}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center bg-white/5 rounded-lg py-2.5">
              <div className="text-white text-sm">{t('yaw')}</div>
              <div className="text-white text-sm font-mono">
                {result.pid.yaw.p}
              </div>
              <div className="text-white text-sm font-mono">
                {result.pid.yaw.i}
              </div>
              <div className="text-white text-sm font-mono">
                {result.pid.yaw.d}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Settings */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10">
          <h3 className="font-medium text-white text-sm">
            {t('filterSettings')}
          </h3>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3 text-sm">
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
          <div className="flex justify-between">
            <span className="text-gray-500">{t('dynNotchMin')}</span>
            <span className="text-white font-mono">
              {result.filters.dyn_notch_min_hz} Hz
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('dynNotchMax')}</span>
            <span className="text-white font-mono">
              {result.filters.dyn_notch_max_hz} Hz
            </span>
          </div>
        </div>
      </div>

      {/* CLI Commands */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-medium text-white text-sm">{t('cliCommands')}</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
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
        <div className="p-4 max-h-60 overflow-y-auto bg-black/20">
          <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
            {result.cli_commands}
          </pre>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="font-medium text-white mb-3 text-sm">
          {t('howToApply')}
        </h3>
        <ol className="space-y-2 text-gray-400 text-sm">
          <li className="flex gap-3">
            <span className="text-gray-500 font-mono text-xs w-4">1.</span>
            <span>{t('applySteps.step1')}</span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-500 font-mono text-xs w-4">2.</span>
            <span>{t('applySteps.step2')}</span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-500 font-mono text-xs w-4">3.</span>
            <span>{t('applySteps.step3')}</span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-500 font-mono text-xs w-4">4.</span>
            <span>{t('applySteps.step4')}</span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-500 font-mono text-xs w-4">5.</span>
            <span>{t('applySteps.step5')}</span>
          </li>
        </ol>
      </div>

      {/* Back to Home */}
      <a
        href="/"
        className="block w-full text-center py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
      >
        {t('backToHome')}
      </a>
    </div>
  );
}

// 数据不足错误弹窗
function InsufficientDataModal({
  error,
  details,
  code,
  onClose,
  locale,
}: {
  error: string;
  details: string;
  code?: string;
  onClose: () => void;
  locale: string;
}) {
  const isZh = locale === 'zh';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const isGroundIdle = code === 'GROUND_IDLE_ONLY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md mx-4 bg-[#0a0b0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-white/10 bg-orange-500/10">
          <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{error}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* 问题说明 */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-sm text-gray-300 leading-relaxed">
              {isGroundIdle
                ? isZh
                  ? '您上传的黑盒日志看起来只包含地面怠速数据，没有检测到实际飞行。AI 调参需要真实的飞行数据来分析您的飞控表现。'
                  : 'Your blackbox log appears to contain only ground idle data with no actual flight detected. AI tuning requires real flight data to analyze your flight controller performance.'
                : isZh
                  ? '您上传的黑盒日志飞行时间太短。AI 调参需要足够的飞行数据来准确分析您的飞控表现并生成优化建议。'
                  : 'Your blackbox log has insufficient flight duration. AI tuning requires enough flight data to accurately analyze your flight controller performance and generate optimization recommendations.'}
            </p>
          </div>

          {/* 建议 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white">
              {isZh ? '建议' : 'Suggestions'}
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">•</span>
                <span>
                  {isZh
                    ? '录制一段至少 30 秒的飞行数据（包含各种动作）'
                    : 'Record at least 30 seconds of flight data (with various maneuvers)'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">•</span>
                <span>
                  {isZh
                    ? '确保黑盒记录在起飞后开始，而不是地面怠速时'
                    : 'Make sure blackbox recording starts after takeoff, not during ground idle'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">•</span>
                <span>
                  {isZh
                    ? '检查黑盒设置，确保采样率足够（建议 2kHz）'
                    : 'Check blackbox settings, ensure sample rate is sufficient (2kHz recommended)'}
                </span>
              </li>
            </ul>
          </div>

          {/* 关闭按钮 */}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-2 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition-all border border-white/20 text-sm"
          >
            {isZh ? '知道了' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}

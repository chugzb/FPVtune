'use client';

import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Copy,
  Download,
  FileText,
  Loader2,
  Lock,
  Shield,
  Terminal,
  Upload,
  Zap,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface FormData {
  blackboxFile: File | null;
  cliDumpFile: File | null;
  problems: string[];
  goals: string[];
  additionalNotes: string;
  customGoal: string;
  flyingStyle: string;
  frameSize: string;
  email: string;
}

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
  other: {
    dshot_bidir: boolean;
    motor_output_limit: number;
    throttle_boost: number;
    anti_gravity_gain: number;
  };
  cli_commands: string;
}

const TOTAL_STEPS = 6;
const VALID_TEST_CODES = ['JB_VIP_TEST'];
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
const frameIds = ['2-3', '5', '7', '10+'];

export function TuneWizard() {
  const t = useTranslations('TunePage.wizard');
  const locale = useLocale();
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
    email: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [testCode, setTestCode] = useState('');

  const stepLabels = [
    t('steps.upload'),
    t('steps.problems'),
    t('steps.goals'),
    t('steps.style'),
    t('steps.frame'),
    t('steps.payment'),
  ];

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return formData.blackboxFile !== null;
      case 2:
        return formData.problems.length > 0;
      case 3:
        return formData.goals.length > 0;
      case 4:
        return formData.flyingStyle !== '';
      case 5:
        return formData.frameSize !== '';
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

  const handleFileChange = (
    type: 'blackbox' | 'cliDump',
    file: File | null
  ) => {
    if (type === 'blackbox') {
      setFormData((prev) => ({ ...prev, blackboxFile: file }));
    } else {
      setFormData((prev) => ({ ...prev, cliDumpFile: file }));
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
      apiFormData.append('additionalNotes', formData.additionalNotes);
      apiFormData.append('email', formData.email);
      apiFormData.append('locale', locale);

      const response = await fetch('/api/tune/analyze', {
        method: 'POST',
        body: apiFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result.analysis);
      setCurrentStep(7);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestCodeSubmit = async () => {
    // 验证测试码
    if (!VALID_TEST_CODES.includes(testCode.toUpperCase())) {
      setError('Invalid test code');
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
      apiFormData.append('additionalNotes', formData.additionalNotes);
      apiFormData.append('email', formData.email);
      apiFormData.append('locale', locale);
      apiFormData.append('testCode', testCode.toUpperCase());

      const response = await fetch('/api/tune/analyze', {
        method: 'POST',
        body: apiFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result.analysis);
      setCurrentStep(7);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030304] text-white">
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
            <StepFrameSize
              selected={formData.frameSize}
              onSelect={(size) =>
                setFormData((prev) => ({ ...prev, frameSize: size }))
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
          {currentStep === 7 && analysisResult && (
            <StepResults result={analysisResult} />
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
}: {
  blackboxFile: File | null;
  cliDumpFile: File | null;
  onFileChange: (type: 'blackbox' | 'cliDump', file: File | null) => void;
}) {
  const t = useTranslations('TunePage.wizard.upload');

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
                <p className="text-sm text-gray-500">{t('blackboxHint')}</p>
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
                <span className="text-gray-500">{t('cliDumpOptional')}</span>
              </p>
              {cliDumpFile ? (
                <p className="text-sm text-green-400">{cliDumpFile.name}</p>
              ) : (
                <p className="text-sm text-gray-500">{t('cliDumpHint')}</p>
              )}
            </div>
            <Upload className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>

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

// Step 5: Frame Size
function StepFrameSize({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (size: string) => void;
}) {
  const t = useTranslations('TunePage.wizard.frames');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">{t('title')}</h1>
        <p className="text-gray-400">{t('description')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {frameIds.map((id) => (
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
            <div className="text-4xl font-bold text-white mb-2">
              {t(`items.${id}.name` as any)}
            </div>
            <p className="text-sm text-gray-500">
              {t(`items.${id}.description` as any)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 6: Payment
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
  const [showTestCode, setShowTestCode] = useState(false);

  const styleName = tStyles(`${formData.flyingStyle}.name` as any);
  const sizeName = tFrames(`${formData.frameSize}.name` as any);
  const problemNames = formData.problems.map((p) =>
    tProblems(`${p}.name` as any)
  );
  const goalNames = formData.goals.map((g) => tGoals(`${g}.name` as any));
  const allGoals = formData.customGoal
    ? [...goalNames, formData.customGoal]
    : goalNames;

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

      {/* Price Card */}
      <div className="bg-gradient-to-b from-blue-500/20 to-transparent border border-blue-500/30 rounded-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">{t('oneTimePayment')}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">$9.99</span>
              <span className="text-gray-500 line-through">$19.99</span>
            </div>
            <p className="text-sm text-green-400 mt-1">{t('launchDiscount')}</p>
          </div>
          <div className="bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
            {t('limitedOffer')}
          </div>
        </div>

        <div className="space-y-2 mb-6 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span>{t('features.pid')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span>{t('features.filter')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span>{t('features.feedforward')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span>{t('features.cli')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span>{t('features.report')}</span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <label
            htmlFor="payment-email"
            className="block text-sm font-medium text-white mb-2"
          >
            {t('emailAddress')}
          </label>
          <input
            id="payment-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">{t('emailHint')}</p>
        </div>
      </div>

      {/* Payment Button */}
      <button
        type="button"
        onClick={onPayment}
        disabled={!email || isProcessing}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-lg transition-all',
          email && !isProcessing
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
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
            <Lock className="w-5 h-5" />
            {t('payButton')}
          </>
        )}
      </button>

      {/* Test Code Section */}
      <div className="border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => setShowTestCode(!showTestCode)}
          className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          {showTestCode ? t('hideTestCode') : t('haveTestCode')}
        </button>

        {showTestCode && (
          <div className="mt-3 space-y-3">
            <input
              type="text"
              value={testCode}
              onChange={(e) => onTestCodeChange(e.target.value)}
              placeholder={t('testCodePlaceholder')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-green-500"
            />
            <button
              type="button"
              onClick={onTestCodeSubmit}
              disabled={!testCode || !email || isProcessing}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all',
                testCode && email && !isProcessing
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('analyzing')}
                </>
              ) : (
                t('useTestCode')
              )}
            </button>
          </div>
        )}
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
          <Shield className="w-4 h-4" />
          <span>{t('securePayment')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span>{t('instantDelivery')}</span>
        </div>
      </div>
    </div>
  );
}

// Step 7: Results
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
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold mb-3">{t('title')}</h1>
        <p className="text-gray-400">{t('description')}</p>
      </div>

      {/* Analysis Summary */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h3 className="font-semibold text-white mb-3">
          {t('analysisSummary')}
        </h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          {result.analysis.summary}
        </p>
      </div>

      {/* Issues Found */}
      {result.analysis.issues.length > 0 && (
        <div className="bg-orange-500/10 rounded-xl border border-orange-500/20 p-6">
          <h3 className="font-semibold text-orange-400 mb-3">
            {t('issuesIdentified')}
          </h3>
          <ul className="space-y-2">
            {result.analysis.issues.map((issue, i) => (
              <li key={i} className="text-gray-300 text-sm flex gap-2">
                <span className="text-orange-400 flex-shrink-0">-</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {result.analysis.recommendations.length > 0 && (
        <div className="bg-blue-500/10 rounded-xl border border-blue-500/20 p-6">
          <h3 className="font-semibold text-blue-400 mb-3">
            {t('recommendations')}
          </h3>
          <ul className="space-y-2">
            {result.analysis.recommendations.map((rec, i) => (
              <li key={i} className="text-gray-300 text-sm flex gap-2">
                <span className="text-blue-400 flex-shrink-0">-</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* PID Values */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5">
          <h3 className="font-semibold text-white">{t('optimizedPID')}</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2 text-center text-sm mb-2">
            <div className="text-gray-500">{t('axis')}</div>
            <div className="text-gray-500">P</div>
            <div className="text-gray-500">I</div>
            <div className="text-gray-500">D</div>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 text-center bg-white/5 rounded-lg py-2">
              <div className="text-white font-medium">{t('roll')}</div>
              <div className="text-blue-400">{result.pid.roll.p}</div>
              <div className="text-green-400">{result.pid.roll.i}</div>
              <div className="text-orange-400">{result.pid.roll.d}</div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center bg-white/5 rounded-lg py-2">
              <div className="text-white font-medium">{t('pitch')}</div>
              <div className="text-blue-400">{result.pid.pitch.p}</div>
              <div className="text-green-400">{result.pid.pitch.i}</div>
              <div className="text-orange-400">{result.pid.pitch.d}</div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center bg-white/5 rounded-lg py-2">
              <div className="text-white font-medium">{t('yaw')}</div>
              <div className="text-blue-400">{result.pid.yaw.p}</div>
              <div className="text-green-400">{result.pid.yaw.i}</div>
              <div className="text-orange-400">{result.pid.yaw.d}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Settings */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5">
          <h3 className="font-semibold text-white">{t('filterSettings')}</h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">{t('gyroLPF')}</span>
            <span className="text-white">
              {result.filters.gyro_lowpass_hz} Hz
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t('dtermLPF')}</span>
            <span className="text-white">
              {result.filters.dterm_lowpass_hz} Hz
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t('dynNotchCount')}</span>
            <span className="text-white">{result.filters.dyn_notch_count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t('dynNotchQ')}</span>
            <span className="text-white">{result.filters.dyn_notch_q}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t('dynNotchMin')}</span>
            <span className="text-white">
              {result.filters.dyn_notch_min_hz} Hz
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t('dynNotchMax')}</span>
            <span className="text-white">
              {result.filters.dyn_notch_max_hz} Hz
            </span>
          </div>
        </div>
      </div>

      {/* CLI Commands */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <h3 className="font-semibold text-white">{t('cliCommands')}</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied ? t('copied') : t('copy')}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('download')}
            </button>
          </div>
        </div>
        <div className="p-4 max-h-64 overflow-y-auto">
          <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
            {result.cli_commands}
          </pre>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-green-500/10 rounded-xl border border-green-500/20 p-6">
        <h3 className="font-semibold text-green-400 mb-3">{t('howToApply')}</h3>
        <ol className="space-y-2 text-gray-300 text-sm">
          <li className="flex gap-2">
            <span className="text-green-400 font-medium">1.</span>
            <span>{t('applySteps.step1')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400 font-medium">2.</span>
            <span>{t('applySteps.step2')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400 font-medium">3.</span>
            <span>{t('applySteps.step3')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400 font-medium">4.</span>
            <span>{t('applySteps.step4')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400 font-medium">5.</span>
            <span>{t('applySteps.step5')}</span>
          </li>
        </ol>
      </div>

      {/* Back to Home */}
      <a
        href="/"
        className="block w-full text-center py-4 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition-colors"
      >
        {t('backToHome')}
      </a>
    </div>
  );
}

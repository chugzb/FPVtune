'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/ui/logo';
import { websiteConfig } from '@/config/website';
import {
  LocaleLink,
  useLocalePathname,
  useLocaleRouter,
} from '@/i18n/navigation';
import { useLocaleStore } from '@/stores/locale-store';
import {
  Activity,
  CheckCircle,
  ChevronRight,
  Cpu,
  Github,
  Shield,
  Sliders,
  Target,
  Terminal,
  Thermometer,
  Twitter,
  Upload,
  Zap,
} from 'lucide-react';
import { type Locale, useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { LocaleSuggestionBanner } from './locale-suggestion-banner';

function HomeLocaleSwitcher() {
  const showLocaleSwitch = Object.keys(websiteConfig.i18n.locales).length > 1;
  if (!showLocaleSwitch) {
    return null;
  }

  const router = useLocaleRouter();
  const pathname = useLocalePathname();
  const params = useParams();
  const locale = useLocale();
  const { setCurrentLocale } = useLocaleStore();
  const [, startTransition] = useTransition();

  useEffect(() => {
    setCurrentLocale(locale);
  }, [locale, setCurrentLocale]);

  const setLocale = (nextLocale: Locale) => {
    setCurrentLocale(nextLocale);
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        { pathname, params },
        { locale: nextLocale }
      );
    });
  };

  const currentLocaleData =
    websiteConfig.i18n.locales[
      locale as keyof typeof websiteConfig.i18n.locales
    ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="px-3 py-1.5 text-xs font-medium border border-white/20 rounded-md hover:bg-white/10 transition-colors text-white/70 cursor-pointer flex items-center gap-1.5">
          {currentLocaleData?.flag && <span>{currentLocaleData.flag}</span>}
          <span>{currentLocaleData?.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(websiteConfig.i18n.locales).map(
          ([localeOption, data]) => (
            <DropdownMenuItem
              key={localeOption}
              onClick={() => setLocale(localeOption as Locale)}
              className="cursor-pointer"
            >
              {data.flag && <span className="mr-2">{data.flag}</span>}
              <span className="text-sm">{data.name}</span>
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FPVtuneHome() {
  const t = useTranslations('HomePage');
  const tMarketing = useTranslations('Marketing');

  return (
    <div className="min-h-screen bg-[#030304] text-white selection:bg-white selection:text-black">
      {/* Language Suggestion Banner */}
      <LocaleSuggestionBanner />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#030304]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <LocaleLink href="/" className="flex items-center group">
            <Logo className="h-6 w-auto" />
          </LocaleLink>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors">
              {t('nav.features')}
            </a>
            <a
              href="#how-it-works"
              className="hover:text-white transition-colors"
            >
              {t('nav.howItWorks')}
            </a>
            <LocaleLink
              href="/guides"
              className="hover:text-white transition-colors"
            >
              {t('nav.tutorials')}
            </LocaleLink>
            <LocaleLink
              href="/blog"
              className="hover:text-white transition-colors"
            >
              {t('nav.blog')}
            </LocaleLink>
          </div>
          <HomeLocaleSwitcher />
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-60"
          >
            <source src="/1768311500309-jdxhgnht7ro.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030304] via-[#030304]/50 to-transparent" />
        </div>

        <div className="relative z-10 text-center max-w-4xl px-4 sm:px-6 pt-16 sm:pt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 sm:mb-8 rounded-full border border-white/30 bg-black/60 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-white tracking-wide uppercase">
              {t('landing.heroBadge')}
            </span>
          </div>

          <h1 className="font-bold text-3xl sm:text-5xl md:text-7xl tracking-tight leading-tight sm:leading-none mb-4 sm:mb-6 text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            {t('landing.heroTitle1')}
            <br />
            <span className="text-blue-400 drop-shadow-[0_4px_20px_rgba(59,130,246,0.5)]">
              {t('landing.heroTitle2')}
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-white/90 max-w-2xl mx-auto mb-8 sm:mb-12 font-light leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            {t('landing.heroDesc')}
          </p>

          <LocaleLink
            href="/tune"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-white to-gray-200 text-black font-semibold px-6 sm:px-10 py-3 sm:py-4 rounded-xl hover:scale-[1.02] transition-transform text-base sm:text-lg"
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            {t('landing.startTuningNow')}
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </LocaleLink>
        </div>
      </header>

      {/* Stats Section */}
      <section className="border-y border-white/5 bg-black/40 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          <div className="text-center md:text-left">
            <div className="text-xl sm:text-2xl font-bold text-white">
              0.02s
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 font-mono uppercase mt-1">
              {t('landing.stats.analysisSpeed')}
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-2xl font-bold text-white">98.5%</div>
            <div className="text-[10px] sm:text-xs text-gray-500 font-mono uppercase mt-1">
              {t('landing.stats.noiseReduction')}
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-xl sm:text-2xl font-bold text-white">54k+</div>
            <div className="text-[10px] sm:text-xs text-gray-500 font-mono uppercase mt-1">
              {t('landing.stats.dronesTuned')}
            </div>
          </div>
          <div className="text-center md:text-left flex items-center justify-center md:justify-start gap-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            <div className="text-xs sm:text-sm text-gray-300 font-medium">
              Betaflight 4.3+
              <br />
              {t('landing.stats.compatible')}
            </div>
          </div>
        </div>
      </section>

      {/* What is Betaflight PID Tuning Section */}
      <section id="what-is-pid" className="py-12 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-16 items-center">
            <div>
              <h2 className="text-2xl sm:text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-white">
                {t('landing.whatIsPid.title')}
              </h2>
              <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-400 leading-relaxed">
                <p>
                  <strong className="text-white">
                    {t('landing.whatIsPid.betaflightPidTuning')}
                  </strong>{' '}
                  {t('landing.whatIsPid.desc1')}
                </p>
                <p>{t('landing.whatIsPid.desc2')}</p>
                <p>
                  <strong className="text-white">
                    {t('landing.whatIsPid.fpvtuneUsesAi')}
                  </strong>{' '}
                  {t('landing.whatIsPid.desc3')}
                </p>
              </div>
            </div>
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-6 text-white">
                {t('landing.problems.title')}
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-400 text-xs">1</span>
                  </div>
                  <div>
                    <span className="text-white font-medium">
                      {t('landing.problems.propWash')}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('landing.problems.propWashDesc')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-400 text-xs">2</span>
                  </div>
                  <div>
                    <span className="text-white font-medium">
                      {t('landing.problems.hotMotors')}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('landing.problems.hotMotorsDesc')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-400 text-xs">3</span>
                  </div>
                  <div>
                    <span className="text-white font-medium">
                      {t('landing.problems.sluggish')}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('landing.problems.sluggishDesc')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-400 text-xs">4</span>
                  </div>
                  <div>
                    <span className="text-white font-medium">
                      {t('landing.problems.midThrottle')}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('landing.problems.midThrottleDesc')}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-12 sm:py-24 border-t border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              {t('landing.howItWorksSection.title')}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('landing.howItWorksSection.desc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 hover:border-white/15 transition-all">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30">
                <Upload className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                {t('landing.howItWorksSection.step1Title')}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {t('landing.howItWorksSection.step1Desc')}
              </p>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 hover:border-white/15 transition-all">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30">
                <Cpu className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                {t('landing.howItWorksSection.step2Title')}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {t('landing.howItWorksSection.step2Desc')}
              </p>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 hover:border-white/15 transition-all">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30">
                <Terminal className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                {t('landing.howItWorksSection.step3Title')}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {t('landing.howItWorksSection.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              {t('landing.featuresSection.title')}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('landing.featuresSection.desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Spectral Analysis Card */}
            <div className="md:col-span-2 bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 relative overflow-hidden h-[400px] hover:border-white/15 hover:bg-white/[0.04] transition-all">
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">
                    {t('landing.featuresSection.spectral')}
                  </h3>
                  <p className="text-sm text-gray-400 max-w-sm">
                    {t('landing.featuresSection.spectralDesc')}
                  </p>
                </div>
                <div className="w-full h-32 flex items-end gap-1 opacity-50">
                  <div className="w-full bg-gradient-to-t from-blue-500/20 to-transparent h-[40%] border-t border-blue-500" />
                  <div className="w-full bg-gradient-to-t from-blue-500/20 to-transparent h-[70%] border-t border-blue-500" />
                  <div className="w-full bg-gradient-to-t from-blue-500/20 to-transparent h-[30%] border-t border-blue-500" />
                  <div className="w-full bg-gradient-to-t from-red-500/20 to-transparent h-[90%] border-t border-red-500" />
                  <div className="w-full bg-gradient-to-t from-blue-500/20 to-transparent h-[20%] border-t border-blue-500" />
                </div>
              </div>
            </div>

            {/* CLI Export Card */}
            <div className="md:col-span-1 bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 h-[400px] flex flex-col hover:border-white/15 hover:bg-white/[0.04] transition-all">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                {t('landing.featuresSection.cliExport')}
              </h3>
              <p className="text-sm text-gray-400 mb-8">
                {t('landing.featuresSection.cliExportDesc')}
              </p>
              <div className="flex-1 bg-[#050505] rounded-lg p-4 font-mono text-xs text-gray-400 border border-white/5 overflow-hidden">
                <span className="text-purple-400">
                  # Betaflight PID Tuning by FPVtune
                </span>
                <br />
                set p_pitch = 45
                <br />
                set i_pitch = 80
                <br />
                set d_pitch = 35
                <br />
                set dyn_notch_count = 2<br />
                set dyn_notch_q = 350
                <br />
                <span className="text-green-400">save</span>
                <span className="animate-pulse">_</span>
              </div>
            </div>

            {/* Thermal Prediction Card */}
            <div className="md:col-span-1 bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 hover:border-white/15 hover:bg-white/[0.04] transition-all">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <Thermometer className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                {t('landing.featuresSection.thermal')}
              </h3>
              <p className="text-sm text-gray-400">
                {t('landing.featuresSection.thermalDesc')}
              </p>
              <div className="mt-6 text-right">
                <div className="text-3xl font-mono font-bold text-white">
                  45°C
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                  {t('landing.featuresSection.estMaxTemp')}
                </div>
              </div>
            </div>

            {/* Filter Optimization Card */}
            <div className="md:col-span-1 bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 hover:border-white/15 hover:bg-white/[0.04] transition-all">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <Sliders className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                {t('landing.featuresSection.dynamicFilter')}
              </h3>
              <p className="text-sm text-gray-400">
                {t('landing.featuresSection.dynamicFilterDesc')}
              </p>
            </div>

            {/* Prop Wash Elimination Card */}
            <div className="md:col-span-1 bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 hover:border-white/15 hover:bg-white/[0.04] transition-all">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                {t('landing.featuresSection.propWashElim')}
              </h3>
              <p className="text-sm text-gray-400">
                {t('landing.featuresSection.propWashElimDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Configurations Section */}
      <section className="py-12 sm:py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              {t('landing.supported.title')}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('landing.supported.desc')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 text-center hover:border-white/15 transition-all">
              <div className="text-3xl font-bold text-white mb-2">2-3"</div>
              <div className="text-sm text-gray-400">
                {t('landing.supported.tinyWhoop')}
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 text-center hover:border-white/15 transition-all">
              <div className="text-3xl font-bold text-white mb-2">5"</div>
              <div className="text-sm text-gray-400">
                {t('landing.supported.freestyle')}
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 text-center hover:border-white/15 transition-all">
              <div className="text-3xl font-bold text-white mb-2">7"</div>
              <div className="text-sm text-gray-400">
                {t('landing.supported.longRange')}
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6 text-center hover:border-white/15 transition-all">
              <div className="text-3xl font-bold text-white mb-2">10"+</div>
              <div className="text-sm text-gray-400">
                {t('landing.supported.cinelifter')}
              </div>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">
                  {t('landing.supported.escProtocols')}
                </h4>
                <p className="text-sm text-gray-400">
                  {t('landing.supported.escProtocolsDesc')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">
                  {t('landing.supported.gyroChip')}
                </h4>
                <p className="text-sm text-gray-400">
                  {t('landing.supported.gyroChipDesc')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">
                  {t('landing.supported.flyingStyle')}
                </h4>
                <p className="text-sm text-gray-400">
                  {t('landing.supported.flyingStyleDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose FPVtune Section */}
      <section className="py-12 sm:py-24 border-t border-white/5 bg-gradient-to-b from-transparent to-blue-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              {t('landing.whyChoose.title')}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('landing.whyChoose.desc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-3">
                <Zap className="w-6 h-6 text-yellow-400" />
                {t('landing.whyChoose.traditional')}
              </h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✗</span>
                  {t('landing.whyChoose.traditionalItems.item1')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✗</span>
                  {t('landing.whyChoose.traditionalItems.item2')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✗</span>
                  {t('landing.whyChoose.traditionalItems.item3')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✗</span>
                  {t('landing.whyChoose.traditionalItems.item4')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✗</span>
                  {t('landing.whyChoose.traditionalItems.item5')}
                </li>
              </ul>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-400" />
                {t('landing.whyChoose.aiTuning')}
              </h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {t('landing.whyChoose.aiTuningItems.item1')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {t('landing.whyChoose.aiTuningItems.item2')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {t('landing.whyChoose.aiTuningItems.item3')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {t('landing.whyChoose.aiTuningItems.item4')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {t('landing.whyChoose.aiTuningItems.item5')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Betaflight PID Tuning Guide Section */}
      <section className="py-12 sm:py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              {t('landing.guide.title')}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('landing.guide.desc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t('landing.guide.pGain')}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {t('landing.guide.pGainDesc')}
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t('landing.guide.iGain')}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {t('landing.guide.iGainDesc')}
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t('landing.guide.dGain')}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {t('landing.guide.dGainDesc')}
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t('landing.guide.filter')}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {t('landing.guide.filterDesc')}
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t('landing.guide.feedforward')}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {t('landing.guide.feedforwardDesc')}
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t('landing.guide.rpm')}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {t('landing.guide.rpmDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              {t('landing.faq.title')}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('landing.faq.desc')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('landing.faq.q1')}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('landing.faq.a1')}
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('landing.faq.q2')}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('landing.faq.a2')}
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('landing.faq.q3')}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('landing.faq.a3')}
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('landing.faq.q4')}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('landing.faq.a4')}
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('landing.faq.q5')}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('landing.faq.a5')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="upload" className="py-12 sm:py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/20 rounded-3xl p-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              {t('landing.cta.title')}
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto mb-8">
              {t('landing.cta.desc')}
            </p>
            <LocaleLink
              href="/tune"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-white to-gray-200 text-black font-semibold px-10 py-4 rounded-xl hover:scale-[1.02] transition-transform text-lg"
            >
              <Upload className="w-5 h-5" />
              {t('landing.startTuningNow')}
              <ChevronRight className="w-5 h-5" />
            </LocaleLink>
            <p className="text-xs text-gray-500 mt-6">
              {t('landing.cta.supportedFiles')}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-8">
              <LocaleLink href="/" className="flex items-center">
                <Logo className="h-6 w-auto" />
              </LocaleLink>
              <p className="text-sm text-gray-500 hidden md:block">
                {t('landing.footer.tagline')}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="#features"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {t('nav.features')}
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {t('nav.howItWorks')}
              </a>
              <LocaleLink
                href="/guides"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {t('nav.tutorials')}
              </LocaleLink>
              <LocaleLink
                href="/blog"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {t('nav.blog')}
              </LocaleLink>
            </div>
          </div>
          <div className="border-t border-white/5 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-xs text-gray-500">
                2025 {t('landing.footer.copyright')}
              </p>
              <div className="flex items-center gap-4 text-xs">
                <LocaleLink
                  href="/privacy"
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  {tMarketing('footer.legal.items.privacyPolicy')}
                </LocaleLink>
                <LocaleLink
                  href="/terms"
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  {tMarketing('footer.legal.items.termsOfService')}
                </LocaleLink>
                <LocaleLink
                  href="/refund"
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  {tMarketing('footer.legal.items.refundPolicy')}
                </LocaleLink>
                <LocaleLink
                  href="/contact"
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  {tMarketing('navbar.pages.items.contact.title')}
                </LocaleLink>
              </div>
            </div>
            <div className="flex gap-4">
              <a
                href="https://github.com/fpvtune"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/fpvtune"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

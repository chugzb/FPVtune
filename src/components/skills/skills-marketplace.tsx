'use client';

import { cn } from '@/lib/utils';
import {
  Activity,
  CheckCircle,
  ChevronRight,
  FileText,
  Terminal,
  Thermometer,
  Upload,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function SkillsMarketplace() {
  const t = useTranslations('TunePage.form');
  const [frameSize, setFrameSize] = useState('5');
  const [motorKv, setMotorKv] = useState('');
  const [frameName, setFrameName] = useState('');
  const [motorName, setMotorName] = useState('');

  return (
    <div className="min-h-screen bg-[#030304] text-white selection:bg-white selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#030304]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-6 h-6 border border-white/20 rounded-full flex items-center justify-center group-hover:border-white transition-colors">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              FPVtune
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
            <a
              href="#technology"
              className="hover:text-white transition-colors"
            >
              Technology
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              {t('header.pricing')}
            </a>
            <a href="/docs" className="hover:text-white transition-colors">
              {t('header.docs')}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/auth/login"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Log in
            </a>
            <button
              type="button"
              className="bg-gradient-to-b from-white to-gray-200 text-black font-medium px-4 py-1.5 rounded text-sm hover:scale-[1.02] transition-transform"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030304_90%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030304] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 text-center max-w-4xl px-6 pt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-xs font-mono text-gray-300 tracking-wide uppercase">
              {t('hero.badge')}
            </span>
          </div>

          <h1 className="font-bold text-5xl md:text-7xl tracking-tight leading-none mb-6 bg-gradient-to-br from-white via-white to-gray-400 bg-clip-text text-transparent">
            {t('hero.titleLine1')}
            <br />
            <span className="text-blue-400">{t('hero.titleLine2')}</span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            {t('hero.description')}
          </p>

          <div className="w-full max-w-lg mx-auto">
            <div className="rounded-xl p-2 cursor-pointer group border border-white/10 bg-white/5">
              <div className="relative h-32 border border-dashed border-white/10 rounded-lg bg-black/20 flex flex-col items-center justify-center gap-3 group-hover:border-white/30 transition-colors">
                <input
                  type="file"
                  accept=".bbl,.bfl,.txt"
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
                />
                <Upload className="w-6 h-6 text-gray-500 group-hover:text-white transition-colors" />
                <div className="text-center">
                  <span className="block text-sm font-medium text-white">
                    {t('upload.blackboxLog')}
                  </span>
                  <span className="block text-xs text-gray-500 mt-1 font-mono">
                    {t('upload.blackboxHint')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="border-y border-white/5 bg-black/40 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center md:text-left">
            <div className="text-2xl font-bold text-white">0.02s</div>
            <div className="text-xs text-gray-500 font-mono uppercase mt-1">
              Analysis Speed
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-2xl font-bold text-white">98.5%</div>
            <div className="text-xs text-gray-500 font-mono uppercase mt-1">
              Noise Reduction
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-2xl font-bold text-white">54k+</div>
            <div className="text-xs text-gray-500 font-mono uppercase mt-1">
              Drones Tuned
            </div>
          </div>
          <div className="text-center md:text-left flex items-center justify-center md:justify-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div className="text-sm text-gray-300 font-medium">
              Safe for all
              <br />
              ESC protocols
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-3xl font-semibold mb-4 text-white">
              Precision Diagnostics
            </h2>
            <p className="text-gray-400 max-w-xl leading-relaxed">
              Most pilots guess. We measure. Our neural network breaks down your
              flight data into spectral components to find the perfect balance
              between latency and smoothness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-2xl p-8 relative overflow-hidden h-[400px] border border-white/10 bg-white/5">
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">
                    Spectral Density Map
                  </h3>
                  <p className="text-sm text-gray-400 max-w-sm">
                    Visualizes gyro noise and D-term resonance. We identify the
                    exact frequency to place your dynamic notch filters.
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

            <div className="md:col-span-1 rounded-2xl p-8 h-[400px] flex flex-col border border-white/10 bg-white/5">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                Export to Betaflight
              </h3>
              <p className="text-sm text-gray-400 mb-8">
                One-click CLI snippet generation. Paste directly into your
                flight controller.
              </p>
              <div className="flex-1 bg-[#050505] rounded-lg p-4 font-mono text-xs text-gray-400 border border-white/5 overflow-hidden">
                <span className="text-purple-400"># Generated by FPVtune</span>
                <br />
                set dyn_notch_count = 1
                <br />
                set dyn_notch_q = 250
                <br />
                set d_term_cutoff = 105
                <br />
                set pid_profile = 1
                <br />
                <span className="text-green-400">save</span>
                <span className="animate-pulse">_</span>
              </div>
            </div>

            <div className="md:col-span-3 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-10 border border-white/10 bg-white/5">
              <div className="flex-1">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                  <Thermometer className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">
                  Thermal Prediction
                </h3>
                <p className="text-sm text-gray-400 max-w-lg">
                  Pushing P-gains too high burns motors. Our model predicts
                  motor temperature based on your noise profile and cooling
                  setup, ensuring a safe tune.
                </p>
              </div>
              <div className="flex-1 flex justify-end">
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold text-white">
                    45 C
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                    Est. Max Temp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Form Section */}
      <section id="upload" className="py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold mb-4 text-white">
              {t('upload.stepTitle')}
            </h2>
            <p className="text-gray-400">{t('hero.description')}</p>
          </div>

          <div className="rounded-2xl p-8 border border-white/10 bg-white/5">
            {/* Step 1: Upload Files */}
            <div className="mb-10">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-400 border border-blue-500/30">
                  1
                </div>
                <h3 className="text-xl font-medium text-white">
                  {t('upload.stepTitle')}
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="group relative">
                  <input
                    type="file"
                    accept=".bbl,.bfl,.txt"
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  />
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-8 transition-all duration-200 group-hover:border-white/30 group-hover:bg-white/5">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 group-hover:bg-white/10">
                      <FileText className="h-6 w-6 text-gray-400 group-hover:text-white" />
                    </div>
                    <p className="mb-1 font-medium text-white">
                      {t('upload.blackboxLog')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('upload.blackboxHint')}
                    </p>
                  </div>
                </div>

                <div className="group relative">
                  <input
                    type="file"
                    accept=".txt"
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  />
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-8 transition-all duration-200 group-hover:border-white/30 group-hover:bg-white/5">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 group-hover:bg-white/10">
                      <Terminal className="h-6 w-6 text-gray-400 group-hover:text-white" />
                    </div>
                    <p className="mb-1 font-medium text-white">
                      {t('upload.cliDump')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('upload.cliDumpHint')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Hardware Info */}
            <div className="mb-10">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-400 border border-blue-500/30">
                  2
                </div>
                <h3 className="text-xl font-medium text-white">
                  {t('hardware.stepTitle')}
                </h3>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <span className="mb-2 block text-sm font-medium text-gray-300">
                    {t('hardware.frameSize')}
                  </span>
                  <div className="flex gap-2">
                    {['2', '3', '5', '7', '10'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFrameSize(size)}
                        className={cn(
                          'flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all',
                          frameSize === size
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : 'border-white/10 text-gray-400 hover:border-white/30'
                        )}
                      >
                        {size}"
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="frameName"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    {t('hardware.frameName')}
                  </label>
                  <input
                    id="frameName"
                    type="text"
                    value={frameName}
                    onChange={(e) => setFrameName(e.target.value)}
                    placeholder={t('hardware.frameNamePlaceholder')}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="motorName"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    {t('hardware.motorName')}
                  </label>
                  <input
                    id="motorName"
                    type="text"
                    value={motorName}
                    onChange={(e) => setMotorName(e.target.value)}
                    placeholder={t('hardware.motorNamePlaceholder')}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="motorKv"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    {t('hardware.motorKv')}
                  </label>
                  <input
                    id="motorKv"
                    type="text"
                    value={motorKv}
                    onChange={(e) => setMotorKv(e.target.value)}
                    placeholder={t('hardware.motorKvPlaceholder')}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-white to-gray-200 py-4 text-base font-semibold text-black transition-all hover:scale-[1.01]"
            >
              {t('submitButton')}
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#020202] pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-20">
            <div className="col-span-2">
              <span className="font-bold text-xl text-white block mb-6">
                FPVtune
              </span>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                {t('footer.madeBy')}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
                Product
              </h4>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Analyzer
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Presets Library
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Enterprise API
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
                Learn
              </h4>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                PID Tuning Guide
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Blackbox Setup
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Filter Theory
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
                Legal
              </h4>
              <a
                href="/privacy"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Terms
              </a>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-xs text-gray-600">
              2025 FPVtune Inc. All systems nominal.
            </span>
            <div className="flex gap-6">
              <a
                href="https://discord.gg/fpvtune"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                {t('footer.joinCommunity')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

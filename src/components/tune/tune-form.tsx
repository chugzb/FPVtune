'use client';

import { cn } from '@/lib/utils';
import {
  ChevronRight,
  FileText,
  Github,
  Settings,
  Terminal,
  Upload,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AdoptionSection } from './logo-marquee';

export function TuneForm() {
  const t = useTranslations('TunePage.form');
  const [frameSize, setFrameSize] = useState('5');
  const [motorKv, setMotorKv] = useState('');
  const [frameName, setFrameName] = useState('');
  const [motorName, setMotorName] = useState('');

  const features = [
    {
      icon: FileText,
      title: t('features.blackbox.title'),
      description: t('features.blackbox.description'),
    },
    {
      icon: Settings,
      title: t('features.hardware.title'),
      description: t('features.hardware.description'),
    },
    {
      icon: Upload,
      title: t('features.import.title'),
      description: t('features.import.description'),
    },
  ];

  const faqItems = [
    {
      question: t('faq.items.q1.question'),
      answer: t('faq.items.q1.answer'),
    },
    {
      question: t('faq.items.q2.question'),
      answer: t('faq.items.q2.answer'),
    },
    {
      question: t('faq.items.q3.question'),
      answer: t('faq.items.q3.answer'),
    },
    {
      question: t('faq.items.q4.question'),
      answer: t('faq.items.q4.answer'),
    },
    {
      question: t('faq.items.q5.question'),
      answer: t('faq.items.q5.answer'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-[#faf9f7]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-600">
              <span className="text-xs font-bold text-white">F</span>
            </div>
            <span className="text-[15px] font-semibold text-gray-900">
              FPVTune
            </span>
          </a>
          <nav className="flex items-center gap-3">
            <a
              href="/pricing"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              {t('header.pricing')}
            </a>
            <a
              href="/docs"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              {t('header.docs')}
            </a>
            <a
              href="https://github.com"
              className="text-gray-500 transition-colors hover:text-gray-900"
            >
              <Github className="h-5 w-5" />
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pb-8 pt-16">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm text-teal-700">
            <span>{t('hero.badge')}</span>
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-[72px]">
            {t('hero.titleLine1')}
            <br />
            <span className="text-teal-600">{t('hero.titleLine2')}</span>
          </h1>
          <p className="mx-auto mb-12 max-w-xl text-lg text-gray-500">
            {t('hero.description')}
          </p>
        </div>
      </section>

      {/* Main Form Section */}
      <main className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Step 1: Upload Files */}
          <div className="mb-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                1
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t('upload.stepTitle')}
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Blackbox Upload */}
              <div className="group relative">
                <input
                  type="file"
                  accept=".bbl,.bfl,.txt"
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
                />
                <div
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-8',
                    'transition-all duration-200',
                    'group-hover:border-teal-400 group-hover:bg-teal-50/50'
                  )}
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 group-hover:bg-teal-100">
                    <FileText className="h-6 w-6 text-gray-500 group-hover:text-teal-600" />
                  </div>
                  <p className="mb-1 font-medium text-gray-900">
                    {t('upload.blackboxLog')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('upload.blackboxHint')}
                  </p>
                </div>
              </div>

              {/* CLI Dump Upload */}
              <div className="group relative">
                <input
                  type="file"
                  accept=".txt"
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
                />
                <div
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-8',
                    'transition-all duration-200',
                    'group-hover:border-teal-400 group-hover:bg-teal-50/50'
                  )}
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 group-hover:bg-teal-100">
                    <Terminal className="h-6 w-6 text-gray-500 group-hover:text-teal-600" />
                  </div>
                  <p className="mb-1 font-medium text-gray-900">
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                2
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t('hardware.stepTitle')}
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Frame Size */}
              <div>
                <span className="mb-2 block text-sm font-medium text-gray-700">
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
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      {size}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Name */}
              <div>
                <label
                  htmlFor="frameName"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  {t('hardware.frameName')}
                </label>
                <input
                  id="frameName"
                  type="text"
                  value={frameName}
                  onChange={(e) => setFrameName(e.target.value)}
                  placeholder={t('hardware.frameNamePlaceholder')}
                  className={cn(
                    'w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm',
                    'placeholder:text-gray-400',
                    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'
                  )}
                />
              </div>

              {/* Motor Name */}
              <div>
                <label
                  htmlFor="motorName"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  {t('hardware.motorName')}
                </label>
                <input
                  id="motorName"
                  type="text"
                  value={motorName}
                  onChange={(e) => setMotorName(e.target.value)}
                  placeholder={t('hardware.motorNamePlaceholder')}
                  className={cn(
                    'w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm',
                    'placeholder:text-gray-400',
                    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'
                  )}
                />
              </div>

              {/* Motor KV */}
              <div>
                <label
                  htmlFor="motorKv"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  {t('hardware.motorKv')}
                </label>
                <input
                  id="motorKv"
                  type="text"
                  value={motorKv}
                  onChange={(e) => setMotorKv(e.target.value)}
                  placeholder={t('hardware.motorKvPlaceholder')}
                  className={cn(
                    'w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm',
                    'placeholder:text-gray-400',
                    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-4 text-base font-semibold text-white',
              'transition-all duration-200',
              'hover:bg-teal-700',
              'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2'
            )}
          >
            {t('submitButton')}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Features */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-200/60 bg-white/50 p-6"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                <feature.icon className="h-5 w-5 text-teal-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Adoption Section */}
      <AdoptionSection />

      {/* FAQ Section */}
      <section className="border-t border-gray-200/60 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              {t('faq.title')}
            </h2>
            <p className="text-gray-500">{t('faq.description')}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {faqItems.map((item, index) => (
              <div key={item.question} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-sm font-semibold text-teal-600">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900">
                    {item.question}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500">
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-500">{t('footer.madeBy')}</p>
            <a href="/docs" className="text-sm text-teal-600 hover:underline">
              {t('footer.viewDocs')}
            </a>
          </div>
          <a
            href="https://discord.gg/fpvtune"
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:bg-gray-50"
          >
            <span>
              <span className="font-medium text-gray-900">
                {t('footer.joinCommunity')}
              </span>
              <span className="ml-1 text-gray-500">
                {t('footer.discordGroup')}
              </span>
            </span>
          </a>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';
import { ChevronRight, Zap } from 'lucide-react';
import { useState } from 'react';

export default function HeroPreviewPage() {
  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C'>('A');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Tab Selector */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">选择方案：</span>
          {(['A', 'B', 'C'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              方案 {tab}
            </button>
          ))}
          <span className="ml-4 text-xs text-gray-400">
            {activeTab === 'A' && '背景视频'}
            {activeTab === 'B' && '左右分栏'}
            {activeTab === 'C' && '标题下方卡片'}
          </span>
        </div>
      </div>

      {/* Preview Area */}
      <div className="pt-4">
        {activeTab === 'A' && <HeroOptionA />}
        {activeTab === 'B' && <HeroOptionB />}
        {activeTab === 'C' && <HeroOptionC />}
      </div>
    </div>
  );
}

// 方案 A - 背景视频
function HeroOptionA() {
  return (
    <section className="relative min-h-[600px] overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/1768311500309-jdxhgnht7ro.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[600px] px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-teal-400/50 bg-teal-500/20 px-3 py-1 text-sm text-teal-100">
          <Zap className="h-3.5 w-3.5" />
          <span>神经网络驱动的智能调参</span>
        </div>
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-[72px]">
          定制你的
          <br />
          <span className="text-teal-400">完美 PID</span>
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-lg text-gray-200">
          上传 Blackbox 日志和飞控配置，神经网络分析你的飞行数据，
          生成针对你机型的专属调参方案
        </p>
        <button className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-4 text-base font-semibold text-white hover:bg-teal-700 transition-all">
          <Zap className="h-5 w-5" />
          开始智能分析
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

// 方案 B - 左右分栏
function HeroOptionB() {
  return (
    <section className="bg-[#faf9f7] py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left - Content */}
          <div>
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm text-teal-700">
              <Zap className="h-3.5 w-3.5" />
              <span>神经网络驱动的智能调参</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              定制你的
              <br />
              <span className="text-teal-600">完美 PID</span>
            </h1>
            <p className="mb-8 max-w-md text-lg text-gray-500">
              上传 Blackbox 日志和飞控配置，神经网络分析你的飞行数据，
              生成针对你机型的专属调参方案
            </p>
            <button className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-4 text-base font-semibold text-white hover:bg-teal-700 transition-all">
              <Zap className="h-5 w-5" />
              开始智能分析
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Right - Video */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full aspect-video object-cover"
              >
                <source src="/1768311500309-jdxhgnht7ro.mp4" type="video/mp4" />
              </video>
            </div>
            {/* Decorative elements */}
            <div className="absolute -z-10 -top-4 -right-4 w-full h-full rounded-2xl bg-teal-100" />
          </div>
        </div>
      </div>
    </section>
  );
}

// 方案 C - 标题下方卡片
function HeroOptionC() {
  return (
    <section className="bg-gradient-to-b from-[#f0fdf9] to-[#faf9f7] py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm text-teal-700">
            <Zap className="h-3.5 w-3.5" />
            <span>神经网络驱动的智能调参</span>
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            定制你的
            <span className="text-teal-600"> 完美 PID</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-gray-500">
            上传 Blackbox 日志和飞控配置，神经网络分析你的飞行数据，
            生成针对你机型的专属调参方案
          </p>
        </div>

        {/* Video Card */}
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
            <video
              controls
              className="w-full aspect-video object-cover"
              poster="/og.png"
            >
              <source src="/1768311500309-jdxhgnht7ro.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <button className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-4 text-base font-semibold text-white hover:bg-teal-700 transition-all">
            <Zap className="h-5 w-5" />
            开始智能分析
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

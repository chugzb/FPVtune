'use client';

import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, Gauge, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

// 动态数据显示效果
function AnimatedValue({
  value,
  suffix = '',
}: { value: string; suffix?: string }) {
  const [displayed, setDisplayed] = useState('0');

  useEffect(() => {
    const target = Number.parseInt(value.replace(/\D/g, ''));
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayed(value);
        clearInterval(timer);
      } else {
        setDisplayed(Math.floor(current).toString());
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {displayed}
      {suffix}
    </span>
  );
}

// 飞行轨迹粒子效果
function FlightTrails() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          style={{
            width: `${150 + i * 50}px`,
            top: `${20 + i * 15}%`,
            left: '-200px',
          }}
          animate={{
            x: ['0vw', '120vw'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.8,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// 数据仪表盘卡片
function DataCard({
  icon: Icon,
  label,
  value,
  unit,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20">
            <Icon className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              {label}
            </p>
            <p className="text-xl font-bold text-white font-mono">
              <AnimatedValue value={value} suffix={unit} />
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function HeroFPV() {
  const t = useTranslations('HomePage.hero');
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* 视频背景 */}
      <div className="absolute inset-0 z-0">
        {/* 占位图片 - 视频加载前显示 */}
        <div
          className={cn(
            'absolute inset-0 bg-cover bg-center transition-opacity duration-1000',
            videoLoaded ? 'opacity-0' : 'opacity-100'
          )}
          style={{
            backgroundImage: "url('/images/fpv-hero-bg.jpg')",
          }}
        />

        {/* 视频背景 - 需要上传到 R2 */}
        <video
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-1000',
            videoLoaded ? 'opacity-100' : 'opacity-0'
          )}
          poster="/images/fpv-hero-bg.jpg"
        >
          {/* 视频源 - 替换为实际的 R2 URL */}
          <source
            src="https://pub-placeholder.r2.dev/fpv-flight.mp4"
            type="video/mp4"
          />
        </video>

        {/* 渐变叠加层 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/30 via-transparent to-fuchsia-950/30" />
      </div>

      {/* 飞行轨迹效果 */}
      <FlightTrails />

      {/* 网格背景 */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* 主内容 */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* 左侧文案 */}
          <div className="text-center lg:text-left">
            {/* 标签 */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 border border-cyan-500/20 mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="text-sm text-cyan-400 font-medium">
                {t('introduction')}
              </span>
            </motion.div>

            {/* 主标题 */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight"
            >
              <span className="text-white">AI-Powered</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
                FPV Tuning
              </span>
              <br />
              <span className="text-white">Assistant</span>
            </motion.h1>

            {/* 描述 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-6 text-lg sm:text-xl text-gray-300 max-w-xl mx-auto lg:mx-0"
            >
              {t('description')}
            </motion.p>

            {/* CTA 按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="relative group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 rounded-xl px-8 py-6 text-lg font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300"
              >
                <LocaleLink href="/#pricing">
                  <span>{t('primary')}</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </LocaleLink>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl px-8 py-6 text-lg font-semibold border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-300"
              >
                <LocaleLink href="/docs">
                  <span>{t('secondary')}</span>
                </LocaleLink>
              </Button>
            </motion.div>
          </div>

          {/* 右侧数据展示 */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* 中心光晕 */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl" />

              {/* 数据卡片网格 */}
              <div className="relative grid grid-cols-2 gap-4">
                <DataCard
                  icon={Gauge}
                  label="PID Profiles"
                  value="10000"
                  unit="+"
                  delay={0.8}
                />
                <DataCard
                  icon={Cpu}
                  label="Flight Controllers"
                  value="50"
                  unit="+"
                  delay={1.0}
                />
                <DataCard
                  icon={Zap}
                  label="Optimizations"
                  value="99"
                  unit="%"
                  delay={1.2}
                />
                <DataCard
                  icon={ArrowRight}
                  label="Response Time"
                  value="0.5"
                  unit="s"
                  delay={1.4}
                />
              </div>

              {/* 装饰性代码块 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, duration: 0.6 }}
                className="mt-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 font-mono text-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-gray-500 text-xs">
                    pid_config.txt
                  </span>
                </div>
                <pre className="text-gray-300 overflow-hidden">
                  <code>
                    <span className="text-cyan-400">set</span>{' '}
                    <span className="text-fuchsia-400">p_roll</span> ={' '}
                    <span className="text-green-400">45</span>
                    {'\n'}
                    <span className="text-cyan-400">set</span>{' '}
                    <span className="text-fuchsia-400">i_roll</span> ={' '}
                    <span className="text-green-400">80</span>
                    {'\n'}
                    <span className="text-cyan-400">set</span>{' '}
                    <span className="text-fuchsia-400">d_roll</span> ={' '}
                    <span className="text-green-400">35</span>
                    {'\n'}
                    <span className="text-gray-500">
                      # AI optimized for freestyle
                    </span>
                  </code>
                </pre>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部渐变过渡 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      {/* 滚动提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

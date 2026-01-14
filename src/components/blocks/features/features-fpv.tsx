'use client';

import { cn } from '@/lib/utils';
import { motion, useInView } from 'framer-motion';
import {
  BarChart3,
  Brain,
  FileText,
  Gauge,
  LineChart,
  Settings2,
  Sliders,
  Upload,
  Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  delay,
}: FeatureCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      className="group relative"
    >
      {/* 悬停光晕 */}
      <div
        className={cn(
          'absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl',
          gradient
        )}
      />

      {/* 卡片内容 */}
      <div className="relative h-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-colors duration-300">
        {/* 图标 */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
            'bg-gradient-to-br',
            gradient.replace('bg-gradient-to-r', '')
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* 标题 */}
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>

        {/* 描述 */}
        <p className="text-muted-foreground leading-relaxed">{description}</p>

        {/* 装饰线条 */}
        <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </motion.div>
  );
}

// 核心功能展示区
function CoreFeatureShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.8 }}
      className="relative mt-20"
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-fuchsia-500/5 rounded-3xl" />

      <div className="relative bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-8 lg:p-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* 左侧：功能流程 */}
          <div className="space-y-6">
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground">
              How FPVTune Works
            </h3>

            <div className="space-y-4">
              {[
                {
                  icon: Upload,
                  text: 'Upload your Blackbox log or current PID settings',
                  color: 'text-cyan-400',
                },
                {
                  icon: Brain,
                  text: 'AI analyzes flight characteristics and identifies issues',
                  color: 'text-blue-400',
                },
                {
                  icon: Sliders,
                  text: 'Get optimized PID values tailored to your setup',
                  color: 'text-fuchsia-400',
                },
                {
                  icon: Zap,
                  text: 'Apply settings and enjoy smoother flights',
                  color: 'text-green-400',
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                      <step.icon className={cn('w-5 h-5', step.color)} />
                    </div>
                    {index < 3 && (
                      <div className="absolute top-10 left-1/2 w-px h-4 bg-border" />
                    )}
                  </div>
                  <p className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {step.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 右侧：模拟界面 */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 rounded-2xl blur-2xl" />

            <div className="relative bg-black/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
              {/* 窗口标题栏 */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-sm text-gray-400">
                  FPVTune Analysis
                </span>
              </div>

              {/* 模拟内容 */}
              <div className="p-6 space-y-4">
                {/* PID 图表模拟 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Roll P</span>
                    <span className="text-cyan-400 font-mono">45 → 52</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: '75%' } : {}}
                      transition={{ delay: 0.5, duration: 1 }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Roll I</span>
                    <span className="text-blue-400 font-mono">80 → 85</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: '85%' } : {}}
                      transition={{ delay: 0.6, duration: 1 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Roll D</span>
                    <span className="text-fuchsia-400 font-mono">35 → 42</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: '60%' } : {}}
                      transition={{ delay: 0.7, duration: 1 }}
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-fuchsia-400 rounded-full"
                    />
                  </div>
                </div>

                {/* 优化建议 */}
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-400">
                    Optimization complete. Expected improvement: 23% smoother
                    response
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function FeaturesFPV() {
  const t = useTranslations('HomePage.features');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const features = [
    {
      icon: Brain,
      title: 'AI PID Tuning',
      description:
        'Advanced machine learning algorithms analyze your flight data and generate optimized PID values for your specific quad and flying style.',
      gradient: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20',
    },
    {
      icon: FileText,
      title: 'Blackbox Analysis',
      description:
        'Upload your Blackbox logs and get detailed insights into oscillations, noise, and motor performance with actionable recommendations.',
      gradient: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20',
    },
    {
      icon: Settings2,
      title: 'Filter Optimization',
      description:
        'Automatically calculate optimal filter settings based on your motor noise profile to maximize performance while minimizing propwash.',
      gradient: 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20',
    },
    {
      icon: Gauge,
      title: 'Rate Profiles',
      description:
        'Generate custom rate profiles for freestyle, racing, or cinematic flying. Fine-tune expo and super rates for your preferred feel.',
      gradient: 'bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20',
    },
    {
      icon: LineChart,
      title: 'Performance Metrics',
      description:
        'Track your tuning progress over time with detailed analytics. Compare before and after results to see real improvements.',
      gradient: 'bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20',
    },
    {
      icon: BarChart3,
      title: 'Community Presets',
      description:
        'Access a library of community-tested presets for popular frames and setups. Share your own optimized configurations.',
      gradient: 'bg-gradient-to-r from-pink-500/20 to-rose-500/20',
    },
  ];

  return (
    <section id="features" className="relative py-24 lg:py-32 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 50%, rgba(217, 70, 239, 0.1) 0%, transparent 50%)`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* 标题区域 */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need for
            <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">
              {' '}
              Perfect Tuning
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Professional-grade tools powered by AI to help you achieve the
            smoothest, most responsive flight characteristics.
          </p>
        </motion.div>

        {/* 功能卡片网格 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} delay={0.1 + index * 0.1} />
          ))}
        </div>

        {/* 核心功能展示 */}
        <CoreFeatureShowcase />
      </div>
    </section>
  );
}

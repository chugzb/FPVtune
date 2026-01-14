'use client';

import { cn } from '@/lib/utils';
import { Download, Heart } from 'lucide-react';
import type { Preset } from './types';

interface PresetCardProps {
  preset: Preset;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat('en-US').format(num);
}

export function PresetCard({ preset }: PresetCardProps) {
  return (
    <a
      href={`/presets/${preset.id}`}
      className={cn(
        'group block rounded-[14px] border border-gray-200/40 bg-white/50 p-6',
        'transition-all duration-200 ease-in-out',
        'hover:border-gray-300 hover:bg-white hover:shadow-sm'
      )}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-mono text-[15px] font-semibold text-gray-900">
          {preset.name}
        </h3>
        <span className="shrink-0 rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
          {preset.frameSize}
        </span>
      </div>

      {/* Description */}
      <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-500">
        {preset.description}
      </p>

      {/* Tags */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {preset.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
          >
            {tag}
          </span>
        ))}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {preset.firmware}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100">
            <span className="text-xs font-semibold text-teal-700">
              {preset.author.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-gray-500">{preset.author.name}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <div className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            <span className="text-xs">
              {formatNumber(preset.stats.downloads)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            <span className="text-xs">{formatNumber(preset.stats.likes)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

// 兼容旧组件名
export function SkillCard({ skill }: { skill: Preset }) {
  return <PresetCard preset={skill} />;
}

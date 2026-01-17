'use client';

import { Zap } from 'lucide-react';

interface QuickReferenceToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function QuickReferenceToggle({
  enabled,
  onToggle,
}: QuickReferenceToggleProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
        enabled
          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
          : 'border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
      }`}
    >
      <Zap className="w-4 h-4" />
      <span className="text-sm font-medium">快速参考</span>
    </button>
  );
}

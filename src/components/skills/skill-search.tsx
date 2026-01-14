'use client';

import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

interface SkillSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SkillSearch({
  value,
  onChange,
  placeholder = 'Search skills...',
}: SkillSearchProps) {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div
        className={cn(
          'flex items-center rounded-[10px] border border-gray-200 bg-white shadow-sm',
          'transition-all duration-200',
          'focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500'
        )}
      >
        <Search className="ml-4 h-5 w-5 shrink-0 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'h-[52px] w-full bg-transparent px-3 text-[15px] text-gray-900',
            'placeholder:text-gray-400',
            'focus:outline-none'
          )}
        />
      </div>
    </div>
  );
}

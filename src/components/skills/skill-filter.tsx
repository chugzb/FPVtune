'use client';

import { cn } from '@/lib/utils';
import type { SkillCategory } from './types';
import { categoryConfig } from './types';

interface SkillFilterProps {
  selected: SkillCategory | 'all';
  onChange: (category: SkillCategory | 'all') => void;
}

const categories: (SkillCategory | 'all')[] = [
  'all',
  'document',
  'design',
  'development',
  'automation',
  'data',
  'communication',
  'testing',
  'ai',
];

export function SkillFilter({ selected, onChange }: SkillFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isSelected = selected === category;
        const label =
          category === 'all' ? 'All' : categoryConfig[category].label;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium',
              'transition-all duration-200 ease-in-out',
              isSelected
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-background text-foreground hover:border-foreground/50'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

'use client';

interface TutorialStepProps {
  number: number;
  title: string;
  children: React.ReactNode;
  isQuickOnly?: boolean;
}

export function TutorialStep({
  number,
  title,
  children,
  isQuickOnly = false,
}: TutorialStepProps) {
  return (
    <div
      className="mb-8 pb-8 border-b border-white/10 last:border-0"
      data-quick-only={isQuickOnly}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold flex-shrink-0">
          {number}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-3">{title}</h3>
          <div className="prose prose-invert max-w-none text-gray-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

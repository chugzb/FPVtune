'use client';

import { Send, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface FeedbackWidgetProps {
  tutorialId: string;
}

export function FeedbackWidget({ tutorialId }: FeedbackWidgetProps) {
  const t = useTranslations('Guides' as any) as any;
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [rating, setRating] = useState<'helpful' | 'not-helpful' | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 检查是否已提交反馈
  useEffect(() => {
    const key = `feedback-${tutorialId}`;
    const submitted = sessionStorage.getItem(key);
    if (submitted) setHasSubmitted(true);
  }, [tutorialId]);

  const handleSubmit = async () => {
    if (!rating) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorialId,
          rating,
          comment: rating === 'not-helpful' ? comment : undefined,
        }),
      });

      sessionStorage.setItem(`feedback-${tutorialId}`, 'true');
      setHasSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
        <p className="text-green-400">{t('feedback.thankYou')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="font-semibold text-white mb-4">{t('feedback.title')}</h3>

      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => setRating('helpful')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
            rating === 'helpful'
              ? 'border-green-500 bg-green-500/10 text-green-400'
              : 'border-white/10 hover:border-white/20 text-gray-400'
          }`}
        >
          <ThumbsUp className="w-5 h-5" />
          {t('feedback.helpful')}
        </button>
        <button
          type="button"
          onClick={() => setRating('not-helpful')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
            rating === 'not-helpful'
              ? 'border-red-500 bg-red-500/10 text-red-400'
              : 'border-white/10 hover:border-white/20 text-gray-400'
          }`}
        >
          <ThumbsDown className="w-5 h-5" />
          {t('feedback.notHelpful')}
        </button>
      </div>

      {rating === 'not-helpful' && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('feedback.commentPlaceholder')}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none mb-4"
        />
      )}

      {rating && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? t('feedback.submitting') : t('feedback.submit')}
        </button>
      )}
    </div>
  );
}

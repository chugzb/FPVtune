import { db } from '@/db';
import { tutorialFeedback } from '@/db/schema';

export interface Feedback {
  id?: string;
  tutorialId: string;
  rating: 'helpful' | 'not-helpful';
  comment?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface FeedbackStats {
  tutorialId: string;
  totalFeedback: number;
  helpfulCount: number;
  notHelpfulCount: number;
  helpfulPercentage: number;
  recentComments: Array<{
    comment: string;
    timestamp: Date;
  }>;
}

/**
 * 保存用户反馈到数据库
 */
export async function saveFeedback(
  feedback: Feedback
): Promise<{ success: boolean; id?: string }> {
  try {
    const result = await db
      .insert(tutorialFeedback)
      .values({
        tutorialId: feedback.tutorialId,
        rating: feedback.rating,
        comment: feedback.comment,
        userAgent: feedback.userAgent,
        createdAt: feedback.timestamp,
      })
      .returning({ id: tutorialFeedback.id });

    return {
      success: true,
      id: result[0]?.id,
    };
  } catch (error) {
    console.error('Failed to save feedback:', error);
    throw error;
  }
}

/**
 * 获取教程反馈统计
 */
export async function getFeedbackStats(
  tutorialId: string
): Promise<FeedbackStats> {
  try {
    // TODO: 实现统计查询
    // 这里需要根据实际数据库查询实现
    return {
      tutorialId,
      totalFeedback: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      helpfulPercentage: 0,
      recentComments: [],
    };
  } catch (error) {
    console.error('Failed to get feedback stats:', error);
    throw error;
  }
}

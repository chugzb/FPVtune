import { saveFeedback } from '@/lib/feedback-service';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tutorialId, rating, comment } = body;

    if (!tutorialId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating !== 'helpful' && rating !== 'not-helpful') {
      return NextResponse.json(
        { error: 'Invalid rating value' },
        { status: 400 }
      );
    }

    await saveFeedback({
      tutorialId,
      rating,
      comment,
      userAgent: request.headers.get('user-agent') || undefined,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

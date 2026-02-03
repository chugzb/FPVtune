import { db } from '@/db';
import { tuneOrder } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await db
      .select({
        id: tuneOrder.id,
        orderNumber: tuneOrder.orderNumber,
        status: tuneOrder.status,
        flyingStyle: tuneOrder.flyingStyle,
        frameSize: tuneOrder.frameSize,
        amount: tuneOrder.amount,
        currency: tuneOrder.currency,
        promoCodeId: tuneOrder.promoCodeId,
        resultUrl: tuneOrder.resultUrl,
        pdfUrl: tuneOrder.pdfUrl,
        createdAt: tuneOrder.createdAt,
        completedAt: tuneOrder.completedAt,
      })
      .from(tuneOrder)
      .where(eq(tuneOrder.customerEmail, session.user.email))
      .orderBy(desc(tuneOrder.createdAt))
      .limit(50);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Failed to fetch user orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

import { db } from '@/db';
import { tuneOrder } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 获取最近20个订单
    const orders = await db
      .select({
        id: tuneOrder.id,
        orderNumber: tuneOrder.orderNumber,
        customerEmail: tuneOrder.customerEmail,
        status: tuneOrder.status,
        amount: tuneOrder.amount,
        currency: tuneOrder.currency,
        flyingStyle: tuneOrder.flyingStyle,
        frameSize: tuneOrder.frameSize,
        promoCodeId: tuneOrder.promoCodeId,
        createdAt: tuneOrder.createdAt,
        completedAt: tuneOrder.completedAt,
      })
      .from(tuneOrder)
      .orderBy(desc(tuneOrder.createdAt))
      .limit(20);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

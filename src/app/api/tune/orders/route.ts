/**
 * Debug endpoint to list recent orders
 * Only available with secret key
 */

import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'fpvtune_debug_2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const orders = await db
      .select({
        id: tuneOrder.id,
        orderNumber: tuneOrder.orderNumber,
        status: tuneOrder.status,
        customerEmail: tuneOrder.customerEmail,
        createdAt: tuneOrder.createdAt,
        paidAt: tuneOrder.paidAt,
        completedAt: tuneOrder.completedAt,
      })
      .from(tuneOrder)
      .orderBy(desc(tuneOrder.createdAt))
      .limit(10);

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Orders query error:', error);
    return NextResponse.json(
      {
        error: 'Failed to query orders',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

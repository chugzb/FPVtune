/**
 * Test endpoint to manually trigger order processing
 * Only available in development mode
 * Usage: POST /api/tune/test-process?orderNumber=FPV-xxx
 */

import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { processOrder } from '@/lib/tune/process-order';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'orderNumber is required' },
        { status: 400 }
      );
    }

    console.log(`[Test] Looking for order: ${orderNumber}`);

    const [order] = await db
      .select()
      .from(tuneOrder)
      .where(eq(tuneOrder.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: `Order not found: ${orderNumber}` },
        { status: 404 }
      );
    }

    console.log(`[Test] Found order: ${order.orderNumber}, status: ${order.status}`);
    console.log(`[Test] Starting order processing...`);

    // Process the order synchronously for testing
    await processOrder(order.id);

    // Get updated order
    const [updatedOrder] = await db
      .select()
      .from(tuneOrder)
      .where(eq(tuneOrder.id, order.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Order processed successfully',
      order: {
        orderNumber: updatedOrder?.orderNumber,
        status: updatedOrder?.status,
        emailSentAt: updatedOrder?.emailSentAt,
        pdfHash: updatedOrder?.pdfHash,
      },
    });
  } catch (error) {
    console.error('[Test] Order processing failed:', error);
    return NextResponse.json(
      { 
        error: 'Order processing failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

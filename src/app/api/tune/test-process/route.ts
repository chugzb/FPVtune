/**
 * Test endpoint to manually trigger order processing
 * Only available in development mode
 * Usage: POST /api/tune/test-process?orderNumber=FPV-xxx
 * Usage: GET /api/tune/test-process?orderNumber=FPV-xxx (query only)
 */

import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { processOrder } from '@/lib/tune/process-order';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// GET: Query order status without processing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (
    process.env.NODE_ENV === 'production' &&
    secret !== 'fpvtune_debug_2026'
  ) {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    const orderNumber = searchParams.get('orderNumber');

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'orderNumber is required' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        pdfHash: order.pdfHash,
        analysisResult: order.analysisResult,
        cliCommands: order.cliCommands,
        blackboxContentLength: order.blackboxContent?.length || 0,
      },
    });
  } catch (error) {
    console.error('[Test] Query failed:', error);
    return NextResponse.json(
      {
        error: 'Query failed',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Allow with secret key in production for debugging
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (
    process.env.NODE_ENV === 'production' &&
    secret !== 'fpvtune_debug_2026'
  ) {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
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

    console.log(
      '[Test] Found order: ' + order.orderNumber + ', status: ' + order.status
    );
    console.log('[Test] Starting order processing...');

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
        pdfHash: updatedOrder?.pdfHash,
        analysisResult: updatedOrder?.analysisResult,
        cliCommands: updatedOrder?.cliCommands,
      },
    });
  } catch (error) {
    console.error('[Test] Order processing failed:', error);

    // 更详细的错误信息提取
    let errorDetails = 'Unknown error';
    let errorStack = '';

    if (error instanceof Error) {
      errorDetails = error.message;
      errorStack = error.stack || '';
    } else if (typeof error === 'string') {
      errorDetails = error;
    } else if (error && typeof error === 'object') {
      // 尝试提取常见的错误属性
      const errObj = error as Record<string, unknown>;
      if ('message' in errObj) {
        errorDetails = String(errObj.message);
      } else if ('error' in errObj) {
        errorDetails = String(errObj.error);
      } else if ('statusText' in errObj) {
        errorDetails = String(errObj.statusText);
      } else {
        // 尝试获取所有可枚举属性
        const keys = Object.keys(errObj);
        if (keys.length > 0) {
          errorDetails = `Object with keys: ${keys.join(', ')}. Values: ${keys.map((k) => `${k}=${String(errObj[k])}`).join('; ')}`;
        } else {
          try {
            errorDetails = JSON.stringify(error, null, 2);
          } catch {
            errorDetails = Object.prototype.toString.call(error);
          }
        }
      }
    }

    return NextResponse.json(
      {
        error: 'Order processing failed',
        details: errorDetails,
        stack: errorStack.slice(0, 500),
        errorType: error?.constructor?.name || typeof error,
        errorKeys: error && typeof error === 'object' ? Object.keys(error) : [],
      },
      { status: 500 }
    );
  }
}

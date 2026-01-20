import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { processOrder } from '@/lib/tune/process-order';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// 手动触发订单处理的 API（仅用于测试/调试）
export async function POST(request: NextRequest) {
  try {
    const { orderNumber, secret, force } = await request.json();

    // 简单的安全检查
    if (secret !== 'fpvtune-debug-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Missing orderNumber' },
        { status: 400 }
      );
    }

    console.log(
      `[Manual Process] Starting for order: ${orderNumber}, force: ${force}`
    );

    // 查找订单
    const [order] = await db
      .select()
      .from(tuneOrder)
      .where(eq(tuneOrder.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log(
      `[Manual Process] Found order: ${order.id}, status: ${order.status}`
    );

    // 如果 force=true，重置订单状态以便重新处理
    if (force && order.status === 'completed') {
      console.log(
        `[Manual Process] Force mode: resetting order status to paid`
      );
      await db
        .update(tuneOrder)
        .set({
          status: 'paid',
          analysisResult: null,
          cliCommands: null,
          completedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(tuneOrder.id, order.id));
    }

    // 直接调用 processOrder（同步等待完成）
    const startTime = Date.now();
    await processOrder(order.id);
    const duration = Date.now() - startTime;

    console.log(`[Manual Process] Completed in ${duration}ms`);

    // 重新获取订单状态
    const [updatedOrder] = await db
      .select()
      .from(tuneOrder)
      .where(eq(tuneOrder.id, order.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      duration,
      order: {
        orderNumber: updatedOrder?.orderNumber,
        status: updatedOrder?.status,
        hasAnalysis: !!updatedOrder?.analysisResult,
        emailSentAt: updatedOrder?.emailSentAt,
        completedAt: updatedOrder?.completedAt,
      },
    });
  } catch (error) {
    console.error('[Manual Process] Error:', error);
    return NextResponse.json(
      {
        error: 'Processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

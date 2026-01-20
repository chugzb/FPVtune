import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      );
    }

    const [order] = await db
      .select({
        orderNumber: tuneOrder.orderNumber,
        status: tuneOrder.status,
        customerEmail: tuneOrder.customerEmail,
        problems: tuneOrder.problems,
        goals: tuneOrder.goals,
        flyingStyle: tuneOrder.flyingStyle,
        frameSize: tuneOrder.frameSize,
        additionalNotes: tuneOrder.additionalNotes,
        analysisResult: tuneOrder.analysisResult,
        cliCommands: tuneOrder.cliCommands,
        locale: tuneOrder.locale,
        createdAt: tuneOrder.createdAt,
        completedAt: tuneOrder.completedAt,
      })
      .from(tuneOrder)
      .where(eq(tuneOrder.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        email: order.customerEmail,
        problems: order.problems,
        goals: order.goals,
        flyingStyle: order.flyingStyle,
        frameSize: order.frameSize,
        additionalNotes: order.additionalNotes,
        analysis: order.analysisResult,
        cliCommands: order.cliCommands,
        locale: order.locale,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
      },
    });
  } catch (error) {
    console.error('Order query error:', error);
    return NextResponse.json(
      { error: 'Failed to query order' },
      { status: 500 }
    );
  }
}

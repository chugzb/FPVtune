import { db } from '@/db';
import { tuneOrder, promoCode } from '@/db/schema';
import { sql, eq, gte, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 获取今天的开始时间
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 总订单数
    const totalOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tuneOrder);
    const totalOrders = Number(totalOrdersResult[0]?.count || 0);

    // 今日订单数
    const todayOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tuneOrder)
      .where(gte(tuneOrder.createdAt, today));
    const todayOrders = Number(todayOrdersResult[0]?.count || 0);

    // 已完成订单数
    const completedOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tuneOrder)
      .where(eq(tuneOrder.status, 'completed'));
    const completedOrders = Number(completedOrdersResult[0]?.count || 0);

    // 总收入 (已支付的订单)
    const revenueResult = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(tuneOrder)
      .where(
        and(
          eq(tuneOrder.status, 'completed'),
          sql`${tuneOrder.promoCodeId} IS NULL`
        )
      );
    const totalRevenue = Number(revenueResult[0]?.total || 0) / 100; // 转换为美元

    // 测试码使用订单数
    const promoOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tuneOrder)
      .where(sql`${tuneOrder.promoCodeId} IS NOT NULL`);
    const promoOrders = Number(promoOrdersResult[0]?.count || 0);

    // 活跃测试码数
    const activePromoResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(promoCode)
      .where(eq(promoCode.isActive, true));
    const activePromoCodes = Number(activePromoResult[0]?.count || 0);

    // 完成率
    const completionRate = totalOrders > 0
      ? Math.round((completedOrders / totalOrders) * 100)
      : 0;

    return NextResponse.json({
      totalOrders,
      todayOrders,
      completedOrders,
      totalRevenue,
      promoOrders,
      activePromoCodes,
      completionRate,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

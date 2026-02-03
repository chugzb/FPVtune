import db from '@/db';
import { promoCode } from '@/db/schema';
import { eq, and, gte, or, isNull } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Code is required' },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // 查找测试码
    const [promo] = await db
      .select()
      .from(promoCode)
      .where(
        and(
          eq(promoCode.code, normalizedCode),
          eq(promoCode.isActive, true)
        )
      )
      .limit(1);

    if (!promo) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid promo code',
      });
    }

    // 检查有效期
    const now = new Date();
    if (promo.validFrom && promo.validFrom > now) {
      return NextResponse.json({
        valid: false,
        error: 'Promo code is not yet active',
      });
    }

    if (promo.validUntil && promo.validUntil < now) {
      return NextResponse.json({
        valid: false,
        error: 'Promo code has expired',
      });
    }

    // 检查使用次数
    if (promo.type === 'single' && promo.usedCount >= 1) {
      return NextResponse.json({
        valid: false,
        error: 'Promo code has already been used',
      });
    }

    if (promo.type === 'limited' && promo.maxUses && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({
        valid: false,
        error: 'Promo code usage limit reached',
      });
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      type: promo.type,
      remainingUses: promo.type === 'unlimited'
        ? null
        : (promo.maxUses || 1) - promo.usedCount,
    });
  } catch (error) {
    console.error('Promo validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}

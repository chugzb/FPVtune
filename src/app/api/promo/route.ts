import db from '@/db';
import { promoCode, promoCodeUsage } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

// 验证管理员权限（支持 session 或 API key）
async function isAdmin(request: NextRequest): Promise<boolean> {
  // 方式1: 通过 session 验证 admin 角色
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session?.user?.role === 'admin') {
      return true;
    }
  } catch (e) {
    // session 验证失败，继续尝试 API key
  }

  // 方式2: 通过 API key 验证
  const adminKey = request.headers.get('x-admin-key');
  const expectedKey = process.env.ADMIN_API_KEY;
  return !!expectedKey && adminKey === expectedKey;
}

// 生成随机测试码
function generateCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除容易混淆的字符
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET: 列出所有测试码
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const codes = await db
      .select()
      .from(promoCode)
      .orderBy(desc(promoCode.createdAt));

    return NextResponse.json({ codes });
  } catch (error) {
    console.error('List promo codes error:', error);
    return NextResponse.json(
      { error: 'Failed to list promo codes' },
      { status: 500 }
    );
  }
}

// POST: 创建新测试码
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      code: customCode,
      type = 'single',
      maxUses = 1,
      validDays,
      note,
    } = body;

    // 使用自定义码或生成随机码
    const code = customCode?.trim().toUpperCase() || generateCode();

    // 检查码是否已存在
    const [existing] = await db
      .select()
      .from(promoCode)
      .where(eq(promoCode.code, code))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'Code already exists' },
        { status: 400 }
      );
    }

    // 计算有效期
    let validUntil: Date | null = null;
    if (validDays && validDays > 0) {
      validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);
    }

    const [newCode] = await db
      .insert(promoCode)
      .values({
        code,
        type,
        maxUses: type === 'unlimited' ? null : maxUses,
        validUntil,
        note,
      })
      .returning();

    return NextResponse.json({
      success: true,
      code: newCode,
    });
  } catch (error) {
    console.error('Create promo code error:', error);
    return NextResponse.json(
      { error: 'Failed to create promo code' },
      { status: 500 }
    );
  }
}

// DELETE: 删除/禁用测试码
export async function DELETE(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get('id');

    if (!codeId) {
      return NextResponse.json(
        { error: 'Code ID is required' },
        { status: 400 }
      );
    }

    // 软删除：设置为不活跃
    await db
      .update(promoCode)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(promoCode.id, codeId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete promo code error:', error);
    return NextResponse.json(
      { error: 'Failed to delete promo code' },
      { status: 500 }
    );
  }
}

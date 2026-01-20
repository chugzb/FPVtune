import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// 辅助函数：ArrayBuffer 转 Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TEST-${dateStr}-${random}`;
}

// 测试数据库写入 API
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const blackboxFile = formData.get('blackbox') as File | null;

    if (!blackboxFile) {
      return NextResponse.json(
        { error: 'No blackbox file provided' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await blackboxFile.arrayBuffer();
    const base64Content = arrayBufferToBase64(arrayBuffer);

    const orderNumber = generateOrderNumber();
    const orderId = crypto.randomUUID();

    console.log(`[Test DB Write] File size: ${blackboxFile.size}`);
    console.log(`[Test DB Write] Base64 length: ${base64Content.length}`);
    console.log(`[Test DB Write] Order: ${orderNumber}`);

    // 写入数据库
    const [order] = await db
      .insert(tuneOrder)
      .values({
        id: orderId,
        orderNumber,
        customerEmail: 'test@test.com',
        locale: 'en',
        blackboxFilename: blackboxFile.name,
        blackboxFileSize: blackboxFile.size,
        blackboxContent: base64Content,
        status: 'pending',
        amount: 0,
        currency: 'USD',
      })
      .returning();

    // 立即读取回来验证
    const [readBack] = await db
      .select()
      .from(tuneOrder)
      .where(eq(tuneOrder.id, orderId))
      .limit(1);

    const readBackLength = readBack?.blackboxContent?.length || 0;

    // 删除测试订单
    await db.delete(tuneOrder).where(eq(tuneOrder.id, orderId));

    return NextResponse.json({
      success: true,
      debug: {
        orderNumber,
        originalFileSize: blackboxFile.size,
        base64LengthBeforeWrite: base64Content.length,
        base64LengthAfterRead: readBackLength,
        dataLoss: base64Content.length - readBackLength,
        dataLossPercent: (
          ((base64Content.length - readBackLength) / base64Content.length) *
          100
        ).toFixed(2),
        isDataIntact: base64Content.length === readBackLength,
      },
    });
  } catch (error) {
    console.error('[Test DB Write] Error:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

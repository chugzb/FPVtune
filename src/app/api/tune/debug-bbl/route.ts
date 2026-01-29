import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { extractBBLHeader, isBBLFormat } from '@/lib/tune/bbl-parser';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// 调试 BBL 解析的 API
export async function POST(request: NextRequest) {
  try {
    const { orderNumber, secret } = await request.json();

    if (secret !== 'fpvtune-debug-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Missing orderNumber' },
        { status: 400 }
      );
    }

    // 查找订单
    const [order] = await db
      .select()
      .from(tuneOrder)
      .where(eq(tuneOrder.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.blackboxContent) {
      return NextResponse.json(
        { error: 'No blackbox content in order' },
        { status: 400 }
      );
    }

    // 解码 Base64 数据
    const rawBuffer = Buffer.from(order.blackboxContent, 'base64');

    // 检查前 100 字节
    const firstBytesUtf8 = rawBuffer.slice(0, 100).toString('utf-8');
    const firstBytesHex = rawBuffer.slice(0, 100).toString('hex');

    // 检测是否为 BBL 格式
    const isBBL = isBBLFormat(rawBuffer);

    // 提取头部
    const header = extractBBLHeader(rawBuffer);

    return NextResponse.json({
      success: true,
      debug: {
        base64Length: order.blackboxContent.length,
        decodedBufferSize: rawBuffer.length,
        firstBytesUtf8: firstBytesUtf8,
        firstBytesHex: firstBytesHex.slice(0, 200),
        isBBLFormat: isBBL,
        headerLength: header.length,
        headerLines: header.split('\n').length,
        headerPreview: header.slice(0, 1000),
      },
    });
  } catch (error) {
    console.error('[Debug BBL] Error:', error);
    return NextResponse.json(
      {
        error: 'Debug failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

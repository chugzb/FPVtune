import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { processOrder } from '@/lib/tune/process-order';
import { uploadFile } from '@/storage';
import { type NextRequest, NextResponse } from 'next/server';

// 有效的测试码
const VALID_TEST_CODES = ['JB_VIP_TEST', 'FPVTUNE_BETA', 'DEV_TEST_2024'];

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TEST-${dateStr}-${random}`;
}

function generateId(): string {
  return crypto.randomUUID();
}

// ArrayBuffer 转 Buffer（兼容 Cloudflare Workers）
function arrayBufferToBuffer(ab: ArrayBuffer): Buffer {
  return Buffer.from(new Uint8Array(ab));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const email = formData.get('email') as string;
    const testCode = formData.get('testCode') as string;
    const blackboxFile = formData.get('blackbox') as File | null;
    const cliDumpFile = formData.get('cliDump') as File | null;
    const problems = formData.get('problems') as string;
    const goals = formData.get('goals') as string;
    const flyingStyle = formData.get('flyingStyle') as string;
    const frameSize = formData.get('frameSize') as string;
    const additionalNotes = formData.get('additionalNotes') as string;
    const locale = (formData.get('locale') as string) || 'en';

    // 验证测试码
    if (!testCode || !VALID_TEST_CODES.includes(testCode.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid test code' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!blackboxFile) {
      return NextResponse.json(
        { error: 'Blackbox file is required' },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();

    // 读取文件内容
    const blackboxArrayBuffer = await blackboxFile.arrayBuffer();
    const blackboxBuffer = arrayBufferToBuffer(blackboxArrayBuffer);
    console.log(
      `[${orderNumber}] Blackbox file size: ${blackboxBuffer.length} bytes`
    );

    // CLI dump 是纯文本文件
    let cliDumpContent = '';
    let cliDumpBuffer: Buffer | null = null;
    if (cliDumpFile) {
      const cliDumpArrayBuffer = await cliDumpFile.arrayBuffer();
      cliDumpBuffer = arrayBufferToBuffer(cliDumpArrayBuffer);
      cliDumpContent = cliDumpBuffer.toString('utf-8');
      console.log(
        `[${orderNumber}] CLI dump content length: ${cliDumpContent.length}`
      );
    }

    // 上传 BBL 文件到 R2（必须成功）
    let blackboxUrl = '';
    try {
      const blackboxResult = await uploadFile(
        blackboxBuffer,
        `${orderNumber}-blackbox-${blackboxFile.name}`,
        blackboxFile.type || 'application/octet-stream',
        'tune/blackbox'
      );
      blackboxUrl = blackboxResult.url;
      console.log(`[${orderNumber}] Blackbox uploaded to R2: ${blackboxUrl}`);
    } catch (uploadError) {
      console.error(`[${orderNumber}] R2 upload failed:`, uploadError);
      return NextResponse.json(
        {
          error: 'Failed to upload blackbox file',
          details:
            uploadError instanceof Error
              ? uploadError.message
              : 'Storage error',
        },
        { status: 500 }
      );
    }

    // 上传 CLI dump 文件（可选）
    let cliDumpUrl = '';
    if (cliDumpBuffer) {
      try {
        const cliDumpResult = await uploadFile(
          cliDumpBuffer,
          `${orderNumber}-clidump-${cliDumpFile?.name || 'cli.txt'}`,
          'text/plain',
          'tune/clidump'
        );
        cliDumpUrl = cliDumpResult.url;
        console.log(`[${orderNumber}] CLI dump uploaded to R2: ${cliDumpUrl}`);
      } catch (uploadError) {
        console.warn(
          `[${orderNumber}] CLI dump R2 upload failed (non-blocking):`,
          uploadError
        );
      }
    }

    // 创建测试订单（直接标记为已支付）
    const orderId = generateId();
    const [order] = await db
      .insert(tuneOrder)
      .values({
        id: orderId,
        orderNumber,
        customerEmail: email,
        locale,
        blackboxFilename: blackboxFile.name,
        blackboxFileSize: blackboxFile.size,
        blackboxUrl, // R2 URL（必须有）
        blackboxContent: null, // 不再存数据库
        cliDumpUrl,
        cliDumpContent, // CLI dump 较小，可以存数据库
        problems,
        goals,
        flyingStyle,
        frameSize,
        additionalNotes,
        amount: 0, // 测试订单金额为 0
        currency: 'USD',
        status: 'paid', // 直接标记为已支付
        paidAt: new Date(),
      })
      .returning();

    console.log(
      `[${orderNumber}] Test order created: ${orderId}, blackboxUrl: ${blackboxUrl}`
    );

    // 同步处理订单（生成 PDF、发送邮件）
    try {
      await processOrder(orderId);
      console.log(`[${orderNumber}] Order processed successfully`);
    } catch (processError) {
      console.error(`[${orderNumber}] Failed to process order:`, processError);
      // 处理失败不影响订单创建，前端会轮询状态
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      message: 'Test order created and processed',
    });
  } catch (error) {
    console.error('[Test Order] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create test order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

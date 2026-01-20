import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { CREEM_PRODUCT_ID, creem } from '@/lib/creem';
import { uploadFile } from '@/storage';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FPV-${dateStr}-${random}`;
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
    const blackboxFile = formData.get('blackbox') as File | null;
    const cliDumpFile = formData.get('cliDump') as File | null;
    const problems = formData.get('problems') as string;
    const goals = formData.get('goals') as string;
    const flyingStyle = formData.get('flyingStyle') as string;
    const frameSize = formData.get('frameSize') as string;
    const additionalNotes = formData.get('additionalNotes') as string;
    const locale = (formData.get('locale') as string) || 'en';

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
        // CLI dump 上传失败不阻止流程，内容已保存到 cliDumpContent
      }
    }

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
        blackboxContent: null, // 不再存数据库，从 R2 读取
        cliDumpUrl,
        cliDumpContent, // CLI dump 较小，可以存数据库
        problems,
        goals,
        flyingStyle,
        frameSize,
        additionalNotes,
        amount: 999,
        currency: 'USD',
        status: 'pending',
      })
      .returning();

    console.log(
      `[${orderNumber}] Order created: ${orderId}, blackboxUrl: ${blackboxUrl}`
    );

    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://fpvtune.com';

    const checkout = await creem.checkouts.create({
      productId: CREEM_PRODUCT_ID,
      successUrl: `${baseUrl}/tune/success?order=${orderNumber}`,
      customer: {
        email,
      },
      metadata: {
        orderId: order.id,
        orderNumber,
        locale,
      },
    });

    await db
      .update(tuneOrder)
      .set({
        creemCheckoutId: checkout.id,
        updatedAt: new Date(),
      })
      .where(eq(tuneOrder.id, order.id));

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.checkoutUrl,
      orderNumber,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

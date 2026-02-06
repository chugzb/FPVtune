import db from '@/db';
import { tuneOrder, promoCode, promoCodeUsage } from '@/db/schema';
import { CREEM_PRODUCT_ID, creem } from '@/lib/creem';
import { isBBLFormat } from '@/lib/tune/bbl-parser';
import { uploadFile } from '@/storage';
import { eq, and } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// 最小文件大小要求（BBL 文件通常至少几百KB）
const MIN_BBL_FILE_SIZE = 50 * 1024; // 50KB

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

    const email = (formData.get('email') as string) || '';
    const blackboxFile = formData.get('blackbox') as File | null;
    const cliDumpFile = formData.get('cliDump') as File | null;
    const problems = formData.get('problems') as string;
    const goals = formData.get('goals') as string;
    const flyingStyle = formData.get('flyingStyle') as string;
    const frameSize = formData.get('frameSize') as string;
    const motorSize = formData.get('motorSize') as string;
    const motorKv = formData.get('motorKv') as string;
    const battery = formData.get('battery') as string;
    const propeller = formData.get('propeller') as string;
    const motorTemp = formData.get('motorTemp') as string;
    const weight = formData.get('weight') as string;
    const additionalNotes = formData.get('additionalNotes') as string;
    const locale = (formData.get('locale') as string) || 'en';
    const promoCodeInput = formData.get('promoCode') as string | null;

    if (!blackboxFile) {
      return NextResponse.json(
        { error: 'Blackbox file is required' },
        { status: 400 }
      );
    }

    if (!cliDumpFile) {
      return NextResponse.json(
        { error: 'CLI Dump file is required' },
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

    // 基本验证：检查文件格式和大小
    if (!isBBLFormat(blackboxBuffer)) {
      const isZh = locale === 'zh';
      return NextResponse.json(
        {
          error: isZh ? '无效的黑盒文件' : 'Invalid blackbox file',
          details: isZh
            ? '文件不是有效的 Betaflight 黑盒日志格式'
            : 'File is not a valid Betaflight blackbox log format',
          code: 'INVALID_BBL_FORMAT',
        },
        { status: 400 }
      );
    }

    if (blackboxBuffer.length < MIN_BBL_FILE_SIZE) {
      const isZh = locale === 'zh';
      return NextResponse.json(
        {
          error: isZh ? '黑盒文件太小' : 'Blackbox file too small',
          details: isZh
            ? `文件大小 ${Math.round(blackboxBuffer.length / 1024)}KB，需要至少 ${MIN_BBL_FILE_SIZE / 1024}KB 的飞行数据`
            : `File size ${Math.round(blackboxBuffer.length / 1024)}KB, need at least ${MIN_BBL_FILE_SIZE / 1024}KB of flight data`,
          code: 'FILE_TOO_SMALL',
        },
        { status: 400 }
      );
    }

    console.log(`[${orderNumber}] BBL file validation passed`);

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
        motorSize,
        motorKv,
        battery,
        propeller,
        motorTemp,
        weight,
        additionalNotes,
        amount: 999,
        currency: 'USD',
        status: 'pending',
      })
      .returning();

    console.log(
      `[${orderNumber}] Order created: ${orderId}, blackboxUrl: ${blackboxUrl}`
    );

    // 检查是否使用测试码
    if (promoCodeInput) {
      const normalizedCode = promoCodeInput.trim().toUpperCase();
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

      if (promo) {
        const now = new Date();
        const isValid =
          (!promo.validFrom || promo.validFrom <= now) &&
          (!promo.validUntil || promo.validUntil >= now) &&
          (promo.type === 'unlimited' || promo.usedCount < (promo.maxUses || 1));

        if (isValid) {
          // 更新测试码使用次数
          await db
            .update(promoCode)
            .set({
              usedCount: promo.usedCount + 1,
              updatedAt: new Date(),
            })
            .where(eq(promoCode.id, promo.id));

          // 记录使用历史
          await db.insert(promoCodeUsage).values({
            promoCodeId: promo.id,
            orderId: order.id,
            customerEmail: email,
          });

          // 更新订单状态为已支付（跳过支付）
          await db
            .update(tuneOrder)
            .set({
              status: 'paid',
              promoCodeId: promo.id,
              amount: 0,
              paidAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(tuneOrder.id, order.id));

          console.log(`[${orderNumber}] Promo code ${normalizedCode} applied, skipping payment`);

          const baseUrl =
            process.env.APP_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            'https://fpvtune.com';

          return NextResponse.json({
            success: true,
            promoApplied: true,
            orderNumber,
            redirectUrl: `${baseUrl}/${locale}/tune?order=${orderNumber}`,
          });
        }
      }
    }

    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://fpvtune.com';

    const checkoutParams: any = {
      productId: CREEM_PRODUCT_ID,
      successUrl: `${baseUrl}/${locale}/tune?order=${orderNumber}`,
      metadata: {
        orderId: order.id,
        orderNumber,
        locale,
      },
    };
    if (email) {
      checkoutParams.customer = { email };
    }

    const checkout = await creem.checkouts.create(checkoutParams);

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

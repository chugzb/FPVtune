import db from '@/db';
import { tuneOrder, promoCode, promoCodeUsage } from '@/db/schema';
import { isBBLFormat } from '@/lib/tune/bbl-parser';
import { processOrder } from '@/lib/tune/process-order';
import { uploadFile } from '@/storage';
import { eq, and } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// 最小文件大小要求
const MIN_BBL_FILE_SIZE = 50 * 1024; // 50KB

// 硬编码的测试码（向后兼容）
const LEGACY_TEST_CODES = ['JB_VIP_TEST', 'FPVTUNE_BETA', 'DEV_TEST_2024'];

// 验证测试码（支持数据库和硬编码）
async function validatePromoCode(code: string): Promise<{ valid: boolean; promoId?: string }> {
  const normalizedCode = code.trim().toUpperCase();

  // 先检查硬编码的测试码
  if (LEGACY_TEST_CODES.includes(normalizedCode)) {
    return { valid: true };
  }

  // 再检查数据库中的测试码
  try {
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
      return { valid: false };
    }

    const now = new Date();

    // 检查有效期
    if (promo.validFrom && promo.validFrom > now) {
      return { valid: false };
    }
    if (promo.validUntil && promo.validUntil < now) {
      return { valid: false };
    }

    // 检查使用次数
    if (promo.type === 'single' && promo.usedCount >= 1) {
      return { valid: false };
    }
    if (promo.type === 'limited' && promo.maxUses && promo.usedCount >= promo.maxUses) {
      return { valid: false };
    }

    return { valid: true, promoId: promo.id };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return { valid: false };
  }
}

// 记录测试码使用
async function recordPromoUsage(promoId: string, orderId: string, email: string) {
  try {
    // 更新使用次数
    const [promo] = await db
      .select()
      .from(promoCode)
      .where(eq(promoCode.id, promoId))
      .limit(1);

    if (promo) {
      await db
        .update(promoCode)
        .set({
          usedCount: promo.usedCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(promoCode.id, promoId));
    }

    // 记录使用历史
    await db.insert(promoCodeUsage).values({
      promoCodeId: promoId,
      orderId,
      customerEmail: email,
    });
  } catch (error) {
    console.error('Error recording promo usage:', error);
  }
}

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
    const motorSize = formData.get('motorSize') as string;
    const motorKv = formData.get('motorKv') as string;
    const battery = formData.get('battery') as string;
    const propeller = formData.get('propeller') as string;
    const motorTemp = formData.get('motorTemp') as string;
    const weight = formData.get('weight') as string;
    const additionalNotes = formData.get('additionalNotes') as string;
    const locale = (formData.get('locale') as string) || 'en';

    // 验证测试码
    if (!testCode) {
      return NextResponse.json({ error: 'Test code is required' }, { status: 400 });
    }

    const promoValidation = await validatePromoCode(testCode);
    if (!promoValidation.valid) {
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
        motorSize,
        motorKv,
        battery,
        propeller,
        motorTemp,
        weight,
        additionalNotes,
        amount: 0, // 测试订单金额为 0
        currency: 'USD',
        status: 'paid', // 直接标记为已支付
        paidAt: new Date(),
        promoCodeId: promoValidation.promoId || null,
      })
      .returning();

    console.log(
      `[${orderNumber}] Test order created: ${orderId}, blackboxUrl: ${blackboxUrl}`
    );

    // 记录测试码使用（如果是数据库中的码）
    if (promoValidation.promoId) {
      await recordPromoUsage(promoValidation.promoId, orderId, email);
      console.log(`[${orderNumber}] Promo code usage recorded`);
    }

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

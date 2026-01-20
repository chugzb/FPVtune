import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { processOrder } from '@/lib/tune/process-order';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// 尝试导入 Cloudflare context
let cloudflareContext: {
  getCloudflareContext: () => {
    ctx?: { waitUntil: (p: Promise<unknown>) => void };
    env?: Record<string, unknown>;
  };
} | null = null;

try {
  // 在模块加载时尝试导入
  // @ts-expect-error - 这个包只在 Cloudflare 环境中可用
  cloudflareContext = require('@opennextjs/cloudflare');
  console.log('[Creem Webhook] cloudflareContext module loaded successfully');
} catch (e) {
  console.log('[Creem Webhook] cloudflareContext module not available:', e);
}

// 获取 Cloudflare Workers 的 waitUntil 函数
function getWaitUntil(): ((promise: Promise<unknown>) => void) | null {
  console.log('[Creem Webhook] getWaitUntil called');
  console.log('[Creem Webhook] cloudflareContext exists:', !!cloudflareContext);

  try {
    if (cloudflareContext) {
      const context = cloudflareContext.getCloudflareContext();
      console.log(
        '[Creem Webhook] getCloudflareContext returned:',
        JSON.stringify({
          hasCtx: !!context?.ctx,
          hasWaitUntil: !!context?.ctx?.waitUntil,
          hasEnv: !!context?.env,
          ctxKeys: context?.ctx ? Object.keys(context.ctx) : [],
        })
      );

      if (context?.ctx?.waitUntil) {
        console.log('[Creem Webhook] waitUntil function found!');
        return context.ctx.waitUntil.bind(context.ctx);
      }
      console.log('[Creem Webhook] waitUntil not found in ctx');
      return null;
    }
    console.log('[Creem Webhook] cloudflareContext is null');
    return null;
  } catch (e) {
    console.error('[Creem Webhook] Error getting waitUntil:', e);
    return null;
  }
}

async function verifySignature(
  payload: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret) {
    console.error('CREEM_WEBHOOK_SECRET is not set');
    return false;
  }

  // 使用 Web Crypto API (兼容 Cloudflare Workers)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  const computed = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === signature;
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('creem-signature') || '';

  // 添加调试日志
  console.log('[Creem Webhook] Received request');
  console.log(
    '[Creem Webhook] Signature header:',
    signature ? `${signature.substring(0, 20)}...` : 'MISSING'
  );
  console.log('[Creem Webhook] Payload length:', payload.length);
  console.log('[Creem Webhook] Payload preview:', payload.substring(0, 200));

  if (!signature) {
    console.error('[Creem Webhook] Missing signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  // 验证签名
  if (!(await verifySignature(payload, signature))) {
    console.error('[Creem Webhook] Invalid signature');
    console.error('[Creem Webhook] Expected signature for payload with secret');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(payload);
  const { eventType, object } = event;

  console.log(`Creem webhook event type: ${eventType}`);

  // 只处理 checkout.completed 事件
  if (eventType !== 'checkout.completed') {
    return NextResponse.json(
      { received: true, skipped: true },
      { status: 200 }
    );
  }

  try {
    const metadata = object.metadata || {};
    const orderId = metadata.orderId;
    const orderNumber = metadata.orderNumber;
    const customerId = object.customer?.id;

    if (!orderId && !orderNumber) {
      console.error('No orderId or orderNumber in webhook metadata');
      return NextResponse.json(
        { error: 'Missing order identifier' },
        { status: 400 }
      );
    }

    const [order] = await db
      .select()
      .from(tuneOrder)
      .where(
        orderId
          ? eq(tuneOrder.id, orderId)
          : eq(tuneOrder.orderNumber, orderNumber)
      )
      .limit(1);

    if (!order) {
      console.error(`Order not found: ${orderId || orderNumber}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 检查订单是否已经完成（防止重复处理）
    // 注意：不跳过 processing 状态，因为可能是之前的处理超时了
    if (order.status === 'completed') {
      console.log(`Order ${order.orderNumber} already completed, skipping`);
      return NextResponse.json(
        {
          received: true,
          skipped: true,
          reason: 'Order already completed',
        },
        { status: 200 }
      );
    }

    // 如果订单正在处理中，记录日志但继续处理（可能是之前的处理超时了）
    if (order.status === 'processing') {
      console.log(
        `Order ${order.orderNumber} is processing, will retry processing`
      );
    }

    // 更新订单状态为已支付
    await db
      .update(tuneOrder)
      .set({
        status: 'paid',
        creemCustomerId: customerId,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tuneOrder.id, order.id));

    console.log(`Order ${order.orderNumber} marked as paid`);

    // 异步处理订单 (AI 分析, 发送邮件)
    // 使用 waitUntil 确保后台任务完成，但不阻塞 webhook 响应
    // 这样可以避免 Creem 15秒超时问题
    const processPromise = processOrder(order.id)
      .then(() => {
        console.log(
          `[Creem Webhook] Order ${order.orderNumber} processing completed successfully`
        );
      })
      .catch((processError) => {
        // 处理失败，记录错误
        // 订单状态会被 processOrder 内部更新为 'failed'
        console.error(
          `[Creem Webhook] Order ${order.orderNumber} processing failed:`,
          processError
        );
      });

    // 在 Cloudflare Workers 环境中，使用 waitUntil 确保后台任务完成
    const waitUntil = getWaitUntil();
    console.log(`[Creem Webhook] waitUntil function obtained: ${!!waitUntil}`);

    if (waitUntil) {
      console.log(
        `[Creem Webhook] Calling waitUntil for order ${order.orderNumber}`
      );
      waitUntil(processPromise);
      console.log(
        '[Creem Webhook] waitUntil called, returning response immediately'
      );
    } else {
      console.log(
        '[Creem Webhook] waitUntil not available, will process inline (may timeout)'
      );
      // 如果 waitUntil 不可用，仍然尝试异步处理，但不等待
      // 这可能导致处理被中断，但至少 webhook 不会超时
    }

    // 立即返回成功响应，避免 Creem 超时
    console.log(
      `[Creem Webhook] Returning 200 response for order ${order.orderNumber}`
    );
    return NextResponse.json(
      { received: true, processing: true },
      { status: 200 }
    );
  } catch (err) {
    console.error('Webhook processing error:', err);
    // 返回 500 让 Creem 重试
    return NextResponse.json(
      {
        error: 'Processing failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

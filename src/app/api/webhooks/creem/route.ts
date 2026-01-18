import crypto from 'crypto';
import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { processOrder } from '@/lib/tune/process-order';

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret) {
    console.error('CREEM_WEBHOOK_SECRET is not set');
    return false;
  }

  const computed = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return computed === signature;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('creem-signature') || '';

    if (!verifySignature(payload, signature)) {
      console.error('Invalid Creem webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);
    const { eventType, object } = event;

    console.log(`Creem webhook received: ${eventType}`);

    if (eventType === 'checkout.completed') {
      const checkoutId = object.id;
      const metadata = object.metadata || {};
      const orderId = metadata.orderId;
      const orderNumber = metadata.orderNumber;
      const customerId = object.customer?.id;

      if (!orderId && !orderNumber) {
        console.error('No orderId or orderNumber in webhook metadata');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const [order] = await db
        .select()
        .from(tuneOrder)
        .where(orderId ? eq(tuneOrder.id, orderId) : eq(tuneOrder.orderNumber, orderNumber))
        .limit(1);

      if (!order) {
        console.error(`Order not found: ${orderId || orderNumber}`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      await db
        .update(tuneOrder)
        .set({
          status: 'paid',
          creemCustomerId: customerId,
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tuneOrder.id, order.id));

      console.log(`Order ${order.orderNumber} marked as paid, starting processing...`);

      processOrder(order.id).catch((err: Error) => {
        console.error(`Error processing order ${order.orderNumber}:`, err);
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Creem webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

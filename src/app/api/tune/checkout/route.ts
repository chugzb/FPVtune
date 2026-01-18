import { creem, CREEM_PRODUCT_ID } from '@/lib/creem';
import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FPV-${dateStr}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const email = formData.get('email') as string;
    const blackboxFile = formData.get('blackbox') as File | null;
    const problems = formData.get('problems') as string;
    const goals = formData.get('goals') as string;
    const flyingStyle = formData.get('flyingStyle') as string;
    const frameSize = formData.get('frameSize') as string;
    const additionalNotes = formData.get('additionalNotes') as string;
    const locale = (formData.get('locale') as string) || 'en';

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!blackboxFile) {
      return NextResponse.json(
        { error: 'Blackbox file is required' },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();

    const [order] = await db
      .insert(tuneOrder)
      .values({
        orderNumber,
        customerEmail: email,
        locale,
        blackboxFilename: blackboxFile.name,
        blackboxFileSize: blackboxFile.size,
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fpvtune.com';

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
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

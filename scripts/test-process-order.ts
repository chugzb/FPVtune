import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { processOrder } from '@/lib/tune/process-order';
import { desc } from 'drizzle-orm';

async function testProcessOrder() {
  try {
    console.log('Finding latest order...');

    // 查找最新的订单
    const [latestOrder] = await db
      .select()
      .from(tuneOrder)
      .orderBy(desc(tuneOrder.createdAt))
      .limit(1);

    if (!latestOrder) {
      console.error('No orders found in database');
      process.exit(1);
    }

    console.log(`Found order: ${latestOrder.orderNumber}`);
    console.log(`Status: ${latestOrder.status}`);
    console.log(`Email: ${latestOrder.customerEmail}`);
    console.log(`Created: ${latestOrder.createdAt}`);
    console.log('');
    console.log('Starting order processing...');
    console.log('This will:');
    console.log('1. Run AI analysis');
    console.log('2. Generate PDF report');
    console.log('3. Send email with PDF attachment');
    console.log('');

    await processOrder(latestOrder.id);

    console.log('');
    console.log('✅ Order processed successfully!');
    console.log(`Check email: ${latestOrder.customerEmail}`);
  } catch (error) {
    console.error('❌ Error processing order:', error);
    process.exit(1);
  }
}

testProcessOrder();

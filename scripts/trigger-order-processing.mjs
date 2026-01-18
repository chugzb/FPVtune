import { resolve } from 'path';
import { config } from 'dotenv';

// 加载环境变量
config({ path: resolve(process.cwd(), '.env.local') });

import { desc } from 'drizzle-orm';
import db from '../src/db/index.ts';
import { tuneOrder } from '../src/db/schema.ts';
import { processOrder } from '../src/lib/tune/process-order.ts';

async function main() {
  try {
    console.log('=== 查询最新订单 ===\n');

    // 获取最新订单
    const orders = await db
      .select()
      .from(tuneOrder)
      .orderBy(desc(tuneOrder.createdAt))
      .limit(1);

    if (orders.length === 0) {
      console.log('没有找到订单');
      return;
    }

    const order = orders[0];
    console.log('订单信息:');
    console.log(`- ID: ${order.id}`);
    console.log(`- 订单号: ${order.orderNumber}`);
    console.log(`- 邮箱: ${order.customerEmail}`);
    console.log(`- 状态: ${order.status}`);
    console.log(`- 创建时间: ${order.createdAt}`);
    console.log();

    if (order.status === 'completed') {
      console.log('订单已完成，无需处理');
      return;
    }

    console.log('=== 开始处理订单 ===\n');
    await processOrder(order.id);

    console.log('\n=== 订单处理完成 ===');
    console.log(`请检查邮箱: ${order.customerEmail}`);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

main();

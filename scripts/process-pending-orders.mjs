#!/usr/bin/env node
/**
 * 手动处理卡住的订单
 * 用于 Webhook 未触发时的备用方案
 *
 * 使用方法:
 * node scripts/process-pending-orders.mjs [orderNumber]
 *
 * 示例:
 * node scripts/process-pending-orders.mjs FPV-20260119-FPFN23
 * node scripts/process-pending-orders.mjs  # 处理所有 pending/paid 状态的订单
 */

const orderNumber = process.argv[2];

const baseUrl = 'https://fpvtune.com';

async function triggerOrderProcessing(orderNum) {
  console.log(`\n正在处理订单: ${orderNum}`);

  try {
    const response = await fetch(`${baseUrl}/api/tune/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderNumber: orderNum }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ 订单 ${orderNum} 处理成功`);
      console.log('结果:', JSON.stringify(result, null, 2));
    } else {
      console.log(`❌ 订单 ${orderNum} 处理失败`);
      console.log('错误:', JSON.stringify(result, null, 2));
    }

    return { orderNumber: orderNum, success: response.ok, result };
  } catch (error) {
    console.log(`❌ 订单 ${orderNum} 处理出错:`, error.message);
    return { orderNumber: orderNum, success: false, error: error.message };
  }
}

async function main() {
  if (orderNumber) {
    // 处理单个订单
    await triggerOrderProcessing(orderNumber);
  } else {
    // 处理所有卡住的订单
    const pendingOrders = [
      'FPV-20260119-TKG6FN', // Round 4
      'FPV-20260119-LABM8S', // Round 5
      'FPV-20260119-XJ5X5K', // Round 6
      'FPV-20260119-7L4MMD', // Round 7
      'FPV-20260119-CIQ6W1', // Round 8
      'FPV-20260119-A55IJ9', // Round 9
      'FPV-20260119-FPFN23', // Round 10
    ];

    console.log(`准备处理 ${pendingOrders.length} 个卡住的订单...\n`);

    const results = [];
    for (const order of pendingOrders) {
      const result = await triggerOrderProcessing(order);
      results.push(result);
      // 等待 2 秒避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log('\n========== 处理结果汇总 ==========');
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    console.log(`成功: ${successful}/${results.length}`);
    console.log(`失败: ${failed}/${results.length}`);

    if (failed > 0) {
      console.log('\n失败的订单:');
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(
            `  - ${r.orderNumber}: ${r.error || JSON.stringify(r.result)}`
          );
        });
    }
  }
}

main().catch(console.error);

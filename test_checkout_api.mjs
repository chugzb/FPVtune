#!/usr/bin/env node
/**
 * 直接测试 Checkout API
 * 模拟前端提交表单数据
 */

import fs from 'fs';

async function testCheckoutAPI() {
  console.log('=== 测试 Checkout API ===\n');

  // 读取测试文件
  const blackboxContent = fs.readFileSync('test-blackbox.txt', 'utf-8');
  const blackboxBlob = new Blob([blackboxContent], { type: 'text/plain' });
  const blackboxFile = new File([blackboxBlob], 'test-blackbox.txt', {
    type: 'text/plain',
  });

  // 构建 FormData
  const formData = new FormData();
  formData.append('email', 'ningainshop@gmail.com');
  formData.append('blackbox', blackboxFile);
  formData.append('problems', 'Prop Wash');
  formData.append('goals', 'Locked-in Feel');
  formData.append('flyingStyle', 'Freestyle');
  formData.append('frameSize', '5 inch');
  formData.append('additionalNotes', 'Test order from automated script');
  formData.append('locale', 'en');

  console.log('发送请求到: https://fpvtune.com/api/tune/checkout');
  console.log('邮箱: ningainshop@gmail.com\n');

  try {
    const response = await fetch('https://fpvtune.com/api/tune/checkout', {
      method: 'POST',
      body: formData,
    });

    console.log(`响应状态: ${response.status} ${response.statusText}`);

    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}\n`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Checkout API 成功!');
      console.log('响应数据:');
      console.log(JSON.stringify(data, null, 2));

      if (data.checkoutUrl) {
        console.log(`\n支付链接: ${data.checkoutUrl}`);
        console.log(`订单号: ${data.orderNumber}`);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Checkout API 失败!');
      console.log('错误响应:');
      console.log(errorText);
    }
  } catch (error) {
    console.log('❌ 请求失败!');
    console.log('错误:', error.message);
    console.log(error.stack);
  }
}

testCheckoutAPI();

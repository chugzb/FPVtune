#!/usr/bin/env node

/**
 * 测试生产环境的 checkout API
 */

async function testCheckoutAPI() {
  console.log('测试生产环境 Checkout API...\n');

  const formData = new FormData();
  formData.append('email', 'test@example.com');
  formData.append('problems', 'Prop Wash');
  formData.append('goals', 'Locked-in Feel');
  formData.append('flyingStyle', 'Freestyle');
  formData.append('frameSize', '5"');
  formData.append('locale', 'en');

  // 创建一个测试文件
  const testFile = new File(['test content'], 'test-blackbox.txt', {
    type: 'text/plain',
  });
  formData.append('blackbox', testFile);

  try {
    console.log('发送请求到: https://fpvtune.com/api/tune/checkout');
    const response = await fetch('https://fpvtune.com/api/tune/checkout', {
      method: 'POST',
      body: formData,
    });

    console.log('状态码:', response.status);
    console.log('状态文本:', response.statusText);

    const data = await response.json();
    console.log('\n响应数据:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ API 调用成功!');
      console.log('Checkout URL:', data.checkoutUrl);
    } else {
      console.log('\n❌ API 调用失败!');
      console.log('错误:', data.error);
    }
  } catch (error) {
    console.error('\n❌ 请求失败:', error.message);
  }
}

testCheckoutAPI();

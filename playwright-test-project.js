const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:5000';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  console.log('🚀 开始调研项目...\n');

  // 1. 首页测试
  console.log('📄 测试首页...');
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  const title = await page.title();
  console.log(`  标题: ${title}`);

  const h1Text = await page.locator('h1').first().textContent().catch(() => '无 H1');
  console.log(`  主标题: ${h1Text}`);

  await page.screenshot({ path: 'screenshots/homepage-desktop.png', fullPage: true });
  console.log('  📸 首页截图已保存\n');

  // 2. 检查导航链接
  console.log('🔗 检查导航链接...');
  const navLinks = await page.locator('nav a, header a').all();
  console.log(`  找到 ${navLinks.length} 个导航链接`);

  for (const link of navLinks.slice(0, 10)) {
    const href = await link.getAttribute('href');
    const text = await link.textContent();
    if (href && text) {
      console.log(`  - ${text.trim()}: ${href}`);
    }
  }

  // 3. 响应式测试
  console.log('\n📱 响应式测试...');

  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'screenshots/homepage-mobile.png', fullPage: true });
  console.log('  📸 移动端截图');

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'screenshots/homepage-tablet.png', fullPage: true });
  console.log('  📸 平板截图');

  // 4. 页面加载性能
  console.log('\n⚡ 页面加载性能...');
  await page.setViewportSize({ width: 1920, height: 1080 });
  const startTime = Date.now();
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  const loadTime = Date.now() - startTime;
  console.log(`  页面加载时间: ${loadTime}ms`);

  // 5. 检查图片
  console.log('\n🖼️ 检查图片...');
  const images = await page.locator('img').all();
  console.log(`  找到 ${images.length} 张图片`);

  console.log('\n✅ 项目调研完成！');

  await browser.close();
})();


const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:5000';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  console.log('🚀 开始调研项目...');

  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  const title = await page.title();
  console.log('标题:', title);
  
  const h1Text = await page.locator('h1').first().textContent().catch(() => '无 H1');
  console.log('主标题:', h1Text);

  const navLinks = await page.locator('nav a, header a').all();
  console.log('导航链接数:', navLinks.length);

  const images = await page.locator('img').all();
  console.log('图片数:', images.length);

  await page.screenshot({ path: '/Users/a1/A1项目/fpv/screenshots/homepage.png', fullPage: true });
  console.log('📸 截图已保存');

  console.log('✅ 调研完成');
  await browser.close();
})();

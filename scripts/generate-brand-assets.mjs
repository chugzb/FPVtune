import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = './public';

// FPVtune Logo SVG - 心电图样式 (只有图标部分，用于 favicon)
const logoIconSvg = (size, color = 'white') => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40" width="${size}" height="${size * 0.5}">
  <path d="M2 20H18L24 6L36 34L48 12L54 28L60 20H78" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

// 正方形图标 SVG (用于 favicon, app icons)
const squareIconSvg = (size, bgColor = '#030304', strokeColor = 'white') => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="${bgColor}" rx="${size * 0.15}"/>
  <g transform="translate(${size * 0.1}, ${size * 0.35}) scale(${size / 100})">
    <path d="M2 20H18L24 6L36 34L48 12L54 28L60 20H78" stroke="${strokeColor}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;

// 完整 Logo SVG (心电图 + FPVtune 文字)
const fullLogoSvg = (width, color = 'white', bgColor = 'transparent') => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 40" width="${width}" height="${(width * 40) / 240}">
  ${bgColor !== 'transparent' ? `<rect width="240" height="40" fill="${bgColor}"/>` : ''}
  <path d="M2 20H18L24 6L36 34L48 12L54 28L60 20H78" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M92 8H108V12H96V18H106V22H96V32H92V8Z" fill="${color}"/>
  <path d="M112 8H124C126.2 8 128 9.8 128 12V18C128 20.2 126.2 22 124 22H116V32H112V8ZM116 12V18H124V12H116Z" fill="${color}"/>
  <path d="M132 8H136L142 26L148 8H152L144 32H140L132 8Z" fill="${color}"/>
  <path d="M164 12V8H160V12H156V16H160V26C160 27.1 160.9 28 162 28H166V32H162C158.7 32 156 29.3 156 26V16H152V12H156V8H164Z" fill="${color}"/>
  <path d="M172 12V32H168V12H172ZM184 32H180V12H184V19C184 19 186 12 192 12V16C188 16 184 19 184 24V32Z" fill="${color}"/>
  <path d="M200 12V32H196V12H200ZM200 12V16C200 16 204 12 210 12C216 12 218 16 218 20V32H214V20C214 18 212 16 208 16C204 16 200 19 200 24V32H196V12H200Z" fill="${color}"/>
  <path d="M224 22H238C238 17 234 12 229 12C224 12 220 17 220 22C220 27 224 32 229 32C233 32 236 30 237 27L234 25C233 27 231 28 229 28C226 28 224 26 224 22ZM229 16C232 16 234 18 234 22H224C224 18 226 16 229 16Z" fill="${color}"/>
</svg>`;

// OG Image SVG (1200x630)
const ogImageSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#030304"/>
      <stop offset="100%" style="stop-color:#0a0a0f"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0"/>
      <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="280" width="1200" height="70" fill="url(#glow)"/>
  <g transform="translate(300, 200) scale(2.5)">
    <path d="M2 20H18L24 6L36 34L48 12L54 28L60 20H78" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M92 8H108V12H96V18H106V22H96V32H92V8Z" fill="white"/>
    <path d="M112 8H124C126.2 8 128 9.8 128 12V18C128 20.2 126.2 22 124 22H116V32H112V8ZM116 12V18H124V12H116Z" fill="white"/>
    <path d="M132 8H136L142 26L148 8H152L144 32H140L132 8Z" fill="white"/>
    <path d="M164 12V8H160V12H156V16H160V26C160 27.1 160.9 28 162 28H166V32H162C158.7 32 156 29.3 156 26V16H152V12H156V8H164Z" fill="white"/>
    <path d="M172 12V32H168V12H172ZM184 32H180V12H184V19C184 19 186 12 192 12V16C188 16 184 19 184 24V32Z" fill="white"/>
    <path d="M200 12V32H196V12H200ZM200 12V16C200 16 204 12 210 12C216 12 218 16 218 20V32H214V20C214 18 212 16 208 16C204 16 200 19 200 24V32H196V12H200Z" fill="white"/>
    <path d="M224 22H238C238 17 234 12 229 12C224 12 220 17 220 22C220 27 224 32 229 32C233 32 236 30 237 27L234 25C233 27 231 28 229 28C226 28 224 26 224 22ZM229 16C232 16 234 18 234 22H224C224 18 226 16 229 16Z" fill="white"/>
  </g>
  <text x="600" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="#9ca3af" text-anchor="middle">Neural Network-Powered Betaflight PID Tuning</text>
</svg>`;

async function generateAssets() {
  console.log('Generating FPVtune brand assets...\n');

  // 1. Favicon 16x16
  console.log('Creating favicon-16x16.png...');
  await sharp(Buffer.from(squareIconSvg(16)))
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  // 2. Favicon 32x32
  console.log('Creating favicon-32x32.png...');
  await sharp(Buffer.from(squareIconSvg(32)))
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  // 3. Android Chrome 192x192
  console.log('Creating android-chrome-192x192.png...');
  await sharp(Buffer.from(squareIconSvg(192)))
    .png()
    .toFile(path.join(publicDir, 'android-chrome-192x192.png'));

  // 4. Android Chrome 512x512
  console.log('Creating android-chrome-512x512.png...');
  await sharp(Buffer.from(squareIconSvg(512)))
    .png()
    .toFile(path.join(publicDir, 'android-chrome-512x512.png'));

  // 5. Apple Touch Icon 180x180
  console.log('Creating apple-touch-icon.png...');
  await sharp(Buffer.from(squareIconSvg(180)))
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 6. Logo PNG (白色，透明背景)
  console.log('Creating logo.png...');
  await sharp(Buffer.from(fullLogoSvg(480, 'white')))
    .png()
    .toFile(path.join(publicDir, 'logo.png'));

  // 7. Logo Dark PNG (深色背景版本)
  console.log('Creating logo-dark.png...');
  await sharp(Buffer.from(fullLogoSvg(480, 'white', '#030304')))
    .png()
    .toFile(path.join(publicDir, 'logo-dark.png'));

  // 8. OG Image 1200x630
  console.log('Creating og.png...');
  await sharp(Buffer.from(ogImageSvg))
    .png()
    .toFile(path.join(publicDir, 'og.png'));

  // 9. Favicon ICO (从 32x32 PNG 生成)
  console.log('Creating favicon.ico...');
  const ico32 = await sharp(Buffer.from(squareIconSvg(32)))
    .png()
    .toBuffer();
  const ico16 = await sharp(Buffer.from(squareIconSvg(16)))
    .png()
    .toBuffer();

  // 使用 png-to-ico
  const pngToIco = (await import('png-to-ico')).default;
  const icoBuffer = await pngToIco([ico32, ico16]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

  // 10. 删除旧的 mksaas.png
  const mksaasPath = path.join(publicDir, 'mksaas.png');
  if (fs.existsSync(mksaasPath)) {
    console.log('Removing old mksaas.png...');
    fs.unlinkSync(mksaasPath);
  }

  console.log('\nAll brand assets generated successfully!');
}

generateAssets().catch(console.error);

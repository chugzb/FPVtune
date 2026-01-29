import { Parser, getWasm } from 'blackbox-log';
import { readFile } from 'fs/promises';

const BBL_PATH = '/Users/a1/A1项目/fpv/public/test bll txt/BTFL_BLACKBOX_LOG_20260113_154353_JHEF745V2五寸竞速胶带.BBL';

async function main() {
  console.log('=== Blackbox Log Parser Test ===\n');

  // 初始化解析器
  console.log('1. Initializing WASM parser...');
  const parser = await Parser.init(getWasm());
  console.log('   ✓ Parser initialized\n');

  // 读取文件
  console.log('2. Loading BBL file...');
  const buffer = await readFile(BBL_PATH);
  console.log(`   ✓ File loaded: ${buffer.length} bytes\n`);

  // 加载到解析器
  console.log('3. Parsing file...');
  const file = parser.loadFile(buffer);
  const logCount = file.logCount;
  console.log(`   ✓ Found ${logCount} log(s) in file\n`);

  // 解析 header
  console.log('4. Parsing headers...');
  const headers = file.parseHeaders(0);
  console.log('   Headers:');
  console.log(`   - Firmware: ${headers.firmwareKind} v${headers.firmwareVersion}`);
  console.log(`   - Craft Name: ${headers.craftName || 'N/A'}`);
  console.log(`   - Debug Mode: ${headers.debugMode || 'N/A'}`);
  console.log('');

  // 获取所有 header 字段
  console.log('5. All header fields:');
  const allHeaders = {};
  for (const key of Object.keys(headers)) {
    if (typeof headers[key] !== 'function') {
      allHeaders[key] = headers[key];
    }
  }
  console.log(JSON.stringify(allHeaders, null, 2));
  console.log('');

  // 解析帧数据（取前 10 帧）
  console.log('6. Parsing frame data (first 10 frames)...');
  const dataParser = await headers.getDataParser();
  
  let frameCount = 0;
  const sampleFrames = [];
  
  for (const event of dataParser) {
    if (event.kind === 'main') {
      frameCount++;
      if (sampleFrames.length < 10) {
        sampleFrames.push(event.data);
      }
    }
    
    // 限制解析量（避免太慢）
    if (frameCount >= 1000) break;
  }
  
  console.log(`   ✓ Parsed ${frameCount} main frames\n`);

  // 显示帧数据结构
  if (sampleFrames.length > 0) {
    console.log('7. Sample frame structure:');
    const firstFrame = sampleFrames[0];
    console.log('   Available fields:', Object.keys(firstFrame));
    console.log('');
    console.log('   First frame data:');
    console.log(JSON.stringify(firstFrame, null, 2));
  }

  console.log('\n=== Test Complete ===');
}

main().catch(console.error);

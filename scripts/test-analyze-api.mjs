#!/usr/bin/env node
/**
 * 测试 Blackbox 分析 API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

async function testAnalyzeAPI() {
  console.log('Testing Blackbox Analysis API...\n');

  // 读取测试文件
  const blackboxPath = path.join(projectRoot, 'test-blackbox.bbl');
  const cliDumpPath = path.join(projectRoot, 'test-cli-dump.txt');

  if (!fs.existsSync(blackboxPath)) {
    console.error('Error: test-blackbox.bbl not found');
    process.exit(1);
  }

  const blackboxFile = fs.readFileSync(blackboxPath);
  const cliDumpFile = fs.existsSync(cliDumpPath)
    ? fs.readFileSync(cliDumpPath)
    : null;

  // 构建 FormData
  const formData = new FormData();
  formData.append('blackbox', new Blob([blackboxFile]), 'test-blackbox.bbl');
  if (cliDumpFile) {
    formData.append('cliDump', new Blob([cliDumpFile]), 'test-cli-dump.txt');
  }
  formData.append('problems', 'propwash, oscillation');
  formData.append('goals', 'locked, snappy');
  formData.append('flyingStyle', 'racing');
  formData.append('frameSize', '5');
  formData.append('additionalNotes', '5寸竞速机，希望获得更锁定的手感');
  formData.append('email', 'test@example.com');

  console.log('Sending request to API...');
  console.log('- Blackbox file size:', blackboxFile.length, 'bytes');
  console.log('- CLI dump file size:', cliDumpFile?.length || 0, 'bytes');
  console.log('- Problems: propwash, oscillation');
  console.log('- Goals: locked, snappy');
  console.log('- Flying style: racing');
  console.log('- Frame size: 5"');
  console.log('');

  try {
    const response = await fetch('http://localhost:3000/api/tune/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      process.exit(1);
    }

    const result = await response.json();
    console.log('API Response:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success && result.analysis) {
      console.log('\n--- Analysis Summary ---');
      console.log(result.analysis.analysis?.summary || 'No summary');

      console.log('\n--- PID Values ---');
      if (result.analysis.pid) {
        console.log('Roll:', result.analysis.pid.roll);
        console.log('Pitch:', result.analysis.pid.pitch);
        console.log('Yaw:', result.analysis.pid.yaw);
      }

      console.log('\n--- CLI Commands ---');
      console.log(
        result.analysis.cli_commands?.substring(0, 500) || 'No CLI commands'
      );
    }
  } catch (error) {
    console.error('Request failed:', error.message);
    process.exit(1);
  }
}

testAnalyzeAPI();

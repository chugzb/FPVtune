#!/usr/bin/env node
/**
 * 测试优化后的提示词
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

async function testPromptOptimization() {
  console.log('测试优化后的提示词...\n');

  // 读取测试文件
  const bblPath = path.join(projectRoot, 'public/test bll txt/BTFL_cli_20260127_163654_TMH7.bbl');
  const txtPath = path.join(projectRoot, 'public/test bll txt/BTFL_cli_20260127_163654_TMH7.txt');

  const bblBuffer = fs.readFileSync(bblPath);
  const txtContent = fs.readFileSync(txtPath, 'utf-8');

  // 创建 FormData
  const formData = new FormData();
  formData.append('testCode', 'JB_VIP_TEST');
  formData.append('email', 'test@example.com');
  formData.append('problems', 'propwash');
  formData.append('goals', 'locked');
  formData.append('flyingStyle', 'freestyle');
  formData.append('frameSize', 'inch5');
  formData.append('motorSize', '2207');
  formData.append('motorKv', '2450');
  formData.append('battery', '6s');
  formData.append('propeller', 'Gemfan 51466');
  formData.append('motorTemp', 'normal');
  formData.append('weight', '650');

  // 添加文件
  const bblBlob = new Blob([bblBuffer], { type: 'application/octet-stream' });
  const txtBlob = new Blob([txtContent], { type: 'text/plain' });
  formData.append('blackboxFile', bblBlob, 'BTFL_cli_20260127_163654_TMH7.bbl');
  formData.append('cliDumpFile', txtBlob, 'BTFL_cli_20260127_163654_TMH7.txt');

  console.log('发送请求到 /api/tune/test-checkout...');
  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3000/api/tune/test-checkout', {
      method: 'POST',
      body: formData,
    });

    const elapsed = Date.now() - startTime;
    console.log(`响应时间: ${elapsed}ms`);
    console.log(`状态码: ${response.status}`);

    const data = await response.json();

    if (data.error) {
      console.error('\n错误:', data.error);
      console.error('详情:', data.details);
      return;
    }

    console.log('\n订单号:', data.orderNumber);
    console.log('状态:', data.status);

    // 等待处理完成
    if (data.status === 'processing' || data.status === 'pending') {
      console.log('\n等待 AI 分析完成...');

      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 3000));
        attempts++;

        const statusRes = await fetch(`http://localhost:3000/api/tune/order/${data.orderNumber}`);
        const statusData = await statusRes.json();

        console.log(`[${attempts}/${maxAttempts}] 状态: ${statusData.order?.status}`);

        if (statusData.order?.status === 'completed') {
          console.log('\n分析完成!');
          console.log('分析结果:', JSON.stringify(statusData.order.analysisResult, null, 2));
          return;
        }

        if (statusData.order?.status === 'failed') {
          console.error('\n分析失败!');
          return;
        }
      }

      console.log('\n超时，请检查服务器日志');
    }
  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

testPromptOptimization();

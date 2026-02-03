import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3000/api/tune/analyze';

async function testPidOptimization() {
  console.log('=== 测试完整调参包优化 ===\n');

  // 使用解码后的 JSON 文件（更小，更快）
  const bblPath = './public/test bll txt/BTFL_cli_20260127_163654_TMH7_decoded.json';
  const cliPath = './public/test bll txt/BTFL_cli_20260127_163654_TMH7.txt';

  const bblContent = fs.readFileSync(bblPath, 'utf-8');
  const cliContent = fs.readFileSync(cliPath, 'utf-8');

  // 打印原始 CLI PID 值
  console.log('原始 CLI PID 值:');
  const pidLines = cliContent.split('\n').filter(line =>
    line.match(/set\s+(p|i|d|f)_(roll|pitch|yaw)\s*=/i)
  );
  pidLines.forEach(line => console.log('  ' + line.trim()));
  console.log('');

  // 构建 FormData
  const formData = new FormData();
  formData.append('blackbox', new Blob([bblContent]), 'BTFL_cli_20260127_163654_TMH7_decoded.json');
  formData.append('cliDump', new Blob([cliContent]), 'BTFL_cli_20260127_163654_TMH7.txt');
  formData.append('problems', 'propwash');
  formData.append('goals', 'locked-in');
  formData.append('flyingStyle', 'freestyle');
  formData.append('frameSize', '5inch');
  formData.append('additionalNotes', '');
  formData.append('locale', 'zh');

  console.log('发送请求到 API...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.error) {
      console.error('API 错误:', result.error);
      console.error('详情:', result.details);
      if (result.rawResponse) {
        console.error('GPT 原始响应:', result.rawResponse);
      }
      return;
    }

    // 打印 GPT 原始响应
    if (result.rawGptResponse) {
      console.log('========================================');
      console.log('=== GPT 原始响应 ===');
      console.log('========================================');
      console.log(result.rawGptResponse);
      console.log('========================================\n');
    }

    const analysis = result.analysis;

    // 显示 PID 值
    console.log('=== GPT 返回的 PID 值 ===');
    const pid = analysis.pid;
    console.log(`  Roll:  P=${pid.roll.p}, I=${pid.roll.i}, D=${pid.roll.d}, F=${pid.roll.f}`);
    console.log(`  Pitch: P=${pid.pitch.p}, I=${pid.pitch.i}, D=${pid.pitch.d}, F=${pid.pitch.f}`);
    console.log(`  Yaw:   P=${pid.yaw.p}, I=${pid.yaw.i}, D=${pid.yaw.d}, F=${pid.yaw.f}`);
    console.log('');

    // 显示滤波器值
    console.log('=== GPT 返回的滤波器值 ===');
    const filters = analysis.filters || {};
    console.log('  陀螺仪滤波器:');
    console.log(`    gyro_lpf1_dyn_min_hz: ${filters.gyro_lpf1_dyn_min_hz || 0}`);
    console.log(`    gyro_lpf1_dyn_max_hz: ${filters.gyro_lpf1_dyn_max_hz || 0}`);
    console.log(`    gyro_lpf1_static_hz: ${filters.gyro_lpf1_static_hz || 0}`);
    console.log(`    gyro_lpf2_static_hz: ${filters.gyro_lpf2_static_hz || 0}`);
    console.log('  D-term 滤波器:');
    console.log(`    dterm_lpf1_dyn_min_hz: ${filters.dterm_lpf1_dyn_min_hz || 0}`);
    console.log(`    dterm_lpf1_dyn_max_hz: ${filters.dterm_lpf1_dyn_max_hz || 0}`);
    console.log(`    dterm_lpf1_static_hz: ${filters.dterm_lpf1_static_hz || 0}`);
    console.log(`    dterm_lpf2_static_hz: ${filters.dterm_lpf2_static_hz || 0}`);
    console.log('  动态陷波滤波器:');
    console.log(`    dyn_notch_count: ${filters.dyn_notch_count || 0}`);
    console.log(`    dyn_notch_q: ${filters.dyn_notch_q || 0}`);
    console.log(`    dyn_notch_min_hz: ${filters.dyn_notch_min_hz || 0}`);
    console.log(`    dyn_notch_max_hz: ${filters.dyn_notch_max_hz || 0}`);
    console.log(`    rpm_filter_harmonics: ${filters.rpm_filter_harmonics || 0}`);
    console.log(`    rpm_filter_min_hz: ${filters.rpm_filter_min_hz || 0}`);
    console.log('');

    // 显示其他参数
    console.log('=== GPT 返回的其他参数 ===');
    const other = analysis.other || {};
    console.log('  D 增益参数:');
    console.log(`    d_max_gain: ${other.d_max_gain || 0}`);
    console.log(`    d_max_advance: ${other.d_max_advance || 0}`);
    console.log(`    d_min_roll: ${other.d_min_roll || 0}`);
    console.log(`    d_min_pitch: ${other.d_min_pitch || 0}`);
    console.log('  Feedforward 参数:');
    console.log(`    feedforward_transition: ${other.feedforward_transition || 0}`);
    console.log(`    feedforward_boost: ${other.feedforward_boost || 0}`);
    console.log(`    feedforward_max_rate_limit: ${other.feedforward_max_rate_limit || 0}`);
    console.log(`    feedforward_jitter_factor: ${other.feedforward_jitter_factor || 0}`);
    console.log('  TPA 参数:');
    console.log(`    tpa_rate: ${other.tpa_rate || 0}`);
    console.log(`    tpa_breakpoint: ${other.tpa_breakpoint || 0}`);
    console.log(`    tpa_low_rate: ${other.tpa_low_rate || 0}`);
    console.log(`    tpa_low_breakpoint: ${other.tpa_low_breakpoint || 0}`);
    console.log('  I-term 参数:');
    console.log(`    iterm_relax_cutoff: ${other.iterm_relax_cutoff || 0}`);
    console.log(`    iterm_windup: ${other.iterm_windup || 0}`);
    console.log(`    iterm_limit: ${other.iterm_limit || 0}`);
    console.log('  油门/电机参数:');
    console.log(`    throttle_boost: ${other.throttle_boost || 0}`);
    console.log(`    throttle_boost_cutoff: ${other.throttle_boost_cutoff || 0}`);
    console.log(`    motor_output_limit: ${other.motor_output_limit || 0}`);
    console.log(`    anti_gravity_gain: ${other.anti_gravity_gain || 0}`);
    console.log('');

    // 对比原始值和返回值
    console.log('=== PID 对比分析 ===');
    const original = {
      roll: { p: 56, i: 100, d: 50, f: 150 },
      pitch: { p: 58, i: 105, d: 57, f: 156 },
      yaw: { p: 56, i: 100, d: 0, f: 150 }
    };

    let pidChanges = 0;
    for (const axis of ['roll', 'pitch', 'yaw']) {
      for (const param of ['p', 'i', 'd', 'f']) {
        if (pid[axis][param] !== original[axis][param]) {
          pidChanges++;
          const diff = pid[axis][param] - original[axis][param];
          const pct = original[axis][param] !== 0
            ? ((diff / original[axis][param]) * 100).toFixed(1)
            : 'N/A';
          console.log(`  ${axis}.${param}: ${original[axis][param]} → ${pid[axis][param]} (${diff > 0 ? '+' : ''}${diff}, ${pct}%)`);
        }
      }
    }

    // 统计非零滤波器参数
    const filterCount = Object.values(filters).filter(v => v !== 0).length;
    const otherCount = Object.values(other).filter(v => v !== 0).length;

    console.log('\n=== 统计 ===');
    console.log(`  PID 变化数: ${pidChanges}`);
    console.log(`  滤波器参数数: ${filterCount}`);
    console.log(`  其他参数数: ${otherCount}`);

    if (pidChanges === 0) {
      console.log('\n❌ 失败: GPT 返回了与原始 CLI 完全相同的 PID 值！');
    } else {
      console.log('\n✅ 成功: GPT 返回了完整的调参包！');
    }

    // 显示完整的 CLI 命令
    if (analysis.cliCommands) {
      console.log('\n========================================');
      console.log('=== 完整 CLI 命令（直接复制到 Betaflight）===');
      console.log('========================================');
      console.log(analysis.cliCommands);
    }

    console.log('\n分析摘要:', analysis.analysis?.summary);
    if (analysis.analysis?.issues) {
      console.log('\n=== 发现的问题 ===');
      analysis.analysis.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }
    if (analysis.analysis?.recommendations) {
      console.log('\n=== 建议 ===');
      analysis.analysis.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

testPidOptimization();

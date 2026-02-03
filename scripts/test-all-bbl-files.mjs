// 全面测试所有 BBL + CLI 文件组合
// 验证 GPT 是否真正优化了 PID 值

import fs from 'fs';
import path from 'path';

const TEST_DIR = './public/test bll txt';

// 定义测试用例：BBL 文件 + 对应的 CLI 文件
const TEST_CASES = [
  {
    name: 'JHEF745V2 五寸竞速胶带',
    bbl: 'BTFL_BLACKBOX_LOG_20260113_154353_JHEF745V2五寸竞速胶带.BBL',
    cli: 'BTFL_cli_20260113_154510_JHEF745V2五寸竞速胶带.txt',
    problems: 'propwash',
    goals: 'locked-in',
  },
  {
    name: 'GREATMOUNTAINRCF435',
    bbl: 'BTFL_cli_20260127_162350_GREATMOUNTAINRCF435.bbl',
    cli: 'BTFL_cli_20260127_162350_GREATMOUNTAINRCF435.txt',
    problems: 'propwash,motor-hot',
    goals: 'locked-in,responsive',
  },
  {
    name: 'TMH7',
    bbl: 'BTFL_cli_20260127_163654_TMH7.bbl',
    cli: 'BTFL_cli_20260127_163654_TMH7.txt',
    problems: 'sluggish',
    goals: 'responsive',
  },
  {
    name: 'MAMBAF722 (Crane Shadow)',
    bbl: 'BTFL_cli_CRANE_SHADOW O4_20260127_165659_MAMBAF722_2022B.BBL',
    cli: 'BTFL_cli_CRANE_SHADOW O4_20260127_165659_MAMBAF722_2022B.txt',
    problems: 'mid-throttle-oscillation',
    goals: 'smooth-cinematic',
  },
];

// 提取 PID 值的正则
const PID_PATTERNS = [
  { regex: /set\s+p_roll\s*=\s*(\d+)/i, key: 'p_roll' },
  { regex: /set\s+i_roll\s*=\s*(\d+)/i, key: 'i_roll' },
  { regex: /set\s+d_roll\s*=\s*(\d+)/i, key: 'd_roll' },
  { regex: /set\s+f_roll\s*=\s*(\d+)/i, key: 'f_roll' },
  { regex: /set\s+p_pitch\s*=\s*(\d+)/i, key: 'p_pitch' },
  { regex: /set\s+i_pitch\s*=\s*(\d+)/i, key: 'i_pitch' },
  { regex: /set\s+d_pitch\s*=\s*(\d+)/i, key: 'd_pitch' },
  { regex: /set\s+f_pitch\s*=\s*(\d+)/i, key: 'f_pitch' },
  { regex: /set\s+p_yaw\s*=\s*(\d+)/i, key: 'p_yaw' },
  { regex: /set\s+i_yaw\s*=\s*(\d+)/i, key: 'i_yaw' },
  { regex: /set\s+d_yaw\s*=\s*(\d+)/i, key: 'd_yaw' },
  { regex: /set\s+f_yaw\s*=\s*(\d+)/i, key: 'f_yaw' },
];

// 滤波器参数
const FILTER_PATTERNS = [
  { regex: /set\s+gyro_lpf1_dyn_min_hz\s*=\s*(\d+)/i, key: 'gyro_lpf1_dyn_min_hz' },
  { regex: /set\s+gyro_lpf1_dyn_max_hz\s*=\s*(\d+)/i, key: 'gyro_lpf1_dyn_max_hz' },
  { regex: /set\s+gyro_lpf1_static_hz\s*=\s*(\d+)/i, key: 'gyro_lpf1_static_hz' },
  { regex: /set\s+gyro_lpf2_static_hz\s*=\s*(\d+)/i, key: 'gyro_lpf2_static_hz' },
  { regex: /set\s+dterm_lpf1_dyn_min_hz\s*=\s*(\d+)/i, key: 'dterm_lpf1_dyn_min_hz' },
  { regex: /set\s+dterm_lpf1_dyn_max_hz\s*=\s*(\d+)/i, key: 'dterm_lpf1_dyn_max_hz' },
  { regex: /set\s+dterm_lpf1_static_hz\s*=\s*(\d+)/i, key: 'dterm_lpf1_static_hz' },
  { regex: /set\s+dterm_lpf2_static_hz\s*=\s*(\d+)/i, key: 'dterm_lpf2_static_hz' },
  { regex: /set\s+dyn_notch_count\s*=\s*(\d+)/i, key: 'dyn_notch_count' },
  { regex: /set\s+dyn_notch_q\s*=\s*(\d+)/i, key: 'dyn_notch_q' },
  { regex: /set\s+dyn_notch_min_hz\s*=\s*(\d+)/i, key: 'dyn_notch_min_hz' },
  { regex: /set\s+dyn_notch_max_hz\s*=\s*(\d+)/i, key: 'dyn_notch_max_hz' },
  { regex: /set\s+rpm_filter_harmonics\s*=\s*(\d+)/i, key: 'rpm_filter_harmonics' },
  { regex: /set\s+rpm_filter_min_hz\s*=\s*(\d+)/i, key: 'rpm_filter_min_hz' },
];

// 其他参数
const OTHER_PATTERNS = [
  { regex: /set\s+d_max_gain\s*=\s*(\d+)/i, key: 'd_max_gain' },
  { regex: /set\s+d_max_advance\s*=\s*(\d+)/i, key: 'd_max_advance' },
  { regex: /set\s+d_min_roll\s*=\s*(\d+)/i, key: 'd_min_roll' },
  { regex: /set\s+d_min_pitch\s*=\s*(\d+)/i, key: 'd_min_pitch' },
  { regex: /set\s+feedforward_boost\s*=\s*(\d+)/i, key: 'feedforward_boost' },
  { regex: /set\s+feedforward_max_rate_limit\s*=\s*(\d+)/i, key: 'feedforward_max_rate_limit' },
  { regex: /set\s+feedforward_jitter_factor\s*=\s*(\d+)/i, key: 'feedforward_jitter_factor' },
  { regex: /set\s+tpa_rate\s*=\s*(\d+)/i, key: 'tpa_rate' },
  { regex: /set\s+tpa_breakpoint\s*=\s*(\d+)/i, key: 'tpa_breakpoint' },
  { regex: /set\s+iterm_relax_cutoff\s*=\s*(\d+)/i, key: 'iterm_relax_cutoff' },
  { regex: /set\s+throttle_boost\s*=\s*(\d+)/i, key: 'throttle_boost' },
  { regex: /set\s+anti_gravity_gain\s*=\s*(\d+)/i, key: 'anti_gravity_gain' },
];

function extractFromCli(cliContent, patterns) {
  const result = {};
  for (const { regex, key } of patterns) {
    const match = cliContent.match(regex);
    if (match) {
      result[key] = parseInt(match[1], 10);
    }
  }
  return result;
}

function extractPidFromCli(cliContent) {
  return extractFromCli(cliContent, PID_PATTERNS);
}

function extractFiltersFromCli(cliContent) {
  return extractFromCli(cliContent, FILTER_PATTERNS);
}

function extractOtherFromCli(cliContent) {
  return extractFromCli(cliContent, OTHER_PATTERNS);
}

function compareValues(original, gpt, category) {
  const changes = [];

  if (category === 'pid') {
    const comparisons = [
      { orig: original.p_roll, gpt: gpt.roll?.p, name: 'p_roll' },
      { orig: original.i_roll, gpt: gpt.roll?.i, name: 'i_roll' },
      { orig: original.d_roll, gpt: gpt.roll?.d, name: 'd_roll' },
      { orig: original.f_roll, gpt: gpt.roll?.f, name: 'f_roll' },
      { orig: original.p_pitch, gpt: gpt.pitch?.p, name: 'p_pitch' },
      { orig: original.i_pitch, gpt: gpt.pitch?.i, name: 'i_pitch' },
      { orig: original.d_pitch, gpt: gpt.pitch?.d, name: 'd_pitch' },
      { orig: original.f_pitch, gpt: gpt.pitch?.f, name: 'f_pitch' },
      { orig: original.p_yaw, gpt: gpt.yaw?.p, name: 'p_yaw' },
      { orig: original.i_yaw, gpt: gpt.yaw?.i, name: 'i_yaw' },
      { orig: original.d_yaw, gpt: gpt.yaw?.d, name: 'd_yaw' },
      { orig: original.f_yaw, gpt: gpt.yaw?.f, name: 'f_yaw' },
    ];
    for (const { orig, gpt: gptVal, name } of comparisons) {
      if (orig !== undefined && gptVal !== undefined && gptVal !== 0) {
        const diff = gptVal - orig;
        const pct = orig > 0 ? ((diff / orig) * 100).toFixed(1) : 'N/A';
        changes.push({ name, orig, gpt: gptVal, diff, pct, changed: orig !== gptVal });
      }
    }
  } else {
    // filters or other
    for (const key of Object.keys(gpt)) {
      const gptVal = gpt[key];
      const origVal = original[key] || 0;
      if (gptVal !== undefined && gptVal !== 0) {
        const diff = gptVal - origVal;
        const pct = origVal > 0 ? ((diff / origVal) * 100).toFixed(1) : 'NEW';
        changes.push({ name: key, orig: origVal, gpt: gptVal, diff, pct, changed: origVal !== gptVal });
      }
    }
  }

  return changes;
}

function comparePid(original, gpt) {
  return compareValues(original, gpt, 'pid').filter(c => c.changed);
}

async function runTest(testCase, index) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试 ${index + 1}/${TEST_CASES.length}: ${testCase.name}`);
  console.log(`${'='.repeat(60)}`);

  const bblPath = path.join(TEST_DIR, testCase.bbl);
  const cliPath = path.join(TEST_DIR, testCase.cli);

  // 检查文件是否存在
  if (!fs.existsSync(bblPath)) {
    console.log(`  跳过: BBL 文件不存在 - ${testCase.bbl}`);
    return { name: testCase.name, status: 'skipped', reason: 'BBL file not found' };
  }
  if (!fs.existsSync(cliPath)) {
    console.log(`  跳过: CLI 文件不存在 - ${testCase.cli}`);
    return { name: testCase.name, status: 'skipped', reason: 'CLI file not found' };
  }

  const bblContent = fs.readFileSync(bblPath);
  const cliContent = fs.readFileSync(cliPath, 'utf-8');

  // 提取原始参数
  const originalPid = extractPidFromCli(cliContent);
  const originalFilters = extractFiltersFromCli(cliContent);
  const originalOther = extractOtherFromCli(cliContent);

  console.log(`\n原始 PID:`);
  console.log(`  Roll:  P=${originalPid.p_roll || '-'}, I=${originalPid.i_roll || '-'}, D=${originalPid.d_roll || '-'}, F=${originalPid.f_roll || '-'}`);
  console.log(`  Pitch: P=${originalPid.p_pitch || '-'}, I=${originalPid.i_pitch || '-'}, D=${originalPid.d_pitch || '-'}, F=${originalPid.f_pitch || '-'}`);
  console.log(`  Yaw:   P=${originalPid.p_yaw || '-'}, I=${originalPid.i_yaw || '-'}, D=${originalPid.d_yaw || '-'}, F=${originalPid.f_yaw || '-'}`);

  console.log(`\n原始滤波器:`);
  if (Object.keys(originalFilters).length > 0) {
    for (const [k, v] of Object.entries(originalFilters)) {
      console.log(`  ${k} = ${v}`);
    }
  } else {
    console.log(`  (无滤波器参数)`);
  }

  console.log(`\n问题: ${testCase.problems}`);
  console.log(`目标: ${testCase.goals}`);

  // 调用 API
  const formData = new FormData();
  formData.append('blackbox', new Blob([bblContent]), testCase.bbl);
  formData.append('cliDump', new Blob([cliContent]), testCase.cli);
  formData.append('problems', testCase.problems);
  formData.append('goals', testCase.goals);
  formData.append('flyingStyle', 'freestyle');
  formData.append('frameSize', '5inch');
  formData.append('locale', 'zh');

  console.log(`\n调用 API...`);
  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3000/api/tune/analyze', {
      method: 'POST',
      body: formData,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`  失败: HTTP ${response.status} (${elapsed}s)`);
      console.log(`  错误: ${errorText.substring(0, 200)}`);
      return { name: testCase.name, status: 'failed', reason: `HTTP ${response.status}`, time: elapsed };
    }

    const result = await response.json();

    if (!result.success) {
      console.log(`  失败: ${result.error} (${elapsed}s)`);
      return { name: testCase.name, status: 'failed', reason: result.error, time: elapsed };
    }

    console.log(`  成功! (${elapsed}s)`);

    // 提取 GPT 返回的参数
    const gptPid = result.analysis.pid;
    const gptFilters = result.analysis.filters;
    const gptOther = result.analysis.other;

    console.log(`\n========== GPT 优化结果 ==========`);

    // PID 对比
    console.log(`\n【PID 参数】`);
    console.log(`  Roll:  P=${gptPid.roll.p}, I=${gptPid.roll.i}, D=${gptPid.roll.d}, F=${gptPid.roll.f}`);
    console.log(`  Pitch: P=${gptPid.pitch.p}, I=${gptPid.pitch.i}, D=${gptPid.pitch.d}, F=${gptPid.pitch.f}`);
    console.log(`  Yaw:   P=${gptPid.yaw.p}, I=${gptPid.yaw.i}, D=${gptPid.yaw.d}, F=${gptPid.yaw.f}`);

    const pidChanges = comparePid(originalPid, gptPid);
    if (pidChanges.length > 0) {
      console.log(`\n  PID 变化 (${pidChanges.length} 项):`);
      for (const c of pidChanges) {
        const sign = c.diff > 0 ? '+' : '';
        console.log(`    ${c.name}: ${c.orig} → ${c.gpt} (${sign}${c.diff}, ${c.pct}%)`);
      }
    } else {
      console.log(`\n  PID 无变化`);
    }

    // 滤波器对比
    console.log(`\n【滤波器参数】`);
    const filterChanges = compareValues(originalFilters, gptFilters, 'filters');
    const filterChanged = filterChanges.filter(c => c.changed);

    if (filterChanges.length > 0) {
      for (const c of filterChanges) {
        const sign = c.diff > 0 ? '+' : '';
        const changeMarker = c.changed ? ' *' : '';
        console.log(`  ${c.name}: ${c.orig} → ${c.gpt}${changeMarker}`);
      }
      if (filterChanged.length > 0) {
        console.log(`\n  滤波器变化 (${filterChanged.length} 项):`);
        for (const c of filterChanged) {
          const sign = c.diff > 0 ? '+' : '';
          console.log(`    ${c.name}: ${c.orig} → ${c.gpt} (${sign}${c.diff}, ${c.pct}%)`);
        }
      }
    } else {
      console.log(`  (无滤波器输出)`);
    }

    // 其他参数对比
    console.log(`\n【其他参数】`);
    const otherChanges = compareValues(originalOther, gptOther, 'other');
    const otherChanged = otherChanges.filter(c => c.changed);

    if (otherChanges.length > 0) {
      for (const c of otherChanges) {
        const changeMarker = c.changed ? ' *' : '';
        console.log(`  ${c.name}: ${c.orig} → ${c.gpt}${changeMarker}`);
      }
      if (otherChanged.length > 0) {
        console.log(`\n  其他参数变化 (${otherChanged.length} 项):`);
        for (const c of otherChanged) {
          const sign = c.diff > 0 ? '+' : '';
          console.log(`    ${c.name}: ${c.orig} → ${c.gpt} (${sign}${c.diff}, ${c.pct}%)`);
        }
      }
    } else {
      console.log(`  (无其他参数输出)`);
    }

    const totalChanges = pidChanges.length + filterChanged.length + otherChanged.length;

    if (totalChanges > 0) {
      console.log(`\n总计变化: PID ${pidChanges.length} 项, 滤波器 ${filterChanged.length} 项, 其他 ${otherChanged.length} 项`);
      return {
        name: testCase.name,
        status: 'optimized',
        pidChanges: pidChanges.length,
        filterChanges: filterChanged.length,
        otherChanges: otherChanged.length,
        totalChanges,
        time: elapsed
      };
    } else {
      console.log(`\n警告: GPT 没有修改任何参数!`);
      return { name: testCase.name, status: 'no-change', time: elapsed };
    }

  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  错误: ${error.message} (${elapsed}s)`);
    return { name: testCase.name, status: 'error', reason: error.message, time: elapsed };
  }
}

async function main() {
  console.log('========================================');
  console.log('  FPVtune GPT PID 优化全面测试');
  console.log('========================================');
  console.log(`测试用例数: ${TEST_CASES.length}`);
  console.log(`测试目录: ${TEST_DIR}`);

  const results = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const result = await runTest(TEST_CASES[i], i);
    results.push(result);
  }

  // 汇总报告
  console.log(`\n${'='.repeat(60)}`);
  console.log('测试汇总报告');
  console.log(`${'='.repeat(60)}`);

  const optimized = results.filter(r => r.status === 'optimized');
  const noChange = results.filter(r => r.status === 'no-change');
  const failed = results.filter(r => r.status === 'failed' || r.status === 'error');
  const skipped = results.filter(r => r.status === 'skipped');

  console.log(`\n总计: ${results.length} 个测试`);
  console.log(`  成功优化: ${optimized.length}`);
  console.log(`  无变化:   ${noChange.length}`);
  console.log(`  失败:     ${failed.length}`);
  console.log(`  跳过:     ${skipped.length}`);

  if (optimized.length > 0) {
    console.log(`\n成功优化的测试:`);
    for (const r of optimized) {
      console.log(`  - ${r.name}: PID ${r.pidChanges}项, 滤波器 ${r.filterChanges}项, 其他 ${r.otherChanges}项 (${r.time}s)`);
    }
  }

  if (noChange.length > 0) {
    console.log(`\n无变化的测试 (需要检查):`);
    for (const r of noChange) {
      console.log(`  - ${r.name} (${r.time}s)`);
    }
  }

  if (failed.length > 0) {
    console.log(`\n失败的测试:`);
    for (const r of failed) {
      console.log(`  - ${r.name}: ${r.reason}`);
    }
  }

  // 最终结论
  console.log(`\n${'='.repeat(60)}`);
  if (optimized.length === results.length - skipped.length && noChange.length === 0 && failed.length === 0) {
    console.log('结论: 所有测试通过! GPT 成功优化了所有 PID 值');
  } else if (optimized.length > 0) {
    console.log(`结论: 部分测试通过 (${optimized.length}/${results.length - skipped.length})`);
  } else {
    console.log('结论: 测试失败，需要检查');
  }
  console.log(`${'='.repeat(60)}`);
}

main().catch(console.error);

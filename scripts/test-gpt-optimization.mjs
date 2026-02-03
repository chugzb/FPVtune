import fs from 'fs';

// 读取测试文件
const bblPath = './public/test bll txt/btfl_all.bbl';
const cliPath = './public/test bll txt/BTFL_cli_20260113_154510_JHEF745V2五寸竞速胶带.txt';

const bblContent = fs.readFileSync(bblPath);
const cliContent = fs.readFileSync(cliPath, 'utf-8');

// 提取原始 PID 值
const originalPid = {};
const pidPatterns = [
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
];

for (const { regex, key } of pidPatterns) {
  const match = cliContent.match(regex);
  if (match) {
    originalPid[key] = parseInt(match[1], 10);
  }
}

console.log('=== 原始 PID 值 ===');
console.log(JSON.stringify(originalPid, null, 2));

// 创建 FormData (使用原生 FormData)
const formData = new FormData();
formData.append('blackbox', new Blob([bblContent]), 'btfl_all.bbl');
formData.append('cliDump', new Blob([cliContent]), 'cli.txt');
formData.append('problems', 'propwash,sluggish');
formData.append('goals', 'locked-in,responsive');
formData.append('flyingStyle', 'freestyle');
formData.append('frameSize', '5inch');
formData.append('locale', 'zh');

console.log('\n=== 调用 API 分析 ===');
console.log('问题: 桨洗, 响应迟钝');
console.log('目标: 锁定感, 灵敏响应');

const response = await fetch('http://localhost:3000/api/tune/analyze', {
  method: 'POST',
  body: formData,
});

const result = await response.json();

if (!result.success) {
  console.error('API 错误:', result.error);
  process.exit(1);
}

console.log('\n=== GPT 返回的 PID 值 ===');
const gptPid = result.analysis.pid;
console.log('Roll:  P=' + gptPid.roll.p + ', I=' + gptPid.roll.i + ', D=' + gptPid.roll.d + ', F=' + gptPid.roll.f);
console.log('Pitch: P=' + gptPid.pitch.p + ', I=' + gptPid.pitch.i + ', D=' + gptPid.pitch.d + ', F=' + gptPid.pitch.f);
console.log('Yaw:   P=' + gptPid.yaw.p + ', I=' + gptPid.yaw.i + ', D=' + gptPid.yaw.d + ', F=' + gptPid.yaw.f);

console.log('\n=== 对比分析 ===');
const changes = [];
const comparisons = [
  { orig: originalPid.p_roll, gpt: gptPid.roll.p, name: 'p_roll' },
  { orig: originalPid.i_roll, gpt: gptPid.roll.i, name: 'i_roll' },
  { orig: originalPid.d_roll, gpt: gptPid.roll.d, name: 'd_roll' },
  { orig: originalPid.f_roll, gpt: gptPid.roll.f, name: 'f_roll' },
  { orig: originalPid.p_pitch, gpt: gptPid.pitch.p, name: 'p_pitch' },
  { orig: originalPid.i_pitch, gpt: gptPid.pitch.i, name: 'i_pitch' },
  { orig: originalPid.d_pitch, gpt: gptPid.pitch.d, name: 'd_pitch' },
  { orig: originalPid.f_pitch, gpt: gptPid.pitch.f, name: 'f_pitch' },
  { orig: originalPid.p_yaw, gpt: gptPid.yaw.p, name: 'p_yaw' },
  { orig: originalPid.i_yaw, gpt: gptPid.yaw.i, name: 'i_yaw' },
];

let hasChanges = false;
for (const { orig, gpt, name } of comparisons) {
  const diff = gpt - orig;
  const pct = orig > 0 ? ((diff / orig) * 100).toFixed(1) : 'N/A';
  const status = diff === 0 ? '无变化' : (diff > 0 ? '增加' : '减少');
  console.log(`${name}: ${orig} -> ${gpt} (${status} ${Math.abs(diff)}, ${pct}%)`);
  if (diff !== 0) {
    hasChanges = true;
    changes.push({ name, orig, gpt, diff, pct });
  }
}

console.log('\n=== 结论 ===');
if (hasChanges) {
  console.log('GPT 已成功优化 PID 值！');
  console.log('变化的参数:');
  for (const c of changes) {
    console.log(`  - ${c.name}: ${c.orig} -> ${c.gpt} (${c.diff > 0 ? '+' : ''}${c.diff})`);
  }
} else {
  console.log('警告: GPT 没有修改任何 PID 值，仍然返回原始值！');
}

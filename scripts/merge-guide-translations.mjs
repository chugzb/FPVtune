import { readFileSync, writeFileSync } from 'fs';

// 读取现有翻译
const zh = JSON.parse(readFileSync('messages/zh.json', 'utf8'));
const en = JSON.parse(readFileSync('messages/en.json', 'utf8'));

// 读取新的教程翻译
const guidesZh = JSON.parse(
  readFileSync('messages/guides-zh-addon.json', 'utf8')
);
const guidesEn = JSON.parse(
  readFileSync('messages/guides-en-addon.json', 'utf8')
);

// 合并翻译
zh.Guides = guidesZh.Guides;
en.Guides = guidesEn.Guides;

// 写回文件
writeFileSync('messages/zh.json', JSON.stringify(zh, null, 2));
writeFileSync('messages/en.json', JSON.stringify(en, null, 2));

console.log('✅ 教程翻译合并完成');

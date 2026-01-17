import { readFileSync, writeFileSync } from 'fs';

const zh = JSON.parse(readFileSync('messages/zh.json', 'utf8'));
const en = JSON.parse(readFileSync('messages/en.json', 'utf8'));
const guides = JSON.parse(
  readFileSync('messages/guides-translations.json', 'utf8')
);

// 合并翻译
Object.assign(zh, guides.zh);
Object.assign(en, guides.en);

// 写回文件
writeFileSync('messages/zh.json', JSON.stringify(zh, null, 2));
writeFileSync('messages/en.json', JSON.stringify(en, null, 2));

console.log('✅ 翻译合并完成');

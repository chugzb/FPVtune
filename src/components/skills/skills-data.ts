import type { Preset } from './types';

export const presetsData: Preset[] = [
  {
    id: 'freestyle-smooth',
    name: 'Freestyle Smooth',
    description:
      '适合自由飞行的平滑调参预设，响应灵敏但不过于激进。适合拍摄流畅的穿越视频，减少抖动和过冲。',
    author: { name: 'JohnnyFPV', avatar: '' },
    stats: { downloads: 12453, likes: 2891 },
    tags: ['freestyle', 'cinematic'],
    firmware: 'Betaflight 4.5',
    frameSize: '5 inch',
  },
  {
    id: 'race-aggressive',
    name: 'Race Aggressive',
    description:
      '竞速专用高响应预设，极致的锁定感和快速响应。适合穿越门和高速弯道，需要较好的飞行基础。',
    author: { name: 'VanoverFPV', avatar: '' },
    stats: { downloads: 8521, likes: 1823 },
    tags: ['racing', 'competition'],
    firmware: 'Betaflight 4.5',
    frameSize: '5 inch',
  },
  {
    id: 'cinematic-ultra',
    name: 'Cinematic Ultra',
    description:
      '电影级拍摄预设，极致平滑的画面输出。降低了响应速度换取丝滑的镜头移动，适合专业航拍。',
    author: { name: 'StingersSwarm', avatar: '' },
    stats: { downloads: 15234, likes: 3456 },
    tags: ['cinematic', 'filming'],
    firmware: 'Betaflight 4.4',
    frameSize: '5 inch',
  },
  {
    id: 'toothpick-3inch',
    name: 'Toothpick 3 Inch',
    description:
      '3寸牙签机专用预设，针对轻量化机架优化。平衡了响应性和电池续航，适合室内外穿越。',
    author: { name: 'KababFPV', avatar: '' },
    stats: { downloads: 6234, likes: 987 },
    tags: ['toothpick', 'lightweight'],
    firmware: 'Betaflight 4.5',
    frameSize: '3 inch',
  },
  {
    id: 'whoop-indoor',
    name: 'Whoop Indoor',
    description:
      '室内涵道机预设，低噪音平稳飞行。针对 65mm-75mm 涵道机优化，适合家庭和办公室飞行。',
    author: { name: 'TinyWhoop', avatar: '' },
    stats: { downloads: 9876, likes: 1654 },
    tags: ['whoop', 'indoor'],
    firmware: 'Betaflight 4.4',
    frameSize: '65mm',
  },
  {
    id: 'long-range-cruise',
    name: 'Long Range Cruise',
    description:
      '远航巡航预设，优化续航和稳定性。降低了激进响应，增加滤波以获得更稳定的长距离飞行体验。',
    author: { name: 'BardwellFPV', avatar: '' },
    stats: { downloads: 7654, likes: 1432 },
    tags: ['long-range', 'cruising'],
    firmware: 'INAV 7.0',
    frameSize: '7 inch',
  },
  {
    id: 'acro-trainer',
    name: 'Acro Trainer',
    description:
      '新手特技训练预设，降低了响应灵敏度。帮助新手学习翻滚和特技动作，减少失控风险。',
    author: { name: 'JoshuaBardwell', avatar: '' },
    stats: { downloads: 11234, likes: 2345 },
    tags: ['beginner', 'training'],
    firmware: 'Betaflight 4.5',
    frameSize: '5 inch',
  },
  {
    id: 'proximity-flow',
    name: 'Proximity Flow',
    description:
      '近距离穿越预设，快速响应但保持可控。适合建筑物、树林等复杂环境的近距离飞行。',
    author: { name: 'Le_Drib', avatar: '' },
    stats: { downloads: 8765, likes: 1876 },
    tags: ['proximity', 'freestyle'],
    firmware: 'Betaflight 4.5',
    frameSize: '5 inch',
  },
  {
    id: 'cinewhoop-smooth',
    name: 'Cinewhoop Smooth',
    description:
      '穿越机航拍预设，专为涵道穿越机设计。超平滑的云台般效果，适合室内商业拍摄。',
    author: { name: 'RotorRiot', avatar: '' },
    stats: { downloads: 13456, likes: 2987 },
    tags: ['cinewhoop', 'cinematic'],
    firmware: 'Betaflight 4.4',
    frameSize: '3 inch',
  },
  {
    id: 'micro-quad',
    name: 'Micro Quad 2 Inch',
    description:
      '2寸微型机预设，针对小机架高KV电机优化。响应迅速但不会过热，适合后院练习。',
    author: { name: 'MrSteeleFPV', avatar: '' },
    stats: { downloads: 5432, likes: 876 },
    tags: ['micro', 'backyard'],
    firmware: 'Betaflight 4.5',
    frameSize: '2 inch',
  },
  {
    id: 'dji-o3-tune',
    name: 'DJI O3 Optimized',
    description:
      'DJI O3 图传系统优化预设，针对 O3 延迟特性调整。减少图传延迟带来的操控滞后感。',
    author: { name: 'UAVFutures', avatar: '' },
    stats: { downloads: 18765, likes: 4321 },
    tags: ['dji', 'digital'],
    firmware: 'Betaflight 4.5',
    frameSize: '5 inch',
  },
  {
    id: 'analog-classic',
    name: 'Analog Classic',
    description:
      '模拟图传经典预设，低延迟高响应。为追求极致操控感的模拟党优化，锁定感强烈。',
    author: { name: 'Skitzo', avatar: '' },
    stats: { downloads: 6543, likes: 1234 },
    tags: ['analog', 'classic'],
    firmware: 'Betaflight 4.4',
    frameSize: '5 inch',
  },
  {
    id: 'hd-zero-tune',
    name: 'HDZero Optimized',
    description:
      'HDZero 数字图传优化预设，针对超低延迟特性调整。发挥 HDZero 的延迟优势。',
    author: { name: 'AndyRC', avatar: '' },
    stats: { downloads: 4567, likes: 876 },
    tags: ['hdzero', 'digital'],
    firmware: 'Betaflight 4.5',
    frameSize: '5 inch',
  },
  {
    id: 'x-class-heavy',
    name: 'X-Class Heavy',
    description:
      '大型机专用预设，适合 7 寸以上重载机型。针对高惯性机架优化 PID，稳定可靠。',
    author: { name: 'NurK', avatar: '' },
    stats: { downloads: 3456, likes: 654 },
    tags: ['x-class', 'heavy'],
    firmware: 'Betaflight 4.5',
    frameSize: '7+ inch',
  },
  {
    id: 'gps-rescue',
    name: 'GPS Rescue Ready',
    description:
      '带 GPS 救援功能的安全预设，适合新手和远航。内置失控返航参数，降低炸机风险。',
    author: { name: 'PainlessGPS', avatar: '' },
    stats: { downloads: 7890, likes: 1567 },
    tags: ['gps', 'safety'],
    firmware: 'Betaflight 4.5',
    frameSize: '5 inch',
  },
  {
    id: 'emuflight-smooth',
    name: 'EmuFlight Smooth',
    description:
      'EmuFlight 固件专用预设，发挥 EmuFlight 的平滑特性。适合追求丝滑手感的飞手。',
    author: { name: 'EmuFlight', avatar: '' },
    stats: { downloads: 2345, likes: 456 },
    tags: ['emuflight', 'smooth'],
    firmware: 'EmuFlight 0.4',
    frameSize: '5 inch',
  },
  {
    id: 'kiss-ultra',
    name: 'KISS Ultra FC',
    description:
      'KISS 飞控专用预设，针对 KISS 固件特性优化。简洁高效的调参方案。',
    author: { name: 'FlyDuino', avatar: '' },
    stats: { downloads: 4321, likes: 876 },
    tags: ['kiss', 'premium'],
    firmware: 'KISS Ultra',
    frameSize: '5 inch',
  },
  {
    id: 'winter-cold',
    name: 'Winter Cold Weather',
    description:
      '低温环境专用预设，针对电池和电机在寒冷天气的表现优化。减少低温下的抖动问题。',
    author: { name: 'NordicFPV', avatar: '' },
    stats: { downloads: 1876, likes: 345 },
    tags: ['winter', 'cold'],
    firmware: 'Betaflight 4.5',
    frameSize: '5 inch',
  },
];

// 兼容旧的导出名
export const skillsData = presetsData;

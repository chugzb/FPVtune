export interface Preset {
  id: string;
  name: string;
  description: string;
  author: {
    name: string;
    avatar: string;
  };
  stats: {
    downloads: number;
    likes: number;
  };
  tags: string[];
  firmware: string;
  frameSize: string;
}

// 保留旧类型兼容
export type Skill = Preset;

// 技能分类类型
export type SkillCategory =
  | 'document'
  | 'design'
  | 'development'
  | 'automation'
  | 'data'
  | 'communication'
  | 'testing'
  | 'ai';

// 分类配置
export const categoryConfig: Record<
  SkillCategory,
  { label: string; color: string }
> = {
  document: { label: 'Document', color: 'blue' },
  design: { label: 'Design', color: 'purple' },
  development: { label: 'Development', color: 'green' },
  automation: { label: 'Automation', color: 'orange' },
  data: { label: 'Data', color: 'cyan' },
  communication: { label: 'Communication', color: 'pink' },
  testing: { label: 'Testing', color: 'yellow' },
  ai: { label: 'AI', color: 'red' },
};

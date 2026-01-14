import { SkillsMarketplace } from '@/components/skills/skills-marketplace';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SkillsPage');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function SkillsPage() {
  return <SkillsMarketplace />;
}

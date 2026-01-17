import { StaticPage } from '@/components/page/static-page';
import { pagesData } from '@/data/pages';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('FAQPage');
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function FAQPage() {
  const locale = await getLocale();
  const page = pagesData[locale]?.faq;

  if (!page) {
    notFound();
  }

  return <StaticPage page={page} />;
}

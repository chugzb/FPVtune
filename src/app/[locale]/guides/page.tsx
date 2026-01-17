import { Breadcrumb } from '@/components/guides/breadcrumb';
import { generatePageMetadata } from '@/lib/metadata';
import { BookOpen, FileText, Terminal } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Guides.index' });

  return generatePageMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    path: `/${locale}/guides`,
    locale,
  });
}

export default async function GuidesIndexPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Guides.index' });

  const guides = [
    {
      id: 'export-blackbox',
      title: t('guides.exportBlackbox.title'),
      description: t('guides.exportBlackbox.description'),
      icon: FileText,
      href: `/${locale}/guides/export-blackbox`,
    },
    {
      id: 'export-cli-dump',
      title: t('guides.exportCliDump.title'),
      description: t('guides.exportCliDump.description'),
      icon: Terminal,
      href: `/${locale}/guides/export-cli-dump`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#030304] text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Breadcrumb
          items={[
            { label: t('breadcrumbs.home'), href: '/' },
            { label: t('breadcrumbs.current') },
          ]}
        />

        <div className="text-center mt-8 mb-12">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-3">{t('title')}</h1>
          <p className="text-gray-400 text-lg">{t('description')}</p>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">
            {t('categories.gettingStarted')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guides.map((guide) => {
              const Icon = guide.icon;
              return (
                <Link
                  key={guide.id}
                  href={guide.href}
                  className="group p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {guide.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {guide.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

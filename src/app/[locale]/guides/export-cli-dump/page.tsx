import { TutorialImage } from '@/components/guides/tutorial-image';
import { TutorialLayout } from '@/components/guides/tutorial-layout';
import { TutorialStep } from '@/components/guides/tutorial-step';
import { generatePageMetadata } from '@/lib/metadata';
import { AlertCircle, Copy, Terminal } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'Guides.exportCliDump',
  });

  return generatePageMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    path: `/${locale}/guides/export-cli-dump`,
    locale,
    type: 'article',
  });
}

export default async function ExportCliDumpPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'Guides.exportCliDump',
  });

  return (
    <TutorialLayout
      title={t('title')}
      description={t('description')}
      breadcrumbs={[
        { label: t('breadcrumbs.home'), href: '/' },
        { label: t('breadcrumbs.guides'), href: '/guides' },
        { label: t('breadcrumbs.current') },
      ]}
    >
      {/* 引言 */}
      <div className="prose prose-invert max-w-none mb-8">
        <h2 className="text-2xl font-bold mb-4">{t('intro.title')}</h2>
        <p className="text-gray-300 mb-4">{t('intro.p1')}</p>
        <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
          <li>{t('intro.benefits.backup')}</li>
          <li>{t('intro.benefits.restore')}</li>
          <li>{t('intro.benefits.share')}</li>
          <li>{t('intro.benefits.analyze')}</li>
        </ul>
        <p className="text-gray-300">{t('intro.p2')}</p>
      </div>

      {/* 准备工作 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">
          {t('preparation.title')}
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-white mb-2">
              {t('preparation.software.title')}
            </h3>
            <p className="text-sm text-gray-300 mb-1">
              {t('preparation.software.description')}
            </p>
            <p className="text-sm text-gray-400">
              {t('preparation.software.link')}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">
              {t('preparation.connection.title')}
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              <li>{t('preparation.connection.cable')}</li>
              <li>{t('preparation.connection.driver')}</li>
              <li>{t('preparation.connection.battery')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 什么是 CLI Dump */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">
              {t('what.title')}
            </h2>
            <p className="text-gray-300">{t('what.description')}</p>
          </div>
        </div>
      </div>

      {/* 步骤 1: 连接 Betaflight Configurator */}
      <TutorialStep number={1} title={t('steps.1.title')}>
        <p>{t('steps.1.description')}</p>
        <TutorialImage
          src="fpvtune/guides/cli-dump/step1-cli-tab.png"
          alt={t('steps.1.imageAlt')}
        />
      </TutorialStep>

      {/* 步骤 2: 进入 CLI 标签 */}
      <TutorialStep number={2} title={t('steps.2.title')}>
        <p>{t('steps.2.description')}</p>
        <TutorialImage
          src="fpvtune/guides/cli-dump/step2-save.png"
          alt={t('steps.2.imageAlt')}
        />
      </TutorialStep>

      {/* 步骤 3: 执行 dump 命令 */}
      <TutorialStep number={3} title={t('steps.3.title')}>
        <p>{t('steps.3.description')}</p>

        <div className="bg-black/50 border border-white/10 rounded-lg p-4 my-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">
                {t('steps.3.command')}
              </span>
            </div>
            <Copy className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors" />
          </div>
          <code className="text-gray-300 font-mono">dump</code>
        </div>

        <p className="text-sm text-gray-400">{t('steps.3.note')}</p>
      </TutorialStep>

      {/* 步骤 4: 保存输出 */}
      <TutorialStep number={4} title={t('steps.4.title')}>
        <p>{t('steps.4.description')}</p>

        <ol className="list-decimal list-inside space-y-2 text-gray-300 my-4">
          <li>{t('steps.4.step1')}</li>
          <li>{t('steps.4.step2')}</li>
          <li>{t('steps.4.step3')}</li>
        </ol>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-4">
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-white">
              {t('steps.4.tip.title')}
            </span>{' '}
            {t('steps.4.tip.description')}
          </p>
        </div>
      </TutorialStep>

      {/* 最佳实践 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t('bestPractices.title')}
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-white mb-2">
              {t('bestPractices.backup.title')}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              <li>{t('bestPractices.backup.frequency')}</li>
              <li>{t('bestPractices.backup.naming')}</li>
              <li>{t('bestPractices.backup.storage')}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">
              {t('bestPractices.documentation.title')}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              <li>{t('bestPractices.documentation.notes')}</li>
              <li>{t('bestPractices.documentation.comparison')}</li>
              <li>{t('bestPractices.documentation.testing')}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">
              {t('bestPractices.sharing.title')}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              <li>{t('bestPractices.sharing.community')}</li>
              <li>{t('bestPractices.sharing.privacy')}</li>
              <li>{t('bestPractices.sharing.format')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 下一步 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t('nextSteps.title')}
        </h3>
        <p className="text-gray-300 mb-4">{t('nextSteps.description')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">
              {t('nextSteps.upload.title')}
            </h4>
            <p className="text-sm text-gray-400 mb-2">
              {t('nextSteps.upload.description')}
            </p>
            <a
              href="/tune"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {t('nextSteps.upload.link')} →
            </a>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">
              {t('nextSteps.compare.title')}
            </h4>
            <p className="text-sm text-gray-400 mb-2">
              {t('nextSteps.compare.description')}
            </p>
            <span className="text-sm text-blue-400">
              {t('nextSteps.compare.link')} →
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">
              {t('nextSteps.restore.title')}
            </h4>
            <p className="text-sm text-gray-400 mb-2">
              {t('nextSteps.restore.description')}
            </p>
            <span className="text-sm text-blue-400">
              {t('nextSteps.restore.link')} →
            </span>
          </div>
        </div>
      </div>

      {/* 常见问题 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t('troubleshooting.title')}
        </h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <h4 className="font-semibold text-white mb-1">
                {t(`troubleshooting.q${i}.question` as any)}
              </h4>
              <p className="text-sm text-gray-400">
                {t(`troubleshooting.q${i}.answer` as any)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </TutorialLayout>
  );
}

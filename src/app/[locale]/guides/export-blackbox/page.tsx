import { TutorialImage } from '@/components/guides/tutorial-image';
import { TutorialLayout } from '@/components/guides/tutorial-layout';
import { TutorialStep } from '@/components/guides/tutorial-step';
import { generatePageMetadata } from '@/lib/metadata';
import { AlertCircle, CreditCard, Download, HardDrive } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'Guides.exportBlackbox',
  });

  return generatePageMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    path: `/${locale}/guides/export-blackbox`,
    locale,
    type: 'article',
  });
}

export default async function ExportBlackboxPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'Guides.exportBlackbox',
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
          <li>{t('intro.benefits.tune')}</li>
          <li>{t('intro.benefits.diagnose')}</li>
          <li>{t('intro.benefits.improve')}</li>
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
              {t('preparation.hardware.title')}
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              <li>{t('preparation.hardware.storage')}</li>
              <li>{t('preparation.hardware.enabled')}</li>
              <li>{t('preparation.hardware.space')}</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">
              {t('preparation.cable.title')}
            </h3>
            <p className="text-sm text-gray-300">
              {t('preparation.cable.description')}
            </p>
          </div>
        </div>
      </div>

      {/* 什么是 Blackbox 日志 */}
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

      {/* 步骤 1: 连接飞控 */}
      <TutorialStep number={1} title={t('steps.1.title')}>
        <p>{t('steps.1.description')}</p>
        <TutorialImage
          src="fpvtune/guides/blackbox/step1-connect.png"
          alt={t('steps.1.imageAlt')}
        />
      </TutorialStep>

      {/* 步骤 2: 导出日志文件 */}
      <TutorialStep number={2} title={t('steps.2.title')}>
        <p>{t('steps.2.description')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-green-400" />
              <h4 className="font-semibold">{t('steps.2.sdCard.title')}</h4>
            </div>
            <p className="text-sm text-gray-400">
              {t('steps.2.sdCard.description')}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-5 h-5 text-purple-400" />
              <h4 className="font-semibold">{t('steps.2.onboard.title')}</h4>
            </div>
            <p className="text-sm text-gray-400">
              {t('steps.2.onboard.description')}
            </p>
          </div>
        </div>

        <TutorialImage
          src="fpvtune/guides/blackbox/step3-save.png"
          alt={t('steps.2.imageAlt')}
        />
      </TutorialStep>

      {/* 支持的文件格式 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Download className="w-5 h-5 text-gray-400" />
          {t('formats.title')}
        </h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full" />
            <code className="bg-white/10 px-2 py-1 rounded text-sm">.bbl</code>
            <span className="text-sm text-gray-400">- {t('formats.bbl')}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full" />
            <code className="bg-white/10 px-2 py-1 rounded text-sm">.bfl</code>
            <span className="text-sm text-gray-400">- {t('formats.bfl')}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full" />
            <code className="bg-white/10 px-2 py-1 rounded text-sm">.txt</code>
            <span className="text-sm text-gray-400">- {t('formats.txt')}</span>
          </li>
        </ul>
      </div>

      {/* 最佳实践 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t('bestPractices.title')}
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-white mb-2">
              {t('bestPractices.recording.title')}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              <li>{t('bestPractices.recording.duration')}</li>
              <li>{t('bestPractices.recording.conditions')}</li>
              <li>{t('bestPractices.recording.maneuvers')}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">
              {t('bestPractices.storage.title')}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              <li>{t('bestPractices.storage.sdCard')}</li>
              <li>{t('bestPractices.storage.space')}</li>
              <li>{t('bestPractices.storage.backup')}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">
              {t('bestPractices.analysis.title')}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              <li>{t('bestPractices.analysis.naming')}</li>
              <li>{t('bestPractices.analysis.notes')}</li>
              <li>{t('bestPractices.analysis.multiple')}</li>
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
              {t('nextSteps.viewer.title')}
            </h4>
            <p className="text-sm text-gray-400 mb-2">
              {t('nextSteps.viewer.description')}
            </p>
            <span className="text-sm text-blue-400">
              {t('nextSteps.viewer.link')} →
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">
              {t('nextSteps.learn.title')}
            </h4>
            <p className="text-sm text-gray-400 mb-2">
              {t('nextSteps.learn.description')}
            </p>
            <span className="text-sm text-blue-400">
              {t('nextSteps.learn.link')} →
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
                {t(`troubleshooting.q${i}.question`)}
              </h4>
              <p className="text-sm text-gray-400">
                {t(`troubleshooting.q${i}.answer`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </TutorialLayout>
  );
}

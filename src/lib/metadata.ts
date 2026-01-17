import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fpvtune.com';

interface GenerateMetadataParams {
  title: string;
  description: string;
  path: string;
  locale: string;
  type?: 'website' | 'article';
  images?: string[];
}

/**
 * 生成标准化的页面元数据,包含 canonical URL 和多语言支持
 */
export function generatePageMetadata({
  title,
  description,
  path,
  locale,
  type = 'website',
  images,
}: GenerateMetadataParams): Metadata {
  // 移除路径中的语言前缀,获取规范路径
  const canonicalPath = path.replace(/^\/(zh|en)/, '');
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: canonicalPath,
        zh: `/zh${canonicalPath}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'FPVTune',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type,
      images: images || [`${SITE_URL}/og.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images || [`${SITE_URL}/og.png`],
    },
  };
}

'use client';

import { MDXContent } from '@content-collections/mdx/react';
import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';
import type { ComponentProps } from 'react';

interface CustomMDXContentProps {
  code: string;
  customComponents?: Record<string, any>;
  includeFumadocsComponents?: boolean;
}

/**
 * Enhanced MDX Content component that includes commonly used MDX components
 * It can be used for blog posts, documentation, and custom pages
 */
export function CustomMDXContent({
  code,
  customComponents = {},
}: CustomMDXContentProps) {
  // Simple components for blog posts
  const baseComponents: Record<string, any> = {
    img: (props: ComponentProps<'img'>) => {
      if (!props.src) {
        return null;
      }
      return (
        <Image
          src={props.src}
          alt={props.alt || 'image'}
          width={1400}
          height={787}
          style={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
      );
    },
    ...customComponents,
  };

  return (
    <MDXContent code={code} components={baseComponents as MDXComponents} />
  );
}

'use client';

import { websiteConfig } from '@/config/website';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const logoLight = websiteConfig.metadata.images?.logoLight ?? '/logo.png';
  const logoDark = websiteConfig.metadata.images?.logoDark ?? logoLight;

  // During server-side rendering and initial client render, always use logoLight
  // This prevents hydration mismatch
  const logo = mounted && theme === 'dark' ? logoDark : logoLight;

  // Only show theme-dependent UI after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use square icon for sidebar/compact views
  if (iconOnly) {
    return (
      <Image
        src="/android-chrome-192x192.png"
        alt="Logo"
        title="Logo"
        width={192}
        height={192}
        className={cn('size-5 rounded-md', className)}
      />
    );
  }

  // Use full horizontal logo
  return (
    <Image
      src={logo}
      alt="Logo"
      title="Logo"
      width={480}
      height={80}
      className={cn('h-5 w-auto', className)}
    />
  );
}

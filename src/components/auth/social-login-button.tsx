'use client';

import { DividerWithText } from '@/components/auth/divider-with-text';
import { GitHubIcon } from '@/components/icons/github';
import { GoogleIcon } from '@/components/icons/google';
import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { getUrlWithLocaleInCallbackUrl } from '@/lib/urls/urls';
import { DEFAULT_LOGIN_REDIRECT, Routes } from '@/routes';
import { Loader2Icon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface SocialLoginButtonProps {
  callbackUrl?: string;
}

/**
 * social login buttons
 */
export function SocialLoginButton({
  callbackUrl: propCallbackUrl,
}: SocialLoginButtonProps) {
  const t = useTranslations('AuthPage.login');
  const searchParams = useSearchParams();
  const paramCallbackUrl = searchParams.get('callbackUrl');
  const locale = useLocale();
  const defaultCallbackUrl = getUrlWithLocaleInCallbackUrl(
    DEFAULT_LOGIN_REDIRECT,
    locale
  );
  const callbackUrl = propCallbackUrl || paramCallbackUrl || defaultCallbackUrl;
  const [isLoading, setIsLoading] = useState<'google' | 'github' | null>(null);

  if (
    !websiteConfig.auth.enableGoogleLogin &&
    !websiteConfig.auth.enableGithubLogin
  ) {
    return null;
  }

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsLoading(provider);
    try {
      // Directly call the API instead of using authClient to ensure redirect works
      const response = await fetch('/api/auth/sign-in/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          callbackURL: callbackUrl,
          errorCallbackURL: Routes.AuthError,
        }),
      });
      const data = await response.json();

      if (data.url) {
        // Use location.assign for more reliable cross-origin redirect
        window.location.assign(data.url);
      } else {
        console.error('No redirect URL in response:', data);
        setIsLoading(null);
      }
    } catch (error) {
      console.error('Social login error:', error);
      setIsLoading(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <DividerWithText text={t('or')} />
      {websiteConfig.auth.enableGoogleLogin && (
        <Button
          size="lg"
          className="w-full cursor-pointer"
          variant="outline"
          disabled={isLoading === 'google'}
          onClick={() => handleSocialLogin('google')}
        >
          {isLoading === 'google' ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : (
            <GoogleIcon className="size-4 mr-2" />
          )}
          <span>{t('signInWithGoogle')}</span>
        </Button>
      )}
      {websiteConfig.auth.enableGithubLogin && (
        <Button
          size="lg"
          className="w-full cursor-pointer"
          variant="outline"
          disabled={isLoading === 'github'}
          onClick={() => handleSocialLogin('github')}
        >
          {isLoading === 'github' ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : (
            <GitHubIcon className="size-4 mr-2" />
          )}
          <span>{t('signInWithGitHub')}</span>
        </Button>
      )}
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface LogoMarqueeProps {
  logos: { name: string; url: string; icon?: string }[];
  direction?: 'left' | 'right';
  speed?: number;
}

export function LogoMarquee({
  logos,
  direction = 'left',
  speed = 30,
}: LogoMarqueeProps) {
  const duplicatedLogos = [...logos, ...logos];

  return (
    <div className="relative flex overflow-hidden">
      <div
        className={cn(
          'flex shrink-0 items-center gap-16',
          direction === 'left'
            ? 'animate-marquee-left'
            : 'animate-marquee-right'
        )}
        style={{ '--duration': `${speed}s` } as React.CSSProperties}
      >
        {duplicatedLogos.map((logo, index) => (
          <a
            key={`${logo.name}-${index}`}
            href={logo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-3 text-gray-800 transition-opacity hover:opacity-70"
          >
            <LogoIcon name={logo.name} />
            <span className="text-xl font-semibold tracking-tight">
              {logo.name}
            </span>
          </a>
        ))}
      </div>
      <div
        className={cn(
          'flex shrink-0 items-center gap-16',
          direction === 'left'
            ? 'animate-marquee-left'
            : 'animate-marquee-right'
        )}
        style={{ '--duration': `${speed}s` } as React.CSSProperties}
        aria-hidden="true"
      >
        {duplicatedLogos.map((logo, index) => (
          <a
            key={`${logo.name}-dup-${index}`}
            href={logo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-3 text-gray-800 transition-opacity hover:opacity-70"
          >
            <LogoIcon name={logo.name} />
            <span className="text-xl font-semibold tracking-tight">
              {logo.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function LogoIcon({ name }: { name: string }) {
  const iconClass = 'h-8 w-8';

  switch (name) {
    case 'GitHub':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      );
    case 'VS Code':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z" />
        </svg>
      );
    case 'Cursor':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <rect width="24" height="24" rx="6" />
          <path
            d="M7 17L17 7M17 7H9M17 7V15"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'Claude':
    case 'Claude Code':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'Goose':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      );
    case 'Amp':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.768 14.64l-4.616-4.616L6.536 16.64l-.884-.884 4.616-4.616-4.616-4.616.884-.884 4.616 4.616 4.616-4.616.884.884-4.616 4.616 4.616 4.616-.884.884z" />
        </svg>
      );
    case 'Gemini CLI':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.08 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" />
        </svg>
      );
    case 'OpenAI Codex':
    case 'Codex':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M8 12h8M12 8v8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'Factory':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 22H2V10l7-3v3l7-3v3l6-3v15zM4 20h16v-8.97l-4 2V10l-7 3V10l-5 2.14V20z" />
        </svg>
      );
    case 'Letta':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="3"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path d="M8 8h8v2H8zM8 12h5v2H8z" fill="currentColor" />
        </svg>
      );
    case 'OpenCode':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
        </svg>
      );
    default:
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white">
          <span className="text-sm font-bold">{name.charAt(0)}</span>
        </div>
      );
  }
}

const row1Logos = [
  { name: 'Betaflight', url: 'https://betaflight.com/' },
  { name: 'INAV', url: 'https://github.com/iNavFlight/inav' },
  { name: 'DJI FPV', url: 'https://www.dji.com/fpv' },
  { name: 'HDZero', url: 'https://www.hdzero.com/' },
  { name: 'Walksnail', url: 'https://caddxfpv.com/' },
  { name: 'TBS', url: 'https://www.team-blacksheep.com/' },
];

const row2Logos = [
  { name: 'SpeedyBee', url: 'https://www.speedybee.com/' },
  { name: 'iFlight', url: 'https://www.iflight-rc.com/' },
  { name: 'GEPRC', url: 'https://geprc.com/' },
  { name: 'BetaFPV', url: 'https://betafpv.com/' },
  { name: 'Foxeer', url: 'https://www.foxeer.com/' },
  { name: 'RunCam', url: 'https://runcam.com/' },
];

export function AdoptionSection() {
  const t = useTranslations('TunePage.adoption');

  return (
    <section className="border-t border-gray-200/60 bg-[#f5f5f0] py-20">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <h2 className="mb-3 text-3xl font-bold text-gray-900">{t('title')}</h2>
        <p className="mb-12 text-gray-500">{t('description')}</p>
      </div>
      <div className="space-y-8 overflow-hidden">
        <LogoMarquee logos={row1Logos} direction="left" speed={35} />
        <LogoMarquee logos={row2Logos} direction="right" speed={40} />
      </div>
    </section>
  );
}

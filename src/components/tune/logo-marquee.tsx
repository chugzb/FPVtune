'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface LogoMarqueeProps {
  logos: { name: string; url: string }[];
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
          'flex shrink-0 items-center gap-20',
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
            className="flex shrink-0 items-center text-gray-600 transition-colors hover:text-gray-900"
          >
            <span className="text-2xl font-bold tracking-tight">
              {logo.name}
            </span>
          </a>
        ))}
      </div>
      <div
        className={cn(
          'flex shrink-0 items-center gap-20',
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
            className="flex shrink-0 items-center text-gray-600 transition-colors hover:text-gray-900"
          >
            <span className="text-2xl font-bold tracking-tight">
              {logo.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

const row1Logos = [
  { name: 'Betaflight', url: 'https://betaflight.com/' },
  { name: 'INAV', url: 'https://github.com/iNavFlight/inav' },
  { name: 'HDZero', url: 'https://www.hdzero.com/' },
  { name: 'Walksnail', url: 'https://caddxfpv.com/' },
  { name: 'TBS', url: 'https://www.team-blacksheep.com/' },
  { name: 'ExpressLRS', url: 'https://www.expresslrs.org/' },
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

import { FPVtuneHome } from '@/components/home/fpvtune-home';
import { getBaseUrl } from '@/lib/urls/urls';
import type { Metadata } from 'next';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'Betaflight PID Tuning - Smart Blackbox Analyzer | FPVtune',
  description:
    'Neural network-powered Betaflight PID tuning tool. Upload blackbox logs, get optimized PID settings instantly. Eliminate prop wash, reduce noise. Start free.',
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    title: 'Betaflight PID Tuning - Smart Blackbox Analyzer | FPVtune',
    description:
      'Neural network-powered Betaflight PID tuning tool. Upload blackbox logs, get optimized PID settings instantly. Eliminate prop wash, reduce noise. Start free.',
    siteName: 'FPVtune',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Betaflight PID Tuning - Smart Blackbox Analyzer | FPVtune',
    description:
      'Neural network-powered Betaflight PID tuning tool. Upload blackbox logs, get optimized PID settings instantly. Eliminate prop wash, reduce noise. Start free.',
  },
};

export default function HomePage() {
  return <FPVtuneHome />;
}

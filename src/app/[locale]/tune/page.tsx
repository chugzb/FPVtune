import { TuneWizard } from '@/components/tune/tune-wizard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Start Tuning - FPVtune | AI Betaflight PID Tuning',
  description:
    'Upload your Betaflight blackbox log and get AI-optimized PID settings in seconds. Pay only when satisfied with results.',
};

export default function TunePage() {
  return <TuneWizard />;
}

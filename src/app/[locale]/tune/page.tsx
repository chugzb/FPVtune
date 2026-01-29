import { TuneWizard } from '@/components/tune/tune-wizard';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Start Tuning - FPVtune | Neural Network Betaflight PID Tuning',
  description:
    'Upload your Betaflight blackbox log and get neural network-optimized PID settings in seconds. Pay only when satisfied with results.',
};

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#030304] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );
}

export default function TunePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TuneWizard />
    </Suspense>
  );
}

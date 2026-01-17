import { MarketingFooter } from '@/components/layout/marketing-footer';
import { MarketingNavbar } from '@/components/layout/marketing-navbar';
import type { ReactNode } from 'react';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#030304]">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}

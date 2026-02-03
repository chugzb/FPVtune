import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { FpvStatsCards } from '@/components/dashboard/fpv-stats-cards';
import { FpvOrdersTable } from '@/components/dashboard/fpv-orders-table';
import { FpvQuickActions } from '@/components/dashboard/fpv-quick-actions';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations();

  const breadcrumbs = [
    {
      label: t('Dashboard.dashboard.title'),
      isCurrentPage: true,
    },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-6 py-4 md:py-6">
            <FpvStatsCards />
            <FpvQuickActions />
            <FpvOrdersTable />
          </div>
        </div>
      </div>
    </>
  );
}

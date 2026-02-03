'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  DollarSign,
  CheckCircle,
  Ticket,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

interface Stats {
  totalOrders: number;
  todayOrders: number;
  completedOrders: number;
  totalRevenue: number;
  promoOrders: number;
  activePromoCodes: number;
  completionRate: number;
}

export function FpvStatsCards() {
  const locale = useLocale();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 px-4 lg:px-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: locale === 'zh' ? '总订单' : 'Total Orders',
      value: stats?.totalOrders || 0,
      description: locale === 'zh' ? `今日 +${stats?.todayOrders || 0}` : `Today +${stats?.todayOrders || 0}`,
      icon: ShoppingCart,
    },
    {
      title: locale === 'zh' ? '总收入' : 'Revenue',
      value: `$${(stats?.totalRevenue || 0).toFixed(2)}`,
      description: locale === 'zh' ? '付费订单收入' : 'Paid orders revenue',
      icon: DollarSign,
    },
    {
      title: locale === 'zh' ? '完成率' : 'Completion',
      value: `${stats?.completionRate || 0}%`,
      description: locale === 'zh' ? `${stats?.completedOrders || 0} 个已完成` : `${stats?.completedOrders || 0} completed`,
      icon: CheckCircle,
    },
    {
      title: locale === 'zh' ? '测试码订单' : 'Promo Orders',
      value: stats?.promoOrders || 0,
      description: locale === 'zh' ? `${stats?.activePromoCodes || 0} 个活跃码` : `${stats?.activePromoCodes || 0} active codes`,
      icon: Ticket,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 px-4 lg:px-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

'use client';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { ExternalLink, FileText, Rocket } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  flyingStyle: string | null;
  frameSize: string | null;
  amount: number | null;
  currency: string;
  promoCodeId: string | null;
  resultUrl: string | null;
  pdfUrl: string | null;
  createdAt: string;
  completedAt: string | null;
}

const statusMap: Record<string, { label: string; labelEn: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '待支付', labelEn: 'Pending', variant: 'outline' },
  paid: { label: '已支付', labelEn: 'Paid', variant: 'secondary' },
  processing: { label: '处理中', labelEn: 'Processing', variant: 'default' },
  completed: { label: '已完成', labelEn: 'Completed', variant: 'default' },
  failed: { label: '失败', labelEn: 'Failed', variant: 'destructive' },
};

const flyingStyleMap: Record<string, { zh: string; en: string }> = {
  freestyle: { zh: '花飞', en: 'Freestyle' },
  racing: { zh: '竞速', en: 'Racing' },
  longrange: { zh: '远航', en: 'Long Range' },
  cinematic: { zh: '航拍', en: 'Cinematic' },
};

const frameSizeMap: Record<string, string> = {
  inch2_3: '2-3"',
  inch5: '5"',
  inch7: '7"',
  inch10: '10"+',
};

export default function OrdersPage() {
  const t = useTranslations('Dashboard.settings.orders');
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const breadcrumbs = [
    { label: locale === 'zh' ? '设置' : 'Settings' },
    { label: t('title'), isCurrentPage: true },
  ];

  useEffect(() => {
    fetch('/api/user/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{locale === 'zh' ? '订单历史' : 'Order History'}</CardTitle>
            <CardDescription>
              {locale === 'zh' ? '您的所有调参订单' : 'All your tuning orders'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Rocket className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{t('empty')}</p>
                <p className="text-muted-foreground mb-4">{t('emptyHint')}</p>
                <Link href="/tune">
                  <Button>
                    <Rocket className="mr-2 h-4 w-4" />
                    {locale === 'zh' ? '开始调参' : 'Start Tuning'}
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === 'zh' ? '订单号' : 'Order'}</TableHead>
                    <TableHead>{locale === 'zh' ? '飞行风格' : 'Style'}</TableHead>
                    <TableHead>{locale === 'zh' ? '机架' : 'Frame'}</TableHead>
                    <TableHead>{locale === 'zh' ? '金额' : 'Amount'}</TableHead>
                    <TableHead>{locale === 'zh' ? '状态' : 'Status'}</TableHead>
                    <TableHead>{locale === 'zh' ? '时间' : 'Time'}</TableHead>
                    <TableHead>{locale === 'zh' ? '操作' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const status = statusMap[order.status] || { label: order.status, labelEn: order.status, variant: 'outline' as const };
                    const isPromo = !!order.promoCodeId;
                    const style = order.flyingStyle ? flyingStyleMap[order.flyingStyle] : null;
                    const frame = order.frameSize ? frameSizeMap[order.frameSize] : null;

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          {order.orderNumber.slice(0, 12)}...
                        </TableCell>
                        <TableCell>
                          {style ? (locale === 'zh' ? style.zh : style.en) : '-'}
                        </TableCell>
                        <TableCell>{frame || '-'}</TableCell>
                        <TableCell>
                          {isPromo ? (
                            <Badge variant="secondary">{locale === 'zh' ? '测试码' : 'Promo'}</Badge>
                          ) : order.amount ? (
                            `$${(order.amount / 100).toFixed(2)}`
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {locale === 'zh' ? status.label : status.labelEn}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(order.createdAt), {
                            addSuffix: true,
                            locale: locale === 'zh' ? zhCN : enUS,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {order.resultUrl && (
                              <Link href={order.resultUrl} target="_blank">
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            {order.pdfUrl && (
                              <Link href={order.pdfUrl} target="_blank">
                                <Button variant="ghost" size="sm">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

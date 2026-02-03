'use client';

import { Badge } from '@/components/ui/badge';
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
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  status: string;
  amount: number | null;
  currency: string;
  flyingStyle: string | null;
  frameSize: string | null;
  promoCodeId: string | null;
  createdAt: string;
  completedAt: string | null;
}

const statusMap: Record<string, { zh: string; en: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { zh: '待支付', en: 'Pending', variant: 'outline' },
  paid: { zh: '已支付', en: 'Paid', variant: 'secondary' },
  processing: { zh: '处理中', en: 'Processing', variant: 'default' },
  completed: { zh: '已完成', en: 'Completed', variant: 'default' },
  failed: { zh: '失败', en: 'Failed', variant: 'destructive' },
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


export function FpvOrdersTable() {
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="mx-4 lg:mx-6">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader>
        <CardTitle>{locale === 'zh' ? '最近订单' : 'Recent Orders'}</CardTitle>
        <CardDescription>{locale === 'zh' ? '最近 20 个调参订单' : 'Last 20 tuning orders'}</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {locale === 'zh' ? '暂无订单数据' : 'No orders yet'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{locale === 'zh' ? '订单号' : 'Order'}</TableHead>
                <TableHead>{locale === 'zh' ? '邮箱' : 'Email'}</TableHead>
                <TableHead>{locale === 'zh' ? '飞行风格' : 'Style'}</TableHead>
                <TableHead>{locale === 'zh' ? '机架' : 'Frame'}</TableHead>
                <TableHead>{locale === 'zh' ? '金额' : 'Amount'}</TableHead>
                <TableHead>{locale === 'zh' ? '状态' : 'Status'}</TableHead>
                <TableHead>{locale === 'zh' ? '时间' : 'Time'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const status = statusMap[order.status] || { zh: order.status, en: order.status, variant: 'outline' as const };
                const isPromo = !!order.promoCodeId;
                const style = order.flyingStyle ? flyingStyleMap[order.flyingStyle] : null;
                const frame = order.frameSize ? frameSizeMap[order.frameSize] : null;

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.orderNumber.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {order.customerEmail}
                    </TableCell>
                    <TableCell>
                      {style ? (locale === 'zh' ? style.zh : style.en) : '-'}
                    </TableCell>
                    <TableCell>{frame || '-'}</TableCell>
                    <TableCell>
                      {isPromo ? (
                        <Badge variant="secondary">{locale === 'zh' ? '测试码' : 'Promo'}</Badge>
                      ) : order.amount ? (
                        `${(order.amount / 100).toFixed(2)}`
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {locale === 'zh' ? status.zh : status.en}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(order.createdAt), {
                        addSuffix: true,
                        locale: locale === 'zh' ? zhCN : enUS,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, ClipboardList, FileText, Settings } from 'lucide-react';
import { useLocale } from 'next-intl';
import Link from 'next/link';

export function FpvQuickActions() {
  const locale = useLocale();

  const actions = [
    {
      title: locale === 'zh' ? '开始调参' : 'Start Tuning',
      description: locale === 'zh' ? '上传黑盒日志获取 AI 调参建议' : 'Upload blackbox logs for AI tuning',
      icon: Rocket,
      href: '/tune',
      variant: 'default' as const,
    },
    {
      title: locale === 'zh' ? '我的订单' : 'My Orders',
      description: locale === 'zh' ? '查看调参订单历史' : 'View tuning order history',
      icon: ClipboardList,
      href: '/settings/orders',
      variant: 'outline' as const,
    },
    {
      title: locale === 'zh' ? '查看教程' : 'View Guides',
      description: locale === 'zh' ? '学习 PID 调参知识' : 'Learn PID tuning',
      icon: FileText,
      href: '/guides',
      variant: 'outline' as const,
    },
    {
      title: locale === 'zh' ? '账户设置' : 'Account Settings',
      description: locale === 'zh' ? '管理个人信息' : 'Manage profile',
      icon: Settings,
      href: '/settings/profile',
      variant: 'outline' as const,
    },
  ];

  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader>
        <CardTitle>{locale === 'zh' ? '快捷操作' : 'Quick Actions'}</CardTitle>
        <CardDescription>{locale === 'zh' ? '常用功能入口' : 'Common features'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Button
                variant={action.variant}
                className="w-full h-auto flex-col items-start gap-2 p-4"
              >
                <div className="flex items-center gap-2">
                  <action.icon className="h-4 w-4" />
                  <span className="font-medium">{action.title}</span>
                </div>
                <span className="text-xs text-muted-foreground font-normal">
                  {action.description}
                </span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

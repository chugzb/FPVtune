'use client';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { Copy, Loader2, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

interface PromoCode {
  id: string;
  code: string;
  type: 'single' | 'unlimited' | 'limited';
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  note: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function PromoCodesPage() {
  const t = useTranslations();
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 创建表单
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'single' | 'unlimited' | 'limited'>('single');
  const [newMaxUses, setNewMaxUses] = useState('1');
  const [newValidDays, setNewValidDays] = useState('');
  const [newNote, setNewNote] = useState('');

  const breadcrumbs = [
    { label: t('Dashboard.admin.title'), isCurrentPage: false },
    { label: t('Dashboard.settings.promo.title'), isCurrentPage: true },
  ];

  // admin 用户自动认证
  useEffect(() => {
    if (isAdmin && !isAuthenticated) {
      setIsAuthenticated(true);
    }
  }, [isAdmin, isAuthenticated]);

  const fetchCodes = useCallback(async () => {
    // admin 用户不需要 adminKey
    if (!isAdmin && !adminKey) return;

    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (!isAdmin) {
        headers['x-admin-key'] = adminKey;
      }

      const response = await fetch('/api/promo', {
        headers,
        credentials: 'include', // 包含 session cookie
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('管理员密钥无效');
          setIsAuthenticated(false);
          return;
        }
        throw new Error('加载失败');
      }

      const data = await response.json();
      setCodes(data.codes || []);
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [adminKey, isAdmin]);

  // admin 用户自动加载数据
  useEffect(() => {
    if (isAuthenticated) {
      fetchCodes();
    }
  }, [isAuthenticated, fetchCodes]);

  const handleAuth = () => {
    if (adminKey.trim()) {
      fetchCodes();
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          code: newCode || undefined,
          type: newType,
          maxUses: newType === 'limited' ? parseInt(newMaxUses, 10) : undefined,
          validDays: newValidDays ? parseInt(newValidDays, 10) : undefined,
          note: newNote || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '创建失败');
      }

      // 重置表单
      setNewCode('');
      setNewType('single');
      setNewMaxUses('1');
      setNewValidDays('');
      setNewNote('');

      // 刷新列表
      fetchCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要禁用此测试码吗？')) return;

    try {
      const response = await fetch(`/api/promo?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      fetchCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'single': return '一次性';
      case 'unlimited': return '永久';
      case 'limited': return '限次';
      default: return type;
    }
  };

  // 未认证时显示登录表单
  if (!isAuthenticated) {
    return (
      <>
        <DashboardHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold">测试码管理</h2>
              <p className="text-muted-foreground mt-2">请输入管理员密钥</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-key">管理员密钥</Label>
                <Input
                  id="admin-key"
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="输入 ADMIN_API_KEY"
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button onClick={handleAuth} className="w-full" disabled={!adminKey.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                验证
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* 创建表单 */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">创建测试码</h3>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="code">自定义码（可选）</Label>
              <Input
                id="code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="留空自动生成"
              />
            </div>

            <div>
              <Label htmlFor="type">类型</Label>
              <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">一次性</SelectItem>
                  <SelectItem value="unlimited">永久</SelectItem>
                  <SelectItem value="limited">限次</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newType === 'limited' && (
              <div>
                <Label htmlFor="maxUses">最大使用次数</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  value={newMaxUses}
                  onChange={(e) => setNewMaxUses(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="validDays">有效天数（可选）</Label>
              <Input
                id="validDays"
                type="number"
                min="1"
                value={newValidDays}
                onChange={(e) => setNewValidDays(e.target.value)}
                placeholder="留空永久有效"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="note">备注（可选）</Label>
              <Input
                id="note"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="例如：给测试用户 A"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 mt-4">{error}</p>
          )}

          <Button onClick={handleCreate} disabled={creating} className="mt-4">
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            创建测试码
          </Button>
        </div>

        {/* 测试码列表 */}
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">测试码列表</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              暂无测试码
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>测试码</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>使用情况</TableHead>
                  <TableHead>有效期</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {code.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeLabel(code.type)}</TableCell>
                    <TableCell>
                      {code.type === 'unlimited'
                        ? `${code.usedCount} 次`
                        : `${code.usedCount} / ${code.maxUses || 1}`
                      }
                    </TableCell>
                    <TableCell>
                      {code.validUntil ? formatDate(code.validUntil) : '永久'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {code.note || '-'}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs',
                        code.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      )}>
                        {code.isActive ? '有效' : '已禁用'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {code.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(code.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </>
  );
}

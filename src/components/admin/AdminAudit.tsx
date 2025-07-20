import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Activity, Users, Database, Calendar, Eye, Filter, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  action: string;
  table_name: string;
  record_id: number;
  old_values: any;
  new_values: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface AuditStats {
  total: number;
  actionStats: Array<{action: string; count: number}>;
  tableStats: Array<{table_name: string; count: number}>;
  userStats: Array<{name: string; email: string; count: number}>;
  dailyActivity: Array<{date: string; count: number}>;
}

export function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    tableName: '',
    action: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAuditData();
  }, [filters, pagination.page]);

  useEffect(() => {
    loadAuditStats();
  }, []);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
      });

      const response = await api.getAuditLogs();
      setLogs((response || []).map(log => ({
        id: parseInt(log.id),
        user_id: parseInt(log.user_id || '0'),
        user_name: 'Пользователь',
        user_email: '',
        action: log.action,
        table_name: log.table_name,
        record_id: parseInt(log.record_id),
        old_values: log.old_values,
        new_values: log.new_values,
        ip_address: '127.0.0.1',
        user_agent: 'System',
        created_at: log.timestamp
      })));
      setPagination(prev => ({
        ...prev,
        total: response.length || 0,
        pages: Math.ceil((response.length || 0) / pagination.limit)
      }));
    } catch (error) {
      console.error('Error loading audit data:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные аудита",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAuditStats = async () => {
    try {
      const response = await api.getAuditStats();
      setStats({
        total: response.total,
        actionStats: [
          { action: 'INSERT', count: response.inserts },
          { action: 'UPDATE', count: response.updates },
          { action: 'DELETE', count: response.deletes }
        ],
        tableStats: [],
        userStats: [],
        dailyActivity: []
      });
    } catch (error) {
      console.error('Error loading audit stats:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      userId: '',
      tableName: '',
      action: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  const formatJsonData = (data: any) => {
    if (!data) return 'Нет данных';
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return JSON.stringify(data, null, 2);
    }
  };

  const showLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  if (loading && !logs.length) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Аудит системы</h1>
          <p className="text-muted-foreground">Журнал действий пользователей и статистика</p>
        </div>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs">
            <Activity className="w-4 h-4 mr-2" />
            Журнал аудита
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="w-4 h-4 mr-2" />
            Статистика
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Журнал аудита</CardTitle>
              <CardDescription>Все действия пользователей в системе</CardDescription>
              
              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
                <div>
                  <Label htmlFor="startDate">Дата с</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Дата до</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="action">Действие</Label>
                  <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все действия" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все действия</SelectItem>
                      <SelectItem value="CREATE">Создание</SelectItem>
                      <SelectItem value="UPDATE">Обновление</SelectItem>
                      <SelectItem value="DELETE">Удаление</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tableName">Таблица</Label>
                  <Select value={filters.tableName} onValueChange={(value) => handleFilterChange('tableName', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все таблицы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все таблицы</SelectItem>
                      <SelectItem value="bookings">Бронирования</SelectItem>
                      <SelectItem value="clients">Клиенты</SelectItem>
                      <SelectItem value="accommodation_types">Типы размещения</SelectItem>
                      <SelectItem value="accounting_entries">Проводки</SelectItem>
                      <SelectItem value="accounts">Счета</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters}>
                    <Filter className="w-4 h-4 mr-2" />
                    Сбросить
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата/Время</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Действие</TableHead>
                      <TableHead>Таблица</TableHead>
                      <TableHead>ID записи</TableHead>
                      <TableHead>IP адрес</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(log.created_at).toLocaleDateString('ru-RU')}</div>
                            <div className="text-muted-foreground">
                              {new Date(log.created_at).toLocaleTimeString('ru-RU')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{log.user_name || 'Система'}</div>
                            <div className="text-muted-foreground">{log.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.table_name}</Badge>
                        </TableCell>
                        <TableCell>#{log.record_id}</TableCell>
                        <TableCell className="text-sm font-mono">{log.ip_address}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => showLogDetails(log)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Показано {logs.length} из {pagination.total} записей
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Назад
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Далее
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          {stats && (
            <div className="grid gap-6">
              {/* Overview Cards */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Всего действий</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Активных пользователей</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.userStats.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Контролируемых таблиц</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.tableStats.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Дней активности</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.dailyActivity.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Действия по типам</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.actionStats.map((item) => (
                        <div key={item.action} className="flex justify-between items-center">
                          <Badge variant={getActionBadgeVariant(item.action)}>
                            {item.action}
                          </Badge>
                          <span className="font-medium">{item.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Активность по таблицам</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.tableStats.map((item) => (
                        <div key={item.table_name} className="flex justify-between items-center">
                          <Badge variant="outline">{item.table_name}</Badge>
                          <span className="font-medium">{item.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Топ пользователей</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.userStats.slice(0, 10).map((item) => (
                        <div key={item.email} className="flex justify-between items-center">
                          <div className="text-sm">
                            <div className="font-medium">{item.name || 'Без имени'}</div>
                            <div className="text-muted-foreground">{item.email}</div>
                          </div>
                          <span className="font-medium">{item.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Log Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали действия аудита</DialogTitle>
            <DialogDescription>
              Подробная информация о действии пользователя
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Пользователь</Label>
                  <div className="text-sm">
                    <div>{selectedLog.user_name || 'Система'}</div>
                    <div className="text-muted-foreground">{selectedLog.user_email}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Действие</Label>
                  <div>
                    <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                      {selectedLog.action}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Таблица</Label>
                  <div>
                    <Badge variant="outline">{selectedLog.table_name}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">ID записи</Label>
                  <div className="text-sm">#{selectedLog.record_id}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP адрес</Label>
                  <div className="text-sm font-mono">{selectedLog.ip_address}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Дата/Время</Label>
                  <div className="text-sm">
                    {new Date(selectedLog.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
              </div>

              {selectedLog.old_values && (
                <div>
                  <Label className="text-sm font-medium">Старые значения</Label>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                    {formatJsonData(selectedLog.old_values)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <Label className="text-sm font-medium">Новые значения</Label>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                    {formatJsonData(selectedLog.new_values)}
                  </pre>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <Label className="text-sm font-medium">User Agent</Label>
                  <div className="text-xs text-muted-foreground break-all">
                    {selectedLog.user_agent}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
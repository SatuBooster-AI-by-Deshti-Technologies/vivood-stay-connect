import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Calculator, TrendingUp, TrendingDown, FileText, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface AccountingEntry {
  id: number;
  entry_date: string;
  account: string;
  account_name: string;
  description: string;
  debit: number;
  credit: number;
  booking_id?: number;
  booking_number?: number;
  created_by_name?: string;
  created_at: string;
}

interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  is_active: boolean;
}

interface TrialBalance {
  account: string;
  account_name: string;
  account_type: string;
  total_debit: number;
  total_credit: number;
  balance: number;
}

interface ProfitLoss {
  revenue: Array<{account: string; account_name: string; amount: number}>;
  expenses: Array<{account: string; account_name: string; amount: number}>;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export function AdminAccounting() {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalance[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLoss | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountingEntry | null>(null);
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    account: '',
    description: '',
    debit: '',
    credit: '',
    booking_id: ''
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    account: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesData, accountsData, trialBalanceData, profitLossData] = await Promise.all([
        api.getAccountingEntries(),
        api.getAccounts(),
        api.getTrialBalance(),
        api.getProfitLoss()
      ]);
      
      setEntries((entriesData || []).map(entry => ({
        id: parseInt(entry.id),
        entry_date: entry.date,
        account: entry.debit_account,
        account_name: entry.debit_account,
        description: entry.description,
        debit: parseFloat(entry.amount.toString()),
        credit: 0,
        created_at: entry.created_at
      })));
      setAccounts((accountsData || []).map(acc => ({
        id: parseInt(acc.id),
        account_code: acc.code,
        account_name: acc.name,
        account_type: acc.account_type,
        is_active: acc.is_active
      })));
      setTrialBalance((trialBalanceData || []).map(tb => ({
        account: tb.account,
        account_name: tb.account,
        account_type: 'unknown',
        total_debit: tb.debit,
        total_credit: tb.credit,
        balance: tb.debit - tb.credit
      })));
      setProfitLoss(profitLossData ? {
        revenue: [],
        expenses: [],
        totalRevenue: profitLossData.revenue,
        totalExpenses: profitLossData.expenses,
        netIncome: profitLossData.profit
      } : null);
    } catch (error) {
      console.error('Error loading accounting data:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные бухгалтерии",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that either debit or credit is filled, but not both
    const debitValue = parseFloat(formData.debit) || 0;
    const creditValue = parseFloat(formData.credit) || 0;
    
    if ((debitValue > 0 && creditValue > 0) || (debitValue === 0 && creditValue === 0)) {
      toast({
        title: "Ошибка валидации",
        description: "Заполните либо дебет, либо кредит, но не оба поля одновременно",
        variant: "destructive"
      });
      return;
    }

    try {
      const payload = {
        ...formData,
        debit: debitValue,
        credit: creditValue,
        booking_id: formData.booking_id ? parseInt(formData.booking_id) : null
      };

      if (editingEntry) {
        await api.updateAccountingEntry(editingEntry.id.toString(), payload);
        toast({
          title: "Успех",
          description: "Проводка обновлена"
        });
      } else {
        await api.createAccountingEntry(payload);
        toast({
          title: "Успех",
          description: "Проводка создана"
        });
      }

      setIsDialogOpen(false);
      setEditingEntry(null);
      setFormData({
        entry_date: new Date().toISOString().split('T')[0],
        account: '',
        description: '',
        debit: '',
        credit: '',
        booking_id: ''
      });
      loadData();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить проводку",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (entry: AccountingEntry) => {
    setEditingEntry(entry);
    setFormData({
      entry_date: entry.entry_date,
      account: entry.account,
      description: entry.description,
      debit: entry.debit.toString(),
      credit: entry.credit.toString(),
      booking_id: entry.booking_id?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту проводку?')) return;
    
    try {
      await api.deleteAccountingEntry(id.toString());
      toast({
        title: "Успех",
        description: "Проводка удалена"
      });
      loadData();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить проводку",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₸';
  };

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Бухгалтерский учет</h1>
          <p className="text-muted-foreground">Управление финансовой отчетностью</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingEntry(null);
              setFormData({
                entry_date: new Date().toISOString().split('T')[0],
                account: '',
                description: '',
                debit: '',
                credit: '',
                booking_id: ''
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Новая проводка
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Редактировать проводку' : 'Новая проводка'}
              </DialogTitle>
              <DialogDescription>
                Создайте или отредактируйте бухгалтерскую проводку
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entry_date">Дата</Label>
                  <Input
                    id="entry_date"
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, entry_date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="account">Счет</Label>
                  <Select value={formData.account} onValueChange={(value) => setFormData(prev => ({ ...prev, account: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите счет" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.account_code}>
                          {account.account_code} - {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Описание</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Описание операции"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="debit">Дебет</Label>
                  <Input
                    id="debit"
                    type="number"
                    step="0.01"
                    value={formData.debit}
                    onChange={(e) => setFormData(prev => ({ ...prev, debit: e.target.value, credit: e.target.value ? '' : prev.credit }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="credit">Кредит</Label>
                  <Input
                    id="credit"
                    type="number"
                    step="0.01"
                    value={formData.credit}
                    onChange={(e) => setFormData(prev => ({ ...prev, credit: e.target.value, debit: e.target.value ? '' : prev.debit }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="booking_id">ID Бронирования (опционально)</Label>
                <Input
                  id="booking_id"
                  type="number"
                  value={formData.booking_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, booking_id: e.target.value }))}
                  placeholder="Связанное бронирование"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit">
                  {editingEntry ? 'Обновить' : 'Создать'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="entries" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="entries">
            <FileText className="w-4 h-4 mr-2" />
            Проводки
          </TabsTrigger>
          <TabsTrigger value="trial-balance">
            <Calculator className="w-4 h-4 mr-2" />
            Оборотная ведомость
          </TabsTrigger>
          <TabsTrigger value="profit-loss">
            <TrendingUp className="w-4 h-4 mr-2" />
            Отчет о прибылях
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <span className="text-primary">₸</span>
            План счетов
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          <Card>
            <CardHeader>
              <CardTitle>Журнал проводок</CardTitle>
              <CardDescription>Все бухгалтерские проводки</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Счет</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead className="text-right">Дебет</TableHead>
                      <TableHead className="text-right">Кредит</TableHead>
                      <TableHead>Бронирование</TableHead>
                      <TableHead>Создал</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.entry_date).toLocaleDateString('ru-RU')}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.account}</div>
                            <div className="text-sm text-muted-foreground">{entry.account_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right">
                          {entry.debit > 0 && formatCurrency(entry.debit)}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.credit > 0 && formatCurrency(entry.credit)}
                        </TableCell>
                        <TableCell>
                          {entry.booking_number && (
                            <Badge variant="outline">#{entry.booking_number}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.created_by_name}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(entry)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(entry.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trial-balance">
          <Card>
            <CardHeader>
              <CardTitle>Оборотная ведомость</CardTitle>
              <CardDescription>Сводка по всем счетам</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Счет</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead className="text-right">Всего дебет</TableHead>
                      <TableHead className="text-right">Всего кредит</TableHead>
                      <TableHead className="text-right">Сальдо</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialBalance.map((balance) => (
                      <TableRow key={balance.account}>
                        <TableCell className="font-medium">{balance.account}</TableCell>
                        <TableCell>{balance.account_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{balance.account_type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(balance.total_debit)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(balance.total_credit)}</TableCell>
                        <TableCell className="text-right">
                          <span className={balance.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(Math.abs(balance.balance))}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit-loss">
          {profitLoss && (
            <div className="grid gap-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(profitLoss.totalRevenue)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Общие расходы</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(profitLoss.totalExpenses)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Чистая прибыль</CardTitle>
                    <span className="text-primary">₸</span>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${profitLoss.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profitLoss.netIncome)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Доходы</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {profitLoss.revenue.map((item) => (
                        <div key={item.account} className="flex justify-between">
                          <span className="text-sm">{item.account_name}</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Расходы</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {profitLoss.expenses.map((item) => (
                        <div key={item.account} className="flex justify-between">
                          <span className="text-sm">{item.account_name}</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(Math.abs(item.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>План счетов</CardTitle>
              <CardDescription>Справочник бухгалтерских счетов</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Код счета</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.account_code}</TableCell>
                        <TableCell>{account.account_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{account.account_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={account.is_active ? "default" : "secondary"}>
                            {account.is_active ? "Активен" : "Неактивен"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
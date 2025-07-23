import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Users, Send, Eye, Calendar, TrendingUp, CheckCircle, X } from 'lucide-react';

export const WhatsAppManager = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Новая кампания
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message_template: '',
    target_audience: 'all'
  });

  useEffect(() => {
    loadSessions();
    loadCampaigns();
  }, []);

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .order('last_interaction', { ascending: false });
    
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить сессии",
        variant: "destructive",
      });
    } else {
      setSessions(data || []);
    }
  };

  const loadCampaigns = async () => {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить кампании",
        variant: "destructive",
      });
    } else {
      setCampaigns(data || []);
    }
  };

  const getStageLabel = (stage: string) => {
    const stages = {
      'consultation': 'Консультация',
      'booking_confirmed': 'Бронирование создано',
      'payment_pending': 'Ждет оплату',
      'payment_verification': 'Проверка чека',
      'payment_confirmed': 'Оплата подтверждена'
    };
    return stages[stage as keyof typeof stages] || stage;
  };

  const getStageColor = (stage: string) => {
    const colors = {
      'consultation': 'bg-blue-100 text-blue-800',
      'booking_confirmed': 'bg-green-100 text-green-800',
      'payment_pending': 'bg-yellow-100 text-yellow-800',
      'payment_verification': 'bg-orange-100 text-orange-800',
      'payment_confirmed': 'bg-emerald-100 text-emerald-800'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const createCampaign = async () => {
    if (!newCampaign.name || !newCampaign.message_template) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('marketing_campaigns')
      .insert(newCampaign);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать кампанию",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешно",
        description: "Кампания создана",
      });
      setNewCampaign({ name: '', message_template: '', target_audience: 'all' });
      loadCampaigns();
    }
    setLoading(false);
  };

  const sendCampaignMessage = async (campaignId: string) => {
    setLoading(true);
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    // Фильтруем сессии по целевой аудитории
    let targetSessions = sessions;
    if (campaign.target_audience === 'new_clients') {
      targetSessions = sessions.filter(s => !s.booking_id);
    } else if (campaign.target_audience === 'returning_clients') {
      targetSessions = sessions.filter(s => s.booking_id);
    }

    let sentCount = 0;
    for (const session of targetSessions) {
      try {
        const response = await supabase.functions.invoke('whatsapp-integration', {
          body: {
            action: 'send_marketing_message',
            data: {
              campaign_id: campaignId,
              phone_number: session.phone_number,
              message: campaign.message_template
            }
          }
        });

        if (response.data?.success) {
          sentCount++;
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }

    // Обновляем счетчик отправленных сообщений
    await supabase
      .from('marketing_campaigns')
      .update({ sent_count: sentCount })
      .eq('id', campaignId);

    toast({
      title: "Кампания отправлена",
      description: `Отправлено ${sentCount} сообщений`,
    });

    setLoading(false);
    loadCampaigns();
  };

  const sendManualMessage = async (phoneNumber: string, message: string) => {
    try {
      const response = await fetch(`http://194.32.141.216:3003/send?to=${phoneNumber}&text=${encodeURIComponent(message)}`);
      
      if (response.ok) {
        toast({
          title: "Сообщение отправлено",
          description: `Сообщение отправлено на ${phoneNumber}`,
        });
      } else {
        throw new Error('Ошибка отправки');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    }
  };

  // Компонент для проверки оплаты
  const PaymentVerificationSection = ({ session, onPaymentConfirmed }: any) => {
    const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      loadPaymentLinks();
    }, [session.id]);

    const loadPaymentLinks = async () => {
      const { data } = await supabase
        .from('payment_links')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false });
      
      setPaymentLinks(data || []);
    };

    const confirmPayment = async (paymentLinkId: string) => {
      setLoading(true);
      try {
        const response = await supabase.functions.invoke('whatsapp-integration', {
          body: {
            action: 'confirm_payment',
            data: {
              payment_link_id: paymentLinkId,
              verified_by: 'admin' // В реальности здесь должен быть ID администратора
            }
          }
        });

        if (response.data?.success) {
          toast({
            title: "Оплата подтверждена",
            description: "Клиент получил уведомление",
          });
          onPaymentConfirmed();
          loadPaymentLinks();
        }
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось подтвердить оплату",
          variant: "destructive",
        });
      }
      setLoading(false);
    };

    return (
      <div className="space-y-4 p-4 border rounded-lg bg-yellow-50">
        <h4 className="font-semibold text-yellow-800">Проверка оплаты</h4>
        {paymentLinks.map((link) => (
          <div key={link.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Сумма: {link.amount} ₸</span>
              <Badge variant={link.status === 'verified' ? 'default' : 'secondary'}>
                {link.status === 'verified' ? 'Подтверждено' : 'Ожидает проверки'}
              </Badge>
            </div>
            {link.payment_screenshot && (
              <div className="space-y-2">
                <Label>Чек от клиента:</Label>
                <img 
                  src={link.payment_screenshot} 
                  alt="Чек оплаты" 
                  className="max-w-xs rounded-lg border"
                />
                {link.status !== 'verified' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => confirmPayment(link.id)}
                      disabled={loading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Подтвердить оплату
                    </Button>
                    <Button size="sm" variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Отклонить
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const sendPaymentRequest = async (bookingId: string) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('whatsapp-integration', {
        body: {
          action: 'send_payment_request',
          data: {
            booking_id: bookingId
          }
        }
      });

      if (response.data?.success) {
        toast({
          title: "Ссылка на оплату отправлена",
          description: "Клиент получил ссылку для предоплаты",
        });
        loadSessions();
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить ссылку на оплату",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Управление WhatsApp</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего сессий</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные диалоги</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => new Date(s.last_interaction) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
            </div>
            <p className="text-xs text-muted-foreground">за последние 24 часа</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Бронирования</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.booking_id).length}
            </div>
            <p className="text-xs text-muted-foreground">из WhatsApp</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Кампании</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Сессии клиентов</TabsTrigger>
          <TabsTrigger value="campaigns">Маркетинговые кампании</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Сессии WhatsApp</CardTitle>
              <CardDescription>
                Управление диалогами с клиентами через WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Стадия</TableHead>
                      <TableHead>Тип размещения</TableHead>
                      <TableHead>Дата заезда</TableHead>
                      <TableHead>Последняя активность</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                    <TableRow key={session.id} className={session.session_stage === 'payment_verification' ? 'bg-yellow-50' : ''}>
                        <TableCell className="font-mono">{session.phone_number}</TableCell>
                        <TableCell>{session.client_name || 'Консультация'}</TableCell>
                        <TableCell>
                          <Badge className={getStageColor(session.session_stage)}>
                            {getStageLabel(session.session_stage)}
                          </Badge>
                        </TableCell>
                        <TableCell>{session.accommodation_type || '-'}</TableCell>
                        <TableCell>{session.check_in_date || '-'}</TableCell>
                        <TableCell>{new Date(session.last_interaction).toLocaleString('ru-RU')}</TableCell>
                        <TableCell className="space-x-2">
                          {session.session_stage === 'booking_confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendPaymentRequest(session.booking_id)}
                              disabled={loading}
                            >
                              Запросить оплату
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSession(session)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Детали
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Детали сессии: {session.phone_number}</DialogTitle>
                              </DialogHeader>
                              {selectedSession && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Имя клиента</Label>
                                      <p className="font-medium">{selectedSession.client_name || 'Не указано'}</p>
                                    </div>
                                    <div>
                                      <Label>Email</Label>
                                      <p className="font-medium">{selectedSession.email || 'Не указано'}</p>
                                    </div>
                                    <div>
                                      <Label>Дата заезда</Label>
                                      <p className="font-medium">{selectedSession.check_in_date || 'Не указано'}</p>
                                    </div>
                                    <div>
                                      <Label>Дата выезда</Label>
                                      <p className="font-medium">{selectedSession.check_out_date || 'Не указано'}</p>
                                    </div>
                                    <div>
                                      <Label>Количество гостей</Label>
                                      <p className="font-medium">{selectedSession.guests || 'Не указано'}</p>
                                    </div>
                                    <div>
                                      <Label>Общая стоимость</Label>
                                      <p className="font-medium">{selectedSession.total_price ? `${selectedSession.total_price} ₸` : 'Не указано'}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label>Заметки</Label>
                                    <p className="text-sm text-muted-foreground">{selectedSession.notes || 'Нет заметок'}</p>
                                  </div>

                                  {selectedSession.session_stage === 'payment_verification' && (
                                    <PaymentVerificationSection 
                                      session={selectedSession} 
                                      onPaymentConfirmed={loadSessions}
                                    />
                                  )}

                                  <div className="space-y-2">
                                    <Label>Отправить сообщение</Label>
                                    <div className="flex gap-2">
                                      <Input 
                                        placeholder="Введите сообщение..."
                                        id="manual-message"
                                      />
                                      <Button 
                                        onClick={() => {
                                          const input = document.getElementById('manual-message') as HTMLInputElement;
                                          if (input.value) {
                                            sendManualMessage(selectedSession.phone_number, input.value);
                                            input.value = '';
                                          }
                                        }}
                                      >
                                        <Send className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Создать кампанию</CardTitle>
              <CardDescription>
                Массовая рассылка сообщений для клиентов
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaign-name">Название кампании</Label>
                  <Input
                    id="campaign-name"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="Например: Весенние скидки"
                  />
                </div>
                <div>
                  <Label htmlFor="target-audience">Целевая аудитория</Label>
                  <Select 
                    value={newCampaign.target_audience} 
                    onValueChange={(value) => setNewCampaign({ ...newCampaign, target_audience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все клиенты</SelectItem>
                      <SelectItem value="new_clients">Новые клиенты</SelectItem>
                      <SelectItem value="returning_clients">Постоянные клиенты</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="message-template">Текст сообщения</Label>
                <Textarea
                  id="message-template"
                  value={newCampaign.message_template}
                  onChange={(e) => setNewCampaign({ ...newCampaign, message_template: e.target.value })}
                  placeholder="Привет! 🌟 У нас отличные новости..."
                  rows={4}
                />
              </div>
              
              <Button onClick={createCampaign} disabled={loading}>
                Создать кампанию
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Активные кампании</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Целевая аудитория: {campaign.target_audience === 'all' ? 'Все клиенты' : 
                                                campaign.target_audience === 'new_clients' ? 'Новые клиенты' : 'Постоянные клиенты'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Отправлено: {campaign.sent_count} сообщений
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                Просмотр
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{campaign.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Текст сообщения</Label>
                                  <div className="p-3 bg-muted rounded-md">
                                    <p className="whitespace-pre-wrap">{campaign.message_template}</p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            size="sm" 
                            onClick={() => sendCampaignMessage(campaign.id)}
                            disabled={loading}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Отправить
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
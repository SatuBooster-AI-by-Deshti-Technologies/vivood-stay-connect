import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Phone, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Client {
  id?: string;
  email: string;
  name: string;
  phone: string;
  totalBookings: number;
  lastBooking: string;
  source?: string;
  notes?: string;
}

export function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      // Загружаем клиентов из таблицы clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.error('Error loading clients:', clientsError);
      }

      // Загружаем клиентов из бронирований для совместимости
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('name, email, phone, created_at')
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error loading bookings:', bookingsError);
        return;
      }

      // Объединяем клиентов
      const allClientsData = [...(clientsData || [])];
      
      // Группируем по email для получения уникальных клиентов из бронирований
      const clientsMap = new Map<string, Client>();
      
      // Добавляем клиентов из таблицы clients
      allClientsData.forEach(client => {
        clientsMap.set(client.email, {
          id: client.id,
          email: client.email,
          name: client.name,
          phone: client.phone,
          totalBookings: 0,
          lastBooking: client.created_at,
          source: client.source || 'manual',
          notes: client.notes
        });
      });

      // Добавляем клиентов из бронирований и считаем количество бронирований
      bookings?.forEach(booking => {
        const existing = clientsMap.get(booking.email);
        if (existing) {
          existing.totalBookings += 1;
          if (new Date(booking.created_at) > new Date(existing.lastBooking)) {
            existing.lastBooking = booking.created_at;
          }
        } else if (!clientsData?.find(c => c.email === booking.email)) {
          clientsMap.set(booking.email, {
            email: booking.email,
            name: booking.name,
            phone: booking.phone,
            totalBookings: 1,
            lastBooking: booking.created_at,
            source: 'booking'
          });
        }
      });

      const mergedClients = Array.from(clientsMap.values());
      setClients(mergedClients);
      setAllClients(mergedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация клиентов по поисковому запросу
  useEffect(() => {
    if (!searchTerm) {
      setClients(allClients);
    } else {
      const filtered = allClients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
      );
      setClients(filtered);
    }
  }, [searchTerm, allClients]);

  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        console.error('Error deleting client:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось удалить клиента",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "Клиент удален"
      });

      await loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'manual': return 'Ручное добавление';
      case 'website': return 'Сайт';
      case 'whatsapp': return 'WhatsApp';
      case 'instagram': return 'Instagram';
      case 'booking': return 'Бронирование';
      case 'phone': return 'Телефон';
      case 'referral': return 'Рекомендация';
      default: return source;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'whatsapp': return 'bg-green-100 text-green-800';
      case 'instagram': return 'bg-pink-100 text-pink-800';
      case 'website': return 'bg-blue-100 text-blue-800';
      case 'booking': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">База клиентов</h1>
          <p className="text-gray-600">Управление клиентской базой</p>
        </div>
        <Button onClick={() => navigate('/admin/clients/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить клиента
        </Button>
      </div>

      {/* Поиск */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Input
              placeholder="Поиск по имени, email или телефону..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-3">
              <Users className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего клиентов</p>
                <p className="text-2xl font-bold">{allClients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Новых за месяц</p>
                <p className="text-2xl font-bold text-green-600">
                  {allClients.filter(client => {
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    return new Date(client.lastBooking) > lastMonth;
                  }).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">С бронированиями</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {allClients.filter(client => client.totalBookings > 0).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список клиентов */}
      <div className="grid gap-4">
        {clients.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'Клиенты не найдены' : 'Нет клиентов'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          clients.map((client, index) => (
            <Card key={`${client.email}-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{client.name}</h3>
                        {client.source && (
                          <Badge className={getSourceColor(client.source)}>
                            {getSourceText(client.source)}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{client.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Последняя активность: {new Date(client.lastBooking).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {client.notes && (
                        <p className="text-sm text-gray-600 mt-2">{client.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Бронирований</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {client.totalBookings}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {client.id && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/admin/clients/edit/${client.id}`)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Изменить
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить клиента?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Клиент "{client.name}" будет удален навсегда.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteClient(client.id!)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
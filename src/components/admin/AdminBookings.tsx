import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Filter, Users, Calendar, Phone, Mail, MessageCircle, CreditCard, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  accommodation_type: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  total_price: number;
  created_at: string;
  payment_status?: string;
  payment_screenshot?: string;
  session_stage?: string;
}

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          payment_links!payment_links_booking_id_fkey (
            status,
            payment_screenshot
          ),
          whatsapp_sessions!whatsapp_sessions_phone_number_fkey (
            session_stage
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookings:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить бронирования",
          variant: "destructive"
        });
        return;
      }

      // Преобразуем данные для удобного использования
      const formattedBookings = (data || []).map(booking => ({
        ...booking,
        payment_status: booking.payment_links?.[0]?.status,
        payment_screenshot: booking.payment_links?.[0]?.payment_screenshot,
        session_stage: booking.whatsapp_sessions?.[0]?.session_stage
      }));

      setBookings(formattedBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.phone.includes(searchTerm) ||
        booking.accommodation_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось обновить статус бронирования",
          variant: "destructive"
        });
        return;
      }

      if (newStatus === 'confirmed') {
        toast({
          title: "Успешно",
          description: "Бронирование подтверждено и добавлена бухгалтерская запись"
        });
      } else {
        toast({
          title: "Успешно", 
          description: "Статус бронирования обновлен"
        });
      }

      await loadBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Подтверждено';
      case 'pending': return 'Ожидает';
      case 'cancelled': return 'Отменено';
      default: return status;
    }
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Бронирования</h1>
          <p className="text-gray-600">Управление всеми бронированиями</p>
        </div>
        <Button onClick={() => navigate('/admin/bookings/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Новое бронирование
        </Button>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск по имени, телефону..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидает</SelectItem>
                <SelectItem value="confirmed">Подтверждено</SelectItem>
                <SelectItem value="cancelled">Отменено</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ожидает</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {bookings.filter(b => b.status === 'pending').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Подтверждено</p>
                <p className="text-2xl font-bold text-green-600">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Отменено</p>
                <p className="text-2xl font-bold text-red-600">
                  {bookings.filter(b => b.status === 'cancelled').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список бронирований */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Нет бронирований</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold text-lg">{booking.name}</h3>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusText(booking.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {booking.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {booking.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {booking.guests} гостей
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Размещение</p>
                    <p className="font-medium">{booking.accommodation_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Заезд</p>
                    <p className="font-medium">{new Date(booking.check_in).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(booking.check_in), 'd MMMM yyyy', { locale: ru })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Выезд</p>
                    <p className="font-medium">{new Date(booking.check_out).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(booking.check_out), 'd MMMM yyyy', { locale: ru })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ночей</p>
                    <p className="font-medium">{calculateNights(booking.check_in, booking.check_out)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-start mb-4">
                  {booking.total_price > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Общая стоимость</p>
                      <p className="text-lg font-semibold text-green-600">
                        {booking.total_price.toLocaleString()} ₸
                      </p>
                    </div>
                  )}
                  
                  {/* WhatsApp статус оплаты */}
                  {booking.session_stage && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">WhatsApp статус</p>
                      <div className="flex items-center gap-2">
                        {booking.payment_status === 'verified' ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CreditCard className="w-3 h-3 mr-1" />
                            Оплачено
                          </Badge>
                        ) : booking.payment_status === 'receipt_uploaded' ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <CreditCard className="w-3 h-3 mr-1" />
                            Ждет подтверждения
                          </Badge>
                        ) : booking.payment_status ? (
                          <Badge className="bg-red-100 text-red-800">
                            <CreditCard className="w-3 h-3 mr-1" />
                            Не оплачено
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Кнопки связи */}
                  <Button 
                    onClick={() => window.open(`tel:${booking.phone}`)}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Позвонить
                  </Button>
                  <Button 
                    onClick={() => window.open(`https://wa.me/${booking.phone.replace(/\D/g, '')}`)}
                    variant="outline"
                    size="sm"
                    className="flex items-center bg-green-50 hover:bg-green-100 text-green-700"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    WhatsApp
                  </Button>

                  {/* Кнопка просмотра чека */}
                  {booking.payment_screenshot && (
                    <Button 
                      onClick={() => window.open(booking.payment_screenshot, '_blank')}
                      variant="outline"
                      size="sm"
                      className="flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Посмотреть чек
                    </Button>
                  )}

                  {/* Кнопки статуса (только для pending) */}
                  {booking.status === 'pending' && (
                    <>
                      <Button 
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Подтвердить
                      </Button>
                      <Button 
                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                        variant="destructive" 
                        size="sm"
                      >
                        Отменить
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
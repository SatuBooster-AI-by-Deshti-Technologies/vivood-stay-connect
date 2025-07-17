import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar as CalendarIcon, Users, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
}

export function AdminCalendar() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('check_in', { ascending: true });

      if (error) {
        console.error('Error loading bookings:', error);
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      return date >= checkIn && date <= checkOut;
    });
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

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    
    const days = [];
    
    // Добавляем пустые дни для начала месяца
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Добавляем дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Календарь бронирований</h1>
          <p className="text-gray-600">Управление бронированиями в календарном виде</p>
        </div>
        <Button onClick={() => navigate('/admin/bookings/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Новое бронирование
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                  >
                    ←
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Сегодня
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                  >
                    →
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map(day => (
                  <div key={day} className="text-center font-medium text-sm text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays().map((day, index) => (
                  <div key={index} className="h-24 border rounded-md p-1 overflow-hidden">
                    {day && (
                      <>
                        <div className="text-sm font-medium mb-1">{day.getDate()}</div>
                        <div className="space-y-1">
                          {getBookingsForDate(day).slice(0, 2).map(booking => (
                            <div 
                              key={booking.id} 
                              className={`text-xs p-1 rounded truncate ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {booking.name}
                            </div>
                          ))}
                          {getBookingsForDate(day).length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{getBookingsForDate(day).length - 2} еще
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Бронирования сегодня
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getBookingsForDate(new Date()).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Нет бронирований на сегодня
                  </p>
                ) : (
                  getBookingsForDate(new Date()).map(booking => (
                    <div key={booking.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{booking.name}</h4>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {booking.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {booking.phone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {booking.guests} гостей
                        </div>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">{booking.accommodation_type}</p>
                        <p className="text-gray-600">
                          {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
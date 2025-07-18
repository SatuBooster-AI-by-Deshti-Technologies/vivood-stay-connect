import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Calendar, Plus, Search, Filter, Users, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  total_price: number;
  accommodation_type: string;
}

interface MonthData {
  year: number;
  month: number;
  bookings: Booking[];
}

export function AdminCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<Booking[]>([]);

  useEffect(() => {
    loadBookings();
  }, [currentDate]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      // Загружаем бронирования за текущий месяц и соседние месяцы
      const startOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('check_in', startOfPrevMonth.toISOString().split('T')[0])
        .lte('check_out', endOfNextMonth.toISOString().split('T')[0])
        .order('check_in');

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

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredBookings.filter(booking => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      return date >= checkIn && date <= checkOut;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Подтверждено';
      case 'pending': return 'В ожидании';
      case 'cancelled': return 'Отменено';
      case 'completed': return 'Завершено';
      default: return status;
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Начинаем с понедельника
    startDate.setDate(startDate.getDate() - (startDate.getDay() + 6) % 7);
    
    const days = [];
    const currentDateObj = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDateObj));
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    
    return days;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedBookings(getBookingsForDate(date));
  };

  const days = generateCalendarDays();
  const currentMonth = currentDate.getMonth();
  const today = new Date();

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Календарь бронирований</h1>
          <p className="text-muted-foreground">Управление бронированиями</p>
        </div>
        <Button onClick={() => navigate('/admin/bookings/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Новое бронирование
        </Button>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, email, телефону..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">В ожидании</SelectItem>
                <SelectItem value="confirmed">Подтверждено</SelectItem>
                <SelectItem value="completed">Завершено</SelectItem>
                <SelectItem value="cancelled">Отменено</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Календарь */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Дни недели */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          {/* Календарные дни */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dayBookings = getBookingsForDate(day);
              const isCurrentMonth = day.getMonth() === currentMonth;
              const isToday = day.toDateString() === today.toDateString();
              
              return (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <div
                      className={`
                        p-2 min-h-[80px] border rounded-lg cursor-pointer transition-colors
                        ${isCurrentMonth ? 'bg-background hover:bg-muted/50' : 'bg-muted/20 text-muted-foreground'}
                        ${isToday ? 'ring-2 ring-primary' : ''}
                        ${dayBookings.length > 0 ? 'border-primary/50' : 'border-border'}
                      `}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className="text-sm font-medium mb-1">
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 2).map((booking, i) => (
                          <div
                            key={i}
                            className="text-xs p-1 rounded bg-primary/10 text-primary truncate"
                          >
                            {booking.name}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayBookings.length - 2} еще
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle>
                        Бронирования на {day.toLocaleDateString('ru-RU')}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      {dayBookings.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          На эту дату нет бронирований
                        </p>
                      ) : (
                        dayBookings.map((booking) => (
                          <Card key={booking.id} className="p-4">
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{booking.name}</h4>
                                  <Badge className={getStatusColor(booking.status)}>
                                    {getStatusText(booking.status)}
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {booking.email}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {booking.phone}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    {booking.guests} гостей
                                  </div>
                                </div>
                                <p className="text-sm">{booking.accommodation_type}</p>
                                <p className="text-sm">
                                  {new Date(booking.check_in).toLocaleDateString()} - 
                                  {new Date(booking.check_out).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">
                                  {booking.total_price?.toLocaleString()} ₸
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Сегодняшние бронирования */}
      <Card>
        <CardHeader>
          <CardTitle>Сегодняшние бронирования</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const todayBookings = getBookingsForDate(today);
            return todayBookings.length === 0 ? (
              <p className="text-muted-foreground">На сегодня нет бронирований</p>
            ) : (
              <div className="space-y-3">
                {todayBookings.map((booking) => (
                  <div key={booking.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-muted/50 rounded-lg gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{booking.name}</h4>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{booking.accommodation_type}</p>
                      <p className="text-sm text-muted-foreground">{booking.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{booking.total_price?.toLocaleString()} ₸</p>
                      <p className="text-sm text-muted-foreground">{booking.guests} гостей</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
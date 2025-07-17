import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'ru': ru,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface BookingEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    id: string;
    name: string;
    email: string;
    phone: string;
    accommodation_type: string;
    guests: number;
    status: string;
    total_price: number;
  };
}

export function AdminCalendar() {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .order('check_in', { ascending: true });

      if (error) {
        console.error('Error loading bookings:', error);
        return;
      }

      const bookingEvents: BookingEvent[] = bookings.map(booking => ({
        id: booking.id,
        title: `${booking.name} - ${booking.accommodation_type}`,
        start: new Date(booking.check_in),
        end: new Date(booking.check_out),
        resource: {
          id: booking.id,
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          accommodation_type: booking.accommodation_type,
          guests: booking.guests,
          status: booking.status,
          total_price: booking.total_price || 0
        }
      }));

      setEvents(bookingEvents);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const eventStyleGetter = (event: BookingEvent) => {
    const { status } = event.resource;
    let backgroundColor = '#3174ad';
    
    switch (status) {
      case 'confirmed':
        backgroundColor = '#22c55e';
        break;
      case 'pending':
        backgroundColor = '#f59e0b';
        break;
      case 'cancelled':
        backgroundColor = '#ef4444';
        break;
      default:
        backgroundColor = '#3174ad';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const handleSelectEvent = (event: BookingEvent) => {
    setSelectedEvent(event);
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
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Новое бронирование
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div style={{ height: '600px' }}>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={handleSelectEvent}
                  messages={{
                    next: 'Следующий',
                    previous: 'Предыдущий',
                    today: 'Сегодня',
                    month: 'Месяц',
                    week: 'Неделя',
                    day: 'День',
                    agenda: 'Повестка дня',
                    date: 'Дата',
                    time: 'Время',
                    event: 'Событие',
                    noEventsInRange: 'Нет событий в данном диапазоне',
                    showMore: (total) => `+ еще ${total}`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Детали бронирования
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvent ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedEvent.resource.name}</h3>
                    <p className="text-sm text-gray-600">{selectedEvent.resource.email}</p>
                    <p className="text-sm text-gray-600">{selectedEvent.resource.phone}</p>
                  </div>
                  
                  <div>
                    <Badge className={getStatusColor(selectedEvent.resource.status)}>
                      {getStatusText(selectedEvent.resource.status)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Размещение:</p>
                      <p className="text-sm text-gray-600">{selectedEvent.resource.accommodation_type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Гостей:</p>
                      <p className="text-sm text-gray-600">{selectedEvent.resource.guests}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Заезд:</p>
                      <p className="text-sm text-gray-600">{selectedEvent.start.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Выезд:</p>
                      <p className="text-sm text-gray-600">{selectedEvent.end.toLocaleDateString()}</p>
                    </div>
                    {selectedEvent.resource.total_price > 0 && (
                      <div>
                        <p className="text-sm font-medium">Стоимость:</p>
                        <p className="text-sm text-green-600 font-semibold">
                          {selectedEvent.resource.total_price.toLocaleString()} ₸
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      Редактировать
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Выберите бронирование в календаре для просмотра деталей
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
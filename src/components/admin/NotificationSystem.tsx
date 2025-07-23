import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function NotificationSystem() {
  const { toast } = useToast();
  const audioRef = useRef<{ play: () => void } | null>(null);

  useEffect(() => {
    console.log('🔔 NotificationSystem: Инициализация');
    
    // Создаем простой звук уведомления через Web Audio API
    const createNotificationSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.error('Ошибка создания звука:', error);
      }
    };
    
    audioRef.current = { play: createNotificationSound };

    // Подписываемся на новые бронирования
    const channel = supabase
      .channel('booking-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('🔔 Получено новое бронирование:', payload);
          const booking = payload.new;
          
          // Показываем текстовое уведомление
          toast({
            title: "🔔 Новое бронирование!",
            description: `${booking.name} - ${booking.accommodation_type}`,
            duration: 8000,
            className: "bg-blue-50 border-blue-200"
          });

          // Воспроизводим звук
          if (audioRef.current) {
            try {
              audioRef.current.play();
              console.log('🔊 Звук уведомления воспроизведен');
            } catch (error) {
              console.error('Ошибка воспроизведения звука:', error);
            }
          }

          // Показываем браузерное уведомление
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Новое бронирование!', {
              body: `${booking.name} забронировал ${booking.accommodation_type}`,
              icon: '/logo-vivoodtau.jpg'
            });
            console.log('📱 Браузерное уведомление показано');
          }
        }
      )
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public', 
        table: 'bookings'
      }, (payload) => {
        console.log('📝 Бронирование обновлено:', payload);
        const booking = payload.new;
        const oldBooking = payload.old;
        
        // Уведомляем о подтверждении бронирования
        if (booking.status === 'confirmed' && oldBooking.status !== 'confirmed') {
          toast({
            title: "✅ Бронирование подтверждено!",
            description: `${booking.name} - ${booking.accommodation_type}`,
            duration: 5000,
            className: "bg-green-50 border-green-200"
          });
        }
      })
      .subscribe((status) => {
        console.log('📡 Статус подписки на уведомления:', status);
      });

    // Запрашиваем разрешение на уведомления
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Разрешение на уведомления:', permission);
      });
    }

    return () => {
      console.log('🔔 NotificationSystem: Отключение подписки');
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return null; // Этот компонент не рендерит UI
}
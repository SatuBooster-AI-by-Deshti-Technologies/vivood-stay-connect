import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function NotificationSystem() {
  const { toast } = useToast();
  const audioRef = useRef<{ play: () => void } | null>(null);

  useEffect(() => {
    // Создаем простой звук уведомления через Web Audio API
    const createNotificationSound = () => {
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
    };
    
    audioRef.current = { play: createNotificationSound } as any;

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
            } catch (error) {
              console.error('Error playing notification sound:', error);
            }
          }

          // Показываем браузерное уведомление
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Новое бронирование!', {
              body: `${booking.name} забронировал ${booking.accommodation_type}`,
              icon: '/logo-vivoodtau.jpg'
            });
          }
        }
      )
      .subscribe();

    // Запрашиваем разрешение на уведомления
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return null; // Этот компонент не рендерит UI
}
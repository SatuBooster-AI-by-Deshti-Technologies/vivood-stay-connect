import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <div className="text-right">
          <div className="font-mono text-lg font-semibold text-foreground">
            {formatTime(currentTime)}
          </div>
          <div className="text-xs">
            {formatDate(currentTime)}
          </div>
        </div>
      </div>
    </div>
  );
}
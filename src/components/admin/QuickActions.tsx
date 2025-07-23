import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Users, Home, BarChart3, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Новый брон',
      description: '',
      icon: Plus,
      action: () => navigate('/admin/bookings/new'),
      color: 'bg-blue-500',
      urgent: true
    },
    {
      title: 'Добавить клиента',
      description: 'Добавить нового клиента в базу',
      icon: Users,
      action: () => navigate('/admin/clients/new'),
      color: 'bg-green-500',
      urgent: false
    },
    {
      title: 'Календарь',
      description: '',
      icon: Calendar,
      action: () => navigate('/admin/calendar'),
      color: 'bg-purple-500',
      urgent: false
    },
    {
      title: 'Добавить домик',
      description: '',
      icon: Home,
      action: () => navigate('/admin/accommodations'),
      color: 'bg-orange-500',
      urgent: false
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Быстрые действия
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.urgent ? "default" : "outline"}
              className={`h-auto p-4 justify-start space-y-1 ${action.urgent ? action.color : ''}`}
              onClick={action.action}
            >
              <div className="flex items-center space-x-3 w-full">
                <action.icon className="w-5 h-5 flex-shrink-0" />
                <div className="text-left flex-1">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs opacity-75">{action.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
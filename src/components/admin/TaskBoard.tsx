import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, GripVertical, X, Check, Calendar, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'normal' | 'high';
  created_at: string;
  assigned_to?: string;
  created_by: string;
}

const statusConfig = {
  pending: {
    title: 'Новые',
    icon: Clock,
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  in_progress: {
    title: 'На завтра',
    icon: Calendar,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  completed: {
    title: 'Выполнено',
    icon: Check,
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
};

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tasks:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить задачи",
          variant: "destructive"
        });
        return;
      }

      setTasks((data || []).map(task => ({
        ...task,
        status: (['pending', 'in_progress', 'completed'].includes(task.status) ? task.status : 'pending') as Task['status'],
        priority: (['low', 'normal', 'high'].includes(task.priority) ? task.priority : 'normal') as Task['priority']
      })));
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: newTaskTitle.trim(),
          status: 'pending',
          priority: 'normal',
          created_by: user.id
        }]);

      if (error) {
        console.error('Error creating task:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось создать задачу",
          variant: "destructive"
        });
        return;
      }

      setNewTaskTitle('');
      setIsDialogOpen(false);
      toast({
        title: "Успешно",
        description: "Задача создана"
      });
      await loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось обновить задачу",
          variant: "destructive"
        });
        return;
      }

      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось удалить задачу",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "Задача удалена"
      });
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.keys(statusConfig).map((status) => (
          <Card key={status} className="h-96">
            <CardHeader>
              <div className="animate-pulse h-6 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Задачи</h2>
          <p className="text-gray-600">Управление задачами в стиле Trello</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Новая задача
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новую задачу</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Название задачи</label>
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Введите название задачи..."
                  onKeyPress={(e) => e.key === 'Enter' && createTask()}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createTask} disabled={!newTaskTitle.trim()}>
                  Создать
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Отмена
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon;
          const statusTasks = getTasksByStatus(status as Task['status']);
          
          return (
            <Card key={status} className={`${config.borderColor} border-2`}>
              <CardHeader className={`${config.bgColor} border-b ${config.borderColor}`}>
                <CardTitle className={`flex items-center gap-2 ${config.textColor}`}>
                  <Icon className="w-5 h-5" />
                  {config.title}
                  <Badge variant="secondary" className="ml-auto">
                    {statusTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
                {statusTasks.map((task) => (
                  <Card key={task.id} className="cursor-move hover:shadow-md transition-shadow bg-white border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>
                              {new Date(task.created_at).toLocaleDateString()}
                            </span>
                            {task.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs px-2 py-0">
                                Важно
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => updateTaskStatus(task.id, 
                                status === 'pending' ? 'in_progress' : 'completed'
                              )}
                            >
                              {status === 'pending' ? (
                                <Calendar className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </Button>
                          )}
                          {status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => updateTaskStatus(task.id, 'pending')}
                            >
                              <Clock className="w-3 h-3" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Задача будет удалена навсегда.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteTask(task.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {statusTasks.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-gray-400">
                    <div className="text-center">
                      <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Нет задач</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
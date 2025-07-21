import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar, CheckSquare, Clock, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: 'high' | 'normal' | 'low';
  due_date: string;
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'normal',
    due_date: ''
  });

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await api.getTasks();
      // Приведение типов для совместимости
      const typedTasks: Task[] = tasksData.map(task => ({
        ...task,
        priority: task.priority as 'high' | 'normal' | 'low',
        status: task.status as 'pending' | 'in_progress' | 'completed'
      }));
      setTasks(typedTasks);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось загрузить задачи",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Ошибка",
        description: "Название задачи обязательно",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, formData);
        toast({
          title: "Успех",
          description: "Задача обновлена",
        });
      } else {
        await api.createTask(formData);
        toast({
          title: "Успех",
          description: "Задача создана",
        });
      }
      
      setDialogOpen(false);
      setEditingTask(null);
      setFormData({ title: '', description: '', priority: 'normal', due_date: '' });
      loadTasks();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить задачу",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      loadTasks();
      toast({
        title: "Успех",
        description: "Статус задачи обновлен",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить статус",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;
    
    try {
      await api.deleteTask(taskId);
      loadTasks();
      toast({
        title: "Успех",
        description: "Задача удалена",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить задачу",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'normal': return 'Обычный';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Выполнено';
      case 'in_progress': return 'В работе';
      case 'pending': return 'Ожидает';
      default: return status;
    }
  };

  const todayTasks = tasks.filter(task => 
    task.due_date === new Date().toISOString().split('T')[0] ||
    (task.status !== 'completed' && !task.due_date)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка задач...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление задачами</h1>
          <p className="text-gray-600">Создавайте и отслеживайте задачи</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTask(null); setFormData({ title: '', description: '', priority: 'normal', due_date: '' }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить задачу
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Редактировать задачу' : 'Новая задача'}</DialogTitle>
              <DialogDescription>
                {editingTask ? 'Измените детали задачи' : 'Создайте новую задачу для выполнения'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Название</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Введите название задачи"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Описание задачи (опционально)"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Приоритет</Label>
                  <Select value={formData.priority} onValueChange={(value: 'high' | 'normal' | 'low') => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="normal">Обычный</SelectItem>
                      <SelectItem value="low">Низкий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="due_date">Срок выполнения</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingTask ? 'Обновить' : 'Создать'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Сегодняшние задачи */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Сегодняшние задачи ({todayTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Задач на сегодня нет</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'normal' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    <div>
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600">{task.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {getPriorityText(task.priority)}
                    </Badge>
                    <Select value={task.status} onValueChange={(value: Task['status']) => handleStatusChange(task.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Ожидает</SelectItem>
                        <SelectItem value="in_progress">В работе</SelectItem>
                        <SelectItem value="completed">Выполнено</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Все задачи */}
      <Card>
        <CardHeader>
          <CardTitle>Все задачи ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium">{task.title}</h4>
                    <Badge className={getPriorityColor(task.priority)}>
                      {getPriorityText(task.priority)}
                    </Badge>
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusText(task.status)}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {task.due_date && (
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Срок: {new Date(task.due_date).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Создано: {new Date(task.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(task)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(task.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {tasks.length === 0 && (
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Задач пока нет</p>
              <p className="text-gray-400 text-sm">Создайте первую задачу, нажав кнопку "Добавить задачу"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
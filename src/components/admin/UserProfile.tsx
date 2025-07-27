import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Settings, Shield, UserPlus, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  app_role: 'admin' | 'manager' | 'user';
  created_at: string;
}

export function UserProfile() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [updateData, setUpdateData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'manager' as 'admin' | 'manager' | 'user'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        // Получаем профиль текущего пользователя
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setCurrentProfile(profile);
        setUpdateData(prev => ({ ...prev, email: user.email || '', name: profile?.name || '' }));

        // Получаем все профили (только для админов)
        if (profile?.app_role === 'admin') {
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
          
          setProfiles(allProfiles || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные профиля",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (updateData.password && updateData.password !== updateData.confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Пароли не совпадают",
        variant: "destructive"
      });
      return;
    }

    try {
      // Обновляем email если изменился
      if (updateData.email !== currentUser?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: updateData.email
        });
        
        if (emailError) throw emailError;
        
        toast({
          title: "Email обновлен",
          description: "Проверьте свою почту для подтверждения нового email",
        });
      }

      // Обновляем пароль если указан
      if (updateData.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: updateData.password
        });
        
        if (passwordError) throw passwordError;
        
        toast({
          title: "Пароль обновлен",
          description: "Ваш пароль был успешно изменен",
        });
      }

      // Обновляем имя в профиле
      if (updateData.name !== currentProfile?.name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name: updateData.name })
          .eq('user_id', currentUser?.id);
        
        if (profileError) throw profileError;
      }

      setIsUpdateDialogOpen(false);
      setUpdateData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      loadData();
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить профиль",
        variant: "destructive"
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newUserData.password !== newUserData.confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Пароли не совпадают",
        variant: "destructive"
      });
      return;
    }

    try {
      // Создаем нового пользователя через обычную регистрацию
      const { data, error } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: newUserData.name,
            app_role: newUserData.role
          }
        }
      });

      if (error) throw error;

      // Профиль создастся автоматически через триггер handle_new_user
      // Но обновим роль, если нужно
      if (data.user && newUserData.role !== 'user') {
        setTimeout(async () => {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ app_role: newUserData.role })
            .eq('user_id', data.user.id);

          if (profileError) {
            console.error('Error updating role:', profileError);
          }
        }, 1000); // Даём время триггеру создать профиль
      }

      toast({
        title: "Пользователь создан",
        description: `${newUserData.name} добавлен как ${newUserData.role}`,
      });

      setIsAddUserDialogOpen(false);
      setNewUserData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'manager'
      });
      loadData();
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать пользователя",
        variant: "destructive"
      });
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: 'admin' | 'manager' | 'user') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ app_role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Роль изменена",
        description: "Роль пользователя успешно обновлена",
      });
      
      loadData();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось изменить роль",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'manager':
        return 'Менеджер';
      default:
        return 'Пользователь';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Управление профилями</h1>
        {currentProfile?.app_role === 'admin' && (
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Добавить пользователя
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать нового пользователя</DialogTitle>
                <DialogDescription>
                  Добавьте нового администратора или менеджера
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newName">Имя</Label>
                  <Input
                    id="newName"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Введите имя"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newEmail">Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Пароль</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newUserData.password}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Введите пароль"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newConfirmPassword">Подтвердите пароль</Label>
                  <div className="relative">
                    <Input
                      id="newConfirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={newUserData.confirmPassword}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Повторите пароль"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newRole">Роль</Label>
                  <Select value={newUserData.role} onValueChange={(value: 'admin' | 'manager' | 'user') => setNewUserData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Администратор</SelectItem>
                      <SelectItem value="manager">Менеджер</SelectItem>
                      <SelectItem value="user">Пользователь</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" className="w-full">
                  Создать пользователя
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Профиль текущего пользователя */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Мой профиль
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{currentProfile?.name}</p>
              <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
              <Badge variant={getRoleBadgeVariant(currentProfile?.app_role || 'user')} className="mt-2">
                <Shield className="w-3 h-3 mr-1" />
                {getRoleText(currentProfile?.app_role || 'user')}
              </Badge>
            </div>
            
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Обновить профиль</DialogTitle>
                  <DialogDescription>
                    Измените свои данные и настройки безопасности
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Имя</Label>
                    <Input
                      id="name"
                      value={updateData.name}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ваше имя"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={updateData.email}
                        onChange={(e) => setUpdateData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Новый пароль (оставьте пустым, если не хотите менять)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={updateData.password}
                        onChange={(e) => setUpdateData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Новый пароль"
                        className="pl-10 pr-10"
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  {updateData.password && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={updateData.confirmPassword}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Повторите пароль"
                          className="pl-10 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full">
                    Обновить профиль
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Список пользователей (только для админов) */}
      {currentProfile?.app_role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Все пользователи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{profile.name}</p>
                    <p className="text-sm text-muted-foreground">ID: {profile.user_id}</p>
                    <Badge variant={getRoleBadgeVariant(profile.app_role)} className="mt-1">
                      <Shield className="w-3 h-3 mr-1" />
                      {getRoleText(profile.app_role)}
                    </Badge>
                  </div>
                  
                  {profile.user_id !== currentUser?.id && (
                    <Select 
                      value={profile.app_role} 
                      onValueChange={(value: 'admin' | 'manager' | 'user') => handleChangeUserRole(profile.user_id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Администратор</SelectItem>
                        <SelectItem value="manager">Менеджер</SelectItem>
                        <SelectItem value="user">Пользователь</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
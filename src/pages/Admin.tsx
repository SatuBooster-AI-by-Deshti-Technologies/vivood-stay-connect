import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { AdminRoutes } from "@/components/admin/AdminRoutes";
import { Header } from "@/components/admin/Header";
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Profile {
  name: string;
  app_role: string;
}

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);

      // Получаем профиль пользователя
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, app_role')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить профиль",
          variant: "destructive"
        });
        return;
      }

      if (!profileData.app_role || !['admin', 'manager'].includes(profileData.app_role)) {
        toast({
          title: "Доступ запрещен",
          description: "У вас нет прав администратора или менеджера",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          <header className="h-16 flex items-center justify-between border-b px-4 md:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="mr-2" />
              <h1 className="font-semibold text-lg">SatuBooster</h1>
            </div>
            <div className="flex items-center gap-4">
              <Header />
              <Button variant="outline" onClick={handleLogout} size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </Button>
            </div>
          </header>
          <div className="overflow-auto">
            <AdminRoutes />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
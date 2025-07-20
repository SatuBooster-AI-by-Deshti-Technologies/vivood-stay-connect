import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { AdminRoutes } from "@/components/admin/AdminRoutes";
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Profile {
  name: string;
  role: string;
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
        .select('name, role')
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

      if (profileData.role !== 'admin') {
        toast({
          title: "Доступ запрещен",
          description: "У вас нет прав администратора",
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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
            <h1 className="text-xl font-semibold text-gray-900">
              SatuBooster
            </h1>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <AdminRoutes />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
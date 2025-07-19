import { 
  Calendar, 
  Users, 
  Home, 
  BarChart3, 
  Plus,
  Database,
  Calculator,
  FileText
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { 
    title: "Дашборд", 
    url: "/admin", 
    icon: BarChart3,
    exact: true
  },
  { 
    title: "Календарь", 
    url: "/admin/calendar", 
    icon: Calendar 
  },
  { 
    title: "Бронирования", 
    url: "/admin/bookings", 
    icon: Database 
  },
  { 
    title: "Размещения", 
    url: "/admin/accommodations", 
    icon: Home 
  },
  { 
    title: "Клиенты", 
    url: "/admin/clients", 
    icon: Users 
  },
  { 
    title: "Бухучет", 
    url: "/admin/accounting", 
    icon: Calculator 
  },
  { 
    title: "Аудит", 
    url: "/admin/audit", 
    icon: FileText 
  },
];


export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const getNavCls = (isActiveItem: boolean) =>
    isActiveItem ? "bg-primary text-primary-foreground" : "hover:bg-muted/50";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <div className="p-4">
        {!collapsed && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-primary">Vivood Tau</h2>
            <p className="text-sm text-muted-foreground">Эко-отель в горах</p>
          </div>
        )}
        <SidebarTrigger className="bg-background hover:bg-muted border border-border rounded-md p-2 transition-colors" />
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Управление</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${getNavCls(isActive(item.url, item.exact))}`}
                      onClick={() => navigate(item.url)}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        <SidebarGroup>
          <SidebarGroupLabel>Быстрые действия</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/bookings/new')}
                  >
                    <Plus className="mr-3 h-4 w-4" />
                    {!collapsed && <span>Новое бронирование</span>}
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/clients/new')}
                  >
                    <Plus className="mr-3 h-4 w-4" />
                    {!collapsed && <span>Новый клиент</span>}
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
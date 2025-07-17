import { useState } from "react";
import { 
  Calendar, 
  Users, 
  Home, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  Phone,
  Instagram,
  ChevronDown,
  ChevronRight,
  Plus,
  Database
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
];

const integrationItems = [
  { 
    title: "WhatsApp", 
    url: "/admin/whatsapp", 
    icon: Phone 
  },
  { 
    title: "Instagram", 
    url: "/admin/instagram", 
    icon: Instagram 
  },
  { 
    title: "Чаты", 
    url: "/admin/chats", 
    icon: MessageSquare 
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
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
      <SidebarTrigger className="m-4" />
      
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
          <SidebarGroupLabel>Интеграции</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Collapsible 
                  open={isIntegrationsOpen} 
                  onOpenChange={setIsIntegrationsOpen}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="w-full justify-between">
                      <div className="flex items-center">
                        <MessageSquare className="mr-3 h-4 w-4" />
                        {!collapsed && <span>Мессенджеры</span>}
                      </div>
                      {!collapsed && (
                        isIntegrationsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 mt-2">
                      {integrationItems.map((item) => (
                        <Button
                          key={item.title}
                          variant="ghost"
                          className={`w-full justify-start pl-8 ${getNavCls(isActive(item.url))}`}
                          onClick={() => navigate(item.url)}
                        >
                          <item.icon className="mr-3 h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
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
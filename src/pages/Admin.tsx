import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { AdminRoutes } from "@/components/admin/AdminRoutes";
import { Header } from "@/components/admin/Header";

export default function Admin() {
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
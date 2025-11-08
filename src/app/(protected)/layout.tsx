import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ActiveClinicProvider } from "@/providers/active-clinic";

import { AppSidebar } from "./_components/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ActiveClinicProvider>
        <AppSidebar />
        <main className="w-full">
          <SidebarTrigger />
          {children}
        </main>
      </ActiveClinicProvider>
    </SidebarProvider>
  );
}

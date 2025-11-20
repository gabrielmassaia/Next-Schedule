import { SidebarProvider } from "@/components/ui/sidebar";
import { ActiveClinicProvider } from "@/providers/active-clinic";

import { AppSidebar } from "./_components/app-sidebar";
import { Header } from "./_components/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ActiveClinicProvider>
        <AppSidebar />
        <div className="flex min-h-screen w-full flex-col bg-slate-50/50">
          <Header />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </ActiveClinicProvider>
    </SidebarProvider>
  );
}

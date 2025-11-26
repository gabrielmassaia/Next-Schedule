"use client";

import {
  Bot,
  Building2,
  CalendarDays,
  ChevronRight,
  CreditCard,
  HammerIcon,
  KeyRound,
  LayoutDashboard,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useActiveClinic } from "@/providers/active-clinic";

interface MenuItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  requiresPlan?: string[];
}

interface SettingsMenuItem {
  title: string;
  url: string;
  icon: typeof Building2;
  requiresPlan?: string[];
}

export function AppSidebar() {
  const pathname = usePathname();
  const { session } = useActiveClinic();
  const userPlan = session.data?.user.plan;

  // Main menu items
  const mainMenuItems: MenuItem[] = useMemo(
    () => [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Agendamentos",
        url: "/appointments",
        icon: CalendarDays,
      },
      {
        title: "Profissionais",
        url: "/professionals",
        icon: UserRound,
      },
      {
        title: "Clientes",
        url: "/clients",
        icon: UsersRound,
      },
    ],
    [],
  );

  // Settings submenu items
  const settingsMenuItems: SettingsMenuItem[] = useMemo(
    () => [
      {
        title: "Gerenciar Clínica",
        url: "/clinic-settings",
        icon: Building2,
      },
      {
        title: "API Key",
        url: "/apikey",
        icon: KeyRound,
      },
      {
        title: "Especialidades",
        url: "/specialties",
        icon: HammerIcon,
      },
      {
        title: "Personalidade IA",
        url: "/clinic-persona",
        icon: Bot,
      },
    ],
    [],
  );

  // Filter items based on user plan
  const filterByPlan = useCallback(
    <T extends { requiresPlan?: string[] }>(items: T[]) => {
      return items.filter((item) => {
        if (!item.requiresPlan || item.requiresPlan.length === 0) {
          return true;
        }
        return userPlan && item.requiresPlan.includes(userPlan);
      });
    },
    [userPlan],
  );

  const visibleMainItems = useMemo(
    () => filterByPlan(mainMenuItems),
    [filterByPlan, mainMenuItems],
  );

  const visibleSettingsItems = useMemo(
    () => filterByPlan(settingsMenuItems),
    [filterByPlan, settingsMenuItems],
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <CalendarDays className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold">Next Schedule</h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-medium tracking-wider uppercase">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="my-2 px-4">
          <div className="border-t" />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-medium tracking-wider uppercase">
            Gerenciamento
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleSettingsItems.length > 0 && (
                <Collapsible defaultOpen className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <Settings className="h-4 w-4" />
                        <span>Configurações</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleSettingsItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === item.url}
                            >
                              <Link href={item.url}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/subscription"}
                >
                  <Link href="/subscription">
                    <CreditCard className="h-4 w-4" />
                    <span>Planos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <p className="text-muted-foreground text-center text-xs">
          © 2025 Next Schedule
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

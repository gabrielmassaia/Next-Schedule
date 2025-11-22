"use client";

import {
  CalendarDays,
  LayoutDashboard,
  LucideIcon,
  Menu,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  link: string;
  icon: LucideIcon;
  action?: boolean;
}

// Menus
const navItems: NavItem[] = [
  { name: "Dashboard", link: "/dashboard", icon: LayoutDashboard },
  { name: "Agenda", link: "/appointments", icon: CalendarDays },
  { name: "Profissionais", link: "/professionals", icon: UserRound },
  { name: "Clientes", link: "/clients", icon: UsersRound },
  { name: "Menu", link: "#", icon: Menu, action: true },
];

interface BottomNavigationProps {
  className?: string;
}

export function BottomNavigation({ className }: BottomNavigationProps) {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  return (
    <div
      className={cn(
        "bg-background fixed bottom-0 left-0 z-50 flex h-16 w-full items-center border-t px-4 py-2 sm:hidden",
        className,
      )}
    >
      <div className="flex w-full items-center justify-between gap-1 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.link === "/"
              ? pathname === "/"
              : pathname === item.link || pathname?.startsWith(item.link + "/");

          if (item.action) {
            return (
              <button
                key={item.name}
                className="text-muted-foreground hover:text-foreground flex min-w-[50px] flex-col items-center justify-center gap-1 text-xs font-medium transition-colors"
                onClick={() => toggleSidebar()}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              className={cn(
                "flex min-w-[50px] flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              href={item.link}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

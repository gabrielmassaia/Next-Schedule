"use client";

import { cn } from "@/lib/utils";
import {
  Apple,
  Dumbbell,
  HeartPulse,
  Home,
  ShoppingBag,
  LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useActivePath } from "@/lib/hooks/useActivePath";

interface NavItem {
  name: string;
  link: string;
  icon: LucideIcon;
}

// Menus
const navItems: NavItem[] = [
  { name: "Início", link: "/home", icon: Home },
  { name: "Treino", link: "/workout", icon: Dumbbell },
  { name: "Consulta", link: "/telehealth", icon: HeartPulse },
  { name: "Alimentação", link: "/food", icon: Apple },
  //{ name: "Loja", link: "#", icon: ShoppingBag }, // /store
];

interface BottomNavigationProps {
  className?: string;
}

export function BottomNavigation({ className }: BottomNavigationProps) {
  const { getClasses } = useActivePath();

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 bg-background h-16 flex sm:hidden items-center py-2 px-4 border-t-2",
        className
      )}
    >
      <div className="flex flex-1 items-center justify-between px-2 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isDisabled = item.link === "#";

          return (
            <Link
              key={item.name}
              className={
                isDisabled
                  ? "bottom-navigation"
                  : getClasses(item.link, "bottom-navigation", "active")
              }
              href={item.link}
            >
              <Icon className="bottom-navigation-icon" />
              <span className="bottom-navigation-text">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
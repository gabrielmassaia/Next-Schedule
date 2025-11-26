"use client";

import { LogOut, Settings, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { getPageTitle } from "@/lib/nav-utils";
import { useActiveClinic } from "@/providers/active-clinic";

import { ClinicSwitcher } from "./clinic-switcher";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useActiveClinic();
  const pageTitle = getPageTitle(pathname);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/authentication");
        },
      },
    });
  };

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 hidden h-16 shrink-0 items-center justify-between gap-2 border-b px-4 backdrop-blur sm:flex">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h2 className="text-foreground text-lg font-semibold">{pageTitle}</h2>
      </div>
      <div className="flex items-center gap-2">
        <ClinicSwitcher />
        <ModeToggle />
        {/* Dropdown de Usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:bg-accent flex items-center gap-2 rounded-md p-2 transition-colors outline-none">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{session.data?.user.name}</p>
                <p className="text-muted-foreground text-xs">
                  {session.data?.user.email}
                </p>
              </div>
              <Avatar>
                <AvatarFallback>
                  <UserRound className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/clinic-settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Gerenciar Clínica</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

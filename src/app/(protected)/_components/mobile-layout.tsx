"use client";

import { LogOut, Settings, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { ClinicSwitcher } from "@/app/(protected)/_components/clinic-switcher";
import { BottomNavigation } from "@/components/Mobile/BottomNavigation";
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
import { authClient } from "@/lib/auth-client";
import { getPageTitle } from "@/lib/nav-utils";
import { useActiveClinic } from "@/providers/active-clinic";

import { MobileSettingsModal } from "./mobile-settings-modal";

export function MobileLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useActiveClinic();
  const title = getPageTitle(pathname);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

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
    <>
      <header className="bg-background/95 supports-backdrop-filter:bg-background/60 fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur sm:hidden">
        <div className="flex items-center">
          <h1 className="text-lg font-bold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ClinicSwitcher />
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hover:bg-accent flex items-center gap-2 rounded-md p-1 transition-colors outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <UserRound className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                {session.data?.user.name}
                <br />
                {session.data?.user.email}
              </DropdownMenuLabel>
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
      <div className="h-16 sm:hidden" /> {/* Spacer for fixed header */}
      <BottomNavigation onSettingsClick={() => setIsSettingsModalOpen(true)} />
      <MobileSettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
    </>
  );
}

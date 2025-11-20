"use client";

import {
  Building2,
  Home,
  LogOut,
  Plus,
  Settings,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
import { useActiveClinic } from "@/providers/active-clinic";

export function Header() {
  const router = useRouter();
  const session = authClient.useSession();
  const { clinics, activeClinic, setActiveClinic } = useActiveClinic();

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
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-white px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
      </div>
      <div className="flex items-center gap-2">
        {/* Dropdown de Clínicas */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-2 transition-colors outline-none hover:bg-slate-100">
              <Building2 className="h-5 w-5" />
              <span className="hidden text-sm font-medium sm:block">
                {activeClinic?.name ?? "Selecione uma clínica"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Clínicas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {clinics.length ? (
              clinics.map((clinic) => (
                <DropdownMenuItem
                  key={clinic.id}
                  onClick={async () => {
                    try {
                      await setActiveClinic(clinic.id);
                      // Redirecionar para dashboard para forçar reload completo
                      router.push("/dashboard");
                      router.refresh();
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                >
                  <Home className="mr-2 h-4 w-4" />
                  {clinic.name}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                Nenhuma clínica cadastrada
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/clinic-form")}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Criar nova clínica</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dropdown de Usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-2 transition-colors outline-none hover:bg-slate-100">
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

"use client";

import { Building2, Home, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveClinic } from "@/providers/active-clinic";

export function ClinicSwitcher() {
  const router = useRouter();
  const { clinics, activeClinic, setActiveClinic, isLoading } =
    useActiveClinic();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hover:bg-accent flex items-center gap-2 rounded-md p-2 transition-colors outline-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Building2 className="h-5 w-5" />
          )}
          <span className="hidden text-sm font-medium sm:block">
            {isLoading
              ? "Carregando..."
              : (activeClinic?.name ?? "Selecione uma clínica")}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" key={clinics.length}>
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
  );
}

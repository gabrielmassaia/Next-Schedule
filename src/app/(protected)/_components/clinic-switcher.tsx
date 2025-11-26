"use client";

import { Building2, Home, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useActiveClinic } from "@/providers/active-clinic";

export function ClinicSwitcher() {
  const router = useRouter();
  const { clinics, activeClinic, setActiveClinic, isLoading } =
    useActiveClinic();
  const [showModal, setShowModal] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    // Mostra modal bloqueante se:
    // 1. Não está carregando
    // 2. Tem mais de uma clínica
    // 3. Não há clínica ativa selecionada
    if (!isLoading && clinics.length > 1 && !activeClinic) {
      setShowModal(true);
      // Pre-seleciona a primeira clínica
      if (clinics.length > 0 && !selectedClinicId) {
        setSelectedClinicId(clinics[0].id);
      }
    } else {
      setShowModal(false);
    }
  }, [isLoading, clinics.length, activeClinic, clinics, selectedClinicId]);

  const handleConfirmSelection = async () => {
    if (!selectedClinicId) return;

    setIsSelecting(true);
    try {
      await setActiveClinic(selectedClinicId);
      setShowModal(false);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <>
      {/* Modal bloqueante para seleção inicial */}
      <Dialog open={showModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[425px]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Selecione uma clínica</DialogTitle>
            <DialogDescription>
              Você possui múltiplas clínicas. Selecione qual deseja acessar.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={selectedClinicId}
            onValueChange={setSelectedClinicId}
            className="space-y-3"
          >
            {clinics.map((clinic) => (
              <div key={clinic.id} className="flex items-center space-x-2">
                <RadioGroupItem value={clinic.id} id={clinic.id} />
                <Label htmlFor={clinic.id} className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">{clinic.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {clinic.cnpj}
                    </p>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
          <Button
            onClick={handleConfirmSelection}
            disabled={isSelecting || !selectedClinicId}
            className="w-full"
          >
            {isSelecting ? "Carregando..." : "Confirmar"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Dropdown normal para trocar de clínica */}
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
    </>
  );
}

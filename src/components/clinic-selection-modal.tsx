"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ClinicSummary } from "@/lib/clinic-session";

interface ClinicSelectionModalProps {
  clinics: ClinicSummary[];
  open: boolean;
}

export function ClinicSelectionModal({
  clinics,
  open,
}: ClinicSelectionModalProps) {
  const [selectedClinicId, setSelectedClinicId] = useState<string>(
    clinics[0]?.id ?? "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/clinics/active", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId: selectedClinicId }),
      });
      // Redirecionar para dashboard para forçar reload completo
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[425px]">
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
                  <p className="text-muted-foreground text-sm">{clinic.cnpj}</p>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
        <Button onClick={handleConfirm} disabled={isLoading} className="w-full">
          {isLoading ? "Carregando..." : "Confirmar"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

import UpsertPatientForm from "./upsert-patient-form";

interface AddPatientButtonProps {
  disabled?: boolean;
  helperText?: string;
}

export default function AddPatientButton({
  disabled = false,
  helperText,
}: AddPatientButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (disabled) {
      return;
    }
    setIsOpen(open);
  };

  return (
    <div className="flex flex-col">
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            disabled={disabled}
            variant={disabled ? "secondary" : "default"}
            onClick={() => setIsOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Paciente
          </Button>
        </DialogTrigger>
        <UpsertPatientForm isOpen={isOpen} onSuccess={() => setIsOpen(false)} />
      </Dialog>
      {helperText && disabled && (
        <p className="mt-2 text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

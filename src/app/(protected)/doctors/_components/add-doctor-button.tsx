"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

import UpsertDoctorForm from "./upsert-doctor-form";

interface AddDoctorButtonProps {
  disabled?: boolean;
  helperText?: string;
  specialties: { id: string; name: string }[];
}

export default function AddDoctorButton({
  disabled = false,
  helperText,
  specialties,
}: AddDoctorButtonProps) {
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
          >
            <Plus />
            Adicionar Profissional
          </Button>
        </DialogTrigger>
        <UpsertDoctorForm
          specialties={specialties}
          onSuccess={() => setIsOpen(false)}
        />
      </Dialog>
      {helperText && disabled && (
        <p className="mt-2 text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

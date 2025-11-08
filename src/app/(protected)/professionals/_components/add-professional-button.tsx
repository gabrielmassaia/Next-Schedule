"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

import UpsertProfessionalForm from "./upsert-professional-form";

interface AddProfessionalButtonProps {
  disabled?: boolean;
  helperText?: string;
}

export default function AddProfessionalButton({
  disabled = false,
  helperText,
}: AddProfessionalButtonProps) {
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
        <UpsertProfessionalForm onSuccess={() => setIsOpen(false)} />
      </Dialog>
      {helperText && disabled && (
        <p className="mt-2 text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

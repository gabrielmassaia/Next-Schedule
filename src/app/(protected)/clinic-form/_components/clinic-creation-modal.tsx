"use client";

import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clinicNichesTable } from "@/db/schema";

import FormClinic from "./form-clinic";

interface ClinicCreationModalProps {
  niches: (typeof clinicNichesTable.$inferSelect)[];
}

export function ClinicCreationModal({ niches }: ClinicCreationModalProps) {
  const router = useRouter();

  return (
    <Dialog open onOpenChange={(open) => !open && router.push("/dashboard")}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Adicionar clínica</DialogTitle>
          <DialogDescription>
            Adicione uma clínica para continuar.
          </DialogDescription>
        </DialogHeader>
        <FormClinic niches={niches} />
      </DialogContent>
    </Dialog>
  );
}

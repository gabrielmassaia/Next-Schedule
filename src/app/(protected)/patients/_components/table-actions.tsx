import { EditIcon, MoreVerticalIcon, PowerIcon, TrashIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { togglePatientStatus } from "@/actions/deactivate-patient";
import { deletePatient } from "@/actions/delete-patient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { patientsTable } from "@/db/schema";
import { useActiveClinic } from "@/providers/active-clinic";

import UpsertPatientForm from "./upsert-patient-form";

interface PatientTableActionsProps {
  patient: typeof patientsTable.$inferSelect;
}

export default function PatientTableActions({
  patient,
}: PatientTableActionsProps) {
  const [upsertDialogIsOpen, setUpsertDialogIsOpen] = useState(false);
  const { activeClinicId } = useActiveClinic();

  const toggleStatusAction = useAction(togglePatientStatus, {
    onSuccess: () => {
      toast.success(
        `Paciente ${patient.status === "active" ? "inativado" : "ativado"} com sucesso`,
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao alterar status do paciente",
      );
    },
  });

  const deletePatientAction = useAction(deletePatient, {
    onSuccess: () => {
      toast.success("Paciente excluído permanentemente com sucesso");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir o paciente",
      );
    },
  });

  const handleToggleStatus = () => {
    if (!patient) return;
    if (!activeClinicId) {
      toast.error("Selecione uma clínica antes de alterar o paciente");
      return;
    }
    toggleStatusAction.execute({
      id: patient.id,
      status: patient.status === "active" ? "inactive" : "active",
      clinicId: activeClinicId,
    });
  };

  const handleDelete = () => {
    if (!patient) return;
    if (!activeClinicId) {
      toast.error("Selecione uma clínica antes de excluir o paciente");
      return;
    }
    deletePatientAction.execute({ id: patient.id, clinicId: activeClinicId });
  };

  const isInactive = patient.status === "inactive";

  return (
    <>
      <Dialog open={upsertDialogIsOpen} onOpenChange={setUpsertDialogIsOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon">
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{patient.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setUpsertDialogIsOpen(true)}>
              <EditIcon className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            {isInactive ? (
              <DropdownMenuItem onClick={handleToggleStatus}>
                <PowerIcon className="mr-2 h-4 w-4" /> Ativar
              </DropdownMenuItem>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <PowerIcon className="mr-2 h-4 w-4" /> Inativar
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Tem certeza que deseja inativar esse paciente?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      O paciente será marcado como inativo e não aparecerá nas
                      listagens por padrão. Você poderá reativá-lo
                      posteriormente se necessário.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleToggleStatus}
                      disabled={toggleStatusAction.status === "executing"}
                    >
                      Inativar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive"
                >
                  <TrashIcon className="mr-2 h-4 w-4" /> Excluir Permanentemente
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Tem certeza que deseja excluir permanentemente esse
                    paciente?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O paciente será excluído
                    permanentemente do sistema, incluindo todo seu histórico.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deletePatientAction.status === "executing"}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir Permanentemente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>

        <UpsertPatientForm
          isOpen={upsertDialogIsOpen}
          patient={patient}
          onSuccess={() => setUpsertDialogIsOpen(false)}
        />
      </Dialog>
    </>
  );
}

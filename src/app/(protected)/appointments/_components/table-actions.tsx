"use client";

import { EditIcon, MoreVerticalIcon, TrashIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { cancelAppointment } from "@/actions/cancel-appointment";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
import {
  appointmentsTable,
  clientsTable,
  professionalsTable,
} from "@/db/schema";
import { useActiveClinic } from "@/providers/active-clinic";

import AddAppointmentForm from "./add-appointment-form";

type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  client: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    sex: "male" | "female";
  } | null;
  professional: {
    id: string;
    name: string;
    specialty: string;
  } | null;
};

interface AppointmentsTableActionsProps {
  appointment: AppointmentWithRelations;
  clients: (typeof clientsTable.$inferSelect)[];
  professionals: (typeof professionalsTable.$inferSelect)[];
}

const AppointmentsTableActions = ({
  appointment,
  clients,
  professionals,
}: AppointmentsTableActionsProps) => {
  const { activeClinicId } = useActiveClinic();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const cancelAppointmentAction = useAction(cancelAppointment, {
    onSuccess: () => {
      toast.success("Agendamento cancelado com sucesso.");
      setIsCancelOpen(false);
    },
    onError: () => {
      toast.error("Erro ao cancelar agendamento.");
    },
  });

  const handleCancelAppointmentClick = () => {
    if (!appointment) return;
    if (!activeClinicId) {
      toast.error("Selecione uma clínica antes de cancelar agendamentos");
      return;
    }
    cancelAppointmentAction.execute({
      id: appointment.id,
      clinicId: activeClinicId,
    });
  };

  return (
    <>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <AddAppointmentForm
          isOpen={isEditOpen}
          clients={clients}
          professionals={professionals}
          initialData={appointment}
          onSuccess={() => setIsEditOpen(false)}
        />
      </Dialog>

      <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tem certeza que deseja cancelar esse agendamento?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O agendamento ficará marcado como cancelado e será excluído
              automaticamente após 1 semana.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAppointmentClick}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancelar Agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {appointment.client?.name || "Cliente"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <EditIcon className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsCancelOpen(true)}
            className="text-red-600"
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Cancelar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default AppointmentsTableActions;

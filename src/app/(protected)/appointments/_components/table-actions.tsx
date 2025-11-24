"use client";

import { EditIcon, MoreVerticalIcon, Trash2Icon, XCircleIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { cancelAppointment } from "@/actions/cancel-appointment";
import { deleteAppointment } from "@/actions/delete-appointment";
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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const cancelAppointmentAction = useAction(cancelAppointment, {
    onSuccess: () => {
      toast.success("Agendamento cancelado com sucesso.");
      setIsCancelOpen(false);
    },
    onError: () => {
      toast.error("Erro ao cancelar agendamento.");
    },
  });

  const deleteAppointmentAction = useAction(deleteAppointment, {
    onSuccess: () => {
      toast.success("Agendamento excluído permanentemente.");
      setIsDeleteOpen(false);
    },
    onError: () => {
      toast.error("Erro ao excluir agendamento.");
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

  const handleDeleteAppointmentClick = () => {
    if (!appointment) return;
    if (!activeClinicId) {
      toast.error("Selecione uma clínica antes de excluir agendamentos");
      return;
    }
    deleteAppointmentAction.execute({
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
              className="bg-orange-600 hover:bg-orange-700"
            >
              Cancelar Agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tem certeza que deseja excluir esse agendamento?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>permanente</strong> e não pode ser desfeita. O
              agendamento será removido completamente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAppointmentClick}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Permanentemente
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
            className="text-orange-600"
          >
            <XCircleIcon className="mr-2 h-4 w-4" />
            Cancelar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteOpen(true)}
            className="text-red-600"
          >
            <Trash2Icon className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default AppointmentsTableActions;

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangleIcon, CheckCircle2, XCircle } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { updateAppointmentStatus } from "@/actions/update-appointment-status";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { appointmentsTable } from "@/db/schema";
import { useActiveClinic } from "@/providers/active-clinic";

import AppointmentsTableActions from "./table-actions";

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

import { clientsTable, professionalsTable } from "@/db/schema";

function StatusCell({
  appointment,
}: {
  appointment: AppointmentWithRelations;
}) {
  const { activeClinicId } = useActiveClinic();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<
    "scheduled" | "completed" | "cancelled" | null
  >(null);

  const updateStatusAction = useAction(updateAppointmentStatus, {
    onSuccess: () => {
      toast.success("Status atualizado com sucesso.");
      setIsDialogOpen(false);
      setPendingStatus(null);
    },
    onError: () => {
      toast.error("Erro ao atualizar status.");
      setPendingStatus(null);
    },
  });

  const handleStatusChange = (
    newStatus: "scheduled" | "completed" | "cancelled",
  ) => {
    setPendingStatus(newStatus);
    setIsDialogOpen(true);
  };

  const confirmStatusChange = () => {
    if (!pendingStatus || !activeClinicId) return;

    updateStatusAction.execute({
      id: appointment.id,
      clinicId: activeClinicId,
      status: pendingStatus,
    });
  };

  const status = appointment.status as "scheduled" | "completed" | "cancelled";

  const statusMap = {
    scheduled: {
      label: "Agendado",
      variant: "default" as const,
      className: "bg-blue-500 hover:bg-blue-600",
    },
    completed: {
      label: "Realizado",
      variant: "default" as const,
      className: "bg-green-500 hover:bg-green-600",
    },
    cancelled: {
      label: "Cancelado",
      variant: "destructive" as const,
      className: "bg-red-500 hover:bg-red-600",
    },
  };

  const config = statusMap[status] || statusMap.scheduled;

  const statusLabels = {
    scheduled: "Agendado",
    completed: "Realizado",
    cancelled: "Cancelado",
  };

  return (
    <>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de status</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar o status deste agendamento para{" "}
              <strong>{pendingStatus && statusLabels[pendingStatus]}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
              <Badge className={config.className} variant={config.variant}>
                {config.label}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Alterar status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleStatusChange("completed")}
              disabled={status === "completed"}
            >
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
              Marcar como Realizado
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("cancelled")}
              disabled={status === "cancelled"}
              className="text-red-600"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Marcar como Cancelado
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {status === "cancelled" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertTriangleIcon className="h-4 w-4 text-red-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Será excluído em 1 semana</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </>
  );
}

export const getAppointmentsTableColumns = (
  clients: (typeof clientsTable.$inferSelect)[],
  professionals: (typeof professionalsTable.$inferSelect)[],
): ColumnDef<AppointmentWithRelations>[] => [
  {
    id: "client",
    accessorKey: "client.name",
    header: "Cliente",
  },
  {
    id: "professional",
    accessorKey: "professional.name",
    header: "Profissional",
    cell: (params) => {
      const appointment = params.row.original;
      return appointment.professional?.name || "-";
    },
  },
  {
    id: "date",
    accessorKey: "date",
    header: "Data e Hora",
    cell: (params) => {
      const appointment = params.row.original;
      return format(new Date(appointment.date), "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR,
      });
    },
  },
  {
    id: "specialty",
    accessorKey: "professional.specialty",
    header: "Especialidade",
  },
  {
    id: "price",
    accessorKey: "appointmentPriceInCents",
    header: "Valor",
    cell: (params) => {
      const appointment = params.row.original;
      const price = appointment.appointmentPriceInCents / 100;
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(price);
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: (params) => {
      const appointment = params.row.original;
      return <StatusCell appointment={appointment} />;
    },
  },
  {
    id: "actions",
    cell: (params) => {
      const appointment = params.row.original;
      return (
        <AppointmentsTableActions
          appointment={appointment}
          clients={clients}
          professionals={professionals}
        />
      );
    },
  },
];

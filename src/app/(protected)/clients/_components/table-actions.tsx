import { EditIcon, MoreVerticalIcon, PowerIcon, TrashIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { toggleClientStatus } from "@/actions/deactivate-client";
import { deleteClient } from "@/actions/delete-client";
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
import { clientsTable } from "@/db/schema";
import { useActiveClinic } from "@/providers/active-clinic";

import UpsertClientForm from "./upsert-client-form";

interface ClientTableActionsProps {
  client: typeof clientsTable.$inferSelect;
}

export default function ClientTableActions({
  client,
}: ClientTableActionsProps) {
  const [upsertDialogIsOpen, setUpsertDialogIsOpen] = useState(false);
  const { activeClinicId } = useActiveClinic();

  const toggleStatusAction = useAction(toggleClientStatus, {
    onSuccess: () => {
      toast.success(
        `Cliente ${client.status === "active" ? "inativado" : "ativado"} com sucesso`,
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao alterar status do cliente",
      );
    },
  });

  const deleteClientAction = useAction(deleteClient, {
    onSuccess: () => {
      toast.success("Cliente excluído permanentemente com sucesso");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir o cliente",
      );
    },
  });

  const handleToggleStatus = () => {
    if (!client) return;
    if (!activeClinicId) {
      toast.error("Selecione uma clínica antes de alterar o cliente");
      return;
    }
    toggleStatusAction.execute({
      id: client.id,
      status: client.status === "active" ? "inactive" : "active",
      clinicId: activeClinicId,
    });
  };

  const handleDelete = () => {
    if (!client) return;
    if (!activeClinicId) {
      toast.error("Selecione uma clínica antes de excluir o cliente");
      return;
    }
    deleteClientAction.execute({ id: client.id, clinicId: activeClinicId });
  };

  const isInactive = client.status === "inactive";

  return (
    <>
      <Dialog open={upsertDialogIsOpen} onOpenChange={setUpsertDialogIsOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{client.name}</DropdownMenuLabel>
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
                      Tem certeza que deseja inativar esse cliente?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      O cliente será marcado como inativo e não aparecerá nas
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
                    Tem certeza que deseja excluir permanentemente esse cliente?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O cliente será excluído
                    permanentemente do sistema, incluindo todo seu histórico.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleteClientAction.status === "executing"}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir Permanentemente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>

        <UpsertClientForm
          isOpen={upsertDialogIsOpen}
          client={client}
          onSuccess={() => setUpsertDialogIsOpen(false)}
        />
      </Dialog>
    </>
  );
}

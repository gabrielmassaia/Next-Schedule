"use client";

import { AtSign, Phone, TrashIcon, User2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { toggleClientStatus } from "@/actions/deactivate-client";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { clientsTable } from "@/db/schema";
import { useActiveClinic } from "@/providers/active-clinic";

import UpsertClientForm from "./upsert-client-form";

interface ClientCardProps {
  client: typeof clientsTable.$inferSelect;
}

export default function ClientCard({ client }: ClientCardProps) {
  const [isUpsertDialogOpen, setIsUpsertDialogOpen] = useState(false);
  const { activeClinicId } = useActiveClinic();

  const clientInitial = client.name
    .split(" ")
    .map((name) => name[0])
    .join("");

  const deactivateClientAction = useAction(toggleClientStatus, {
    onSuccess: () => {
      toast.success(
        `Cliente ${client.status === "active" ? "inativado" : "ativado"} com sucesso`,
      );
    },
    onError: () => {
      toast.error("Erro ao alterar status do cliente");
    },
  });

  const handleDeactivateClient = () => {
    if (!activeClinicId) {
      toast.error("Selecione uma clínica antes de alterar o cliente");
      return;
    }
    deactivateClientAction.execute({
      id: client.id,
      status: client.status === "active" ? "inactive" : "active",
      clinicId: activeClinicId,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{clientInitial}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{client.name}</h3>
            <p className="text-muted-foreground text-sm">
              {client.sex === "male" ? "Masculino" : "Feminino"}
            </p>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-col gap-2">
        <Badge variant="outline">
          <AtSign className="mr-1 h-4 w-4" />
          {client.email}
        </Badge>
        <Badge variant="outline">
          <Phone className="mr-1 h-4 w-4" />
          {client.phoneNumber}
        </Badge>
        <Badge variant="outline">
          <User2 className="mr-1 h-4 w-4" />
          {client.sex === "male" ? "Masculino" : "Feminino"}
        </Badge>
      </CardContent>
      <Separator />
      <CardFooter className="flex gap-2">
        <Dialog open={isUpsertDialogOpen} onOpenChange={setIsUpsertDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1">Editar Cadastro</Button>
          </DialogTrigger>
          <UpsertClientForm
            isOpen={isUpsertDialogOpen}
            client={client}
            onSuccess={() => setIsUpsertDialogOpen(false)}
          />
        </Dialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="flex-1">
              <TrashIcon className="h-4 w-4" />
              {client.status === "inactive" ? "Reativar Cliente" : "Inativar Cliente"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {client.status === "inactive"
                  ? "Deseja reativar este cliente?"
                  : "Tem certeza que deseja inativar este cliente?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {client.status === "inactive"
                  ? "O cliente voltará a aparecer nas listagens e poderá ser agendado novamente."
                  : "Essa ação não pode ser desfeita. O cliente ficará invisível nas listagens por padrão."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeactivateClient}>
                {client.status === "inactive" ? "Reativar" : "Inativar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

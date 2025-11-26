"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createApiKey } from "@/actions/integration-api-keys/create-api-key";
import { revokeApiKey } from "@/actions/integration-api-keys/revoke-api-key";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const createKeySchema = z.object({
  name: z.string().trim().min(1, { message: "Informe um nome" }).max(120),
});

interface IntegrationApiKeysProps {
  apiKeys: {
    id: string;
    name: string;
    clinicName: string;
    createdAt: string;
    lastUsedAt: string | null;
  }[];
}

export function IntegrationApiKeys({ apiKeys }: IntegrationApiKeysProps) {
  const router = useRouter();
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const form = useForm<z.infer<typeof createKeySchema>>({
    resolver: zodResolver(createKeySchema),
    defaultValues: {
      name: "",
    },
  });

  const createKeyAction = useAction(createApiKey, {
    onSuccess: ({ data }) => {
      if (data?.apiKey) {
        setNewKeyValue(data.apiKey);
        setIsDialogOpen(true);
        toast.success("Chave de API criada com sucesso");
        router.refresh();
        form.reset();
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a chave",
      );
    },
  });

  const revokeKeyAction = useAction(revokeApiKey, {
    onSuccess: () => {
      toast.success("Chave revogada com sucesso");
      router.refresh();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível revogar a chave",
      );
    },
  });

  const handleCreateKey = (values: z.infer<typeof createKeySchema>) => {
    createKeyAction.execute(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chaves de API para integrações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog
          open={isDialogOpen || newKeyValue !== null}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              form.reset();
              setNewKeyValue(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              Criar nova chave
            </Button>
          </DialogTrigger>
          <DialogContent>
            {newKeyValue ? (
              <div className="space-y-3">
                <DialogHeader>
                  <DialogTitle>Copie sua nova chave</DialogTitle>
                  <DialogDescription>
                    Esta chave só será exibida uma vez. Armazene em um local
                    seguro.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  readOnly
                  value={newKeyValue}
                  onFocus={(e) => e.target.select()}
                />
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(newKeyValue);
                      toast.success(
                        "Chave copiada para a área de transferência",
                      );
                      setNewKeyValue(null);
                      setIsDialogOpen(false);
                    }}
                  >
                    Copiar e fechar
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleCreateKey)}
                  className="space-y-4"
                >
                  <DialogHeader>
                    <DialogTitle>Nova chave de API</DialogTitle>
                    <DialogDescription>
                      Dê um nome para identificar esta chave em futuras
                      integrações.
                    </DialogDescription>
                  </DialogHeader>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: N8N - automações"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={createKeyAction.status === "executing"}
                    >
                      {createKeyAction.status === "executing"
                        ? "Gerando..."
                        : "Gerar chave"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Clínica</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead>Último uso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground text-center text-sm"
                >
                  Nenhuma chave criada até o momento.
                </TableCell>
              </TableRow>
            ) : (
              apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>{key.name}</TableCell>
                  <TableCell>{key.clinicName}</TableCell>
                  <TableCell>
                    {new Date(key.createdAt).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {key.lastUsedAt
                      ? new Date(key.lastUsedAt).toLocaleString("pt-BR")
                      : "Nunca utilizada"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      onClick={() => revokeKeyAction.execute({ id: key.id })}
                      disabled={revokeKeyAction.status === "executing"}
                    >
                      Revogar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

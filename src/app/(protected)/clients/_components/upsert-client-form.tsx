"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import z from "zod";

import { upsertClient } from "@/actions/upsert-client";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clientsTable } from "@/db/schema";
import { useActiveClinic } from "@/providers/active-clinic";

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Nome é obrigatório" })
    .min(3, { message: "Nome deve ter no mínimo 3 caracteres" })
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" })
    .regex(/^[a-zA-ZÀ-ÿ\s]*$/, {
      message: "Nome deve conter apenas letras e espaços",
    }),
  email: z
    .string()
    .min(1, { message: "Email é obrigatório" })
    .email({ message: "Email inválido" })
    .max(100, { message: "Email deve ter no máximo 100 caracteres" }),
  phoneNumber: z
    .string()
    .min(1, { message: "Telefone é obrigatório" })
    .length(11, { message: "Telefone deve ter 11 dígitos" })
    .regex(/^\d+$/, { message: "Telefone deve conter apenas números" }),
  sex: z.enum(["male", "female"], {
    required_error: "Sexo é obrigatório",
  }),
  status: z.enum(["active", "inactive"]),
});

type FormValues = z.infer<typeof formSchema>;

interface UpsertClientFormProps {
  isOpen: boolean;
  client?: typeof clientsTable.$inferSelect;
  onSuccess?: () => void;
}

export default function UpsertClientForm({
  isOpen,
  client,
  onSuccess,
}: UpsertClientFormProps) {
  const { activeClinicId } = useActiveClinic();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name ?? "",
      email: client?.email ?? "",
      phoneNumber: client?.phoneNumber ?? "",
      sex: client?.sex ?? "male",
      status: client?.status ?? "active",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  useEffect(() => {
    if (client && isOpen) {
      form.reset({
        name: client.name,
        email: client.email,
        phoneNumber: client.phoneNumber,
        sex: client.sex,
        status: client.status,
      });
    }
  }, [client, form, isOpen]);

  const upsertClientAction = useAction(upsertClient, {
    onSuccess: () => {
      toast.success("Cliente salvo com sucesso");
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erro ao salvar cliente");
      console.error(error);
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!activeClinicId) {
      toast.error("Selecione uma clínica antes de salvar o cliente");
      return;
    }

    upsertClientAction.execute({
      ...values,
      id: client?.id,
      clinicId: activeClinicId,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {client ? client.name : "Adicionar cliente"}
        </DialogTitle>
        <DialogDescription>
          {client
            ? "Edite as informações desse cliente."
            : "Adicione um novo cliente."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Digite o nome completo do cliente"
                    autoComplete="name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    placeholder="Digite o email do cliente"
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <PatternFormat
                    format="(##) #####-####"
                    mask="_"
                    customInput={Input}
                    value={field.value}
                    onValueChange={(values) => {
                      field.onChange(values.value);
                    }}
                    placeholder="Digite o telefone do cliente"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o sexo do cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={upsertClientAction.isPending}>
              {upsertClientAction.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : client ? (
                "Salvar"
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

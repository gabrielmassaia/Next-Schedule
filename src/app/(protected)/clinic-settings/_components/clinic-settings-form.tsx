"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { deleteClinic } from "@/actions/delete-clinic";
import { updateClinic } from "@/actions/update-clinic";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { clinicNichesTable } from "@/db/schema";
import type { ClinicSummary } from "@/lib/clinic-session";

const clinicFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Nome da clínica é obrigatório" })
    .max(80, {
      message: "Nome da clínica deve conter no máximo 80 caracteres",
    }),
  nicheId: z
    .string({ required_error: "Nicho da clínica é obrigatório" })
    .uuid({ message: "Nicho inválido" }),
  cnpj: z
    .string()
    .trim()
    .min(14, { message: "CNPJ é obrigatório" })
    .max(18, { message: "CNPJ deve conter no máximo 18 caracteres" }),
  phone: z
    .string()
    .trim()
    .min(10, { message: "Telefone é obrigatório" })
    .max(18, { message: "Telefone deve conter no máximo 18 caracteres" }),
  email: z
    .string()
    .email({ message: "E-mail inválido" })
    .optional()
    .or(z.literal("")),
  addressLine1: z.string().trim().min(1, { message: "Endereço é obrigatório" }),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(1, { message: "Cidade é obrigatória" }),
  state: z
    .string()
    .trim()
    .length(2, { message: "UF deve conter 2 caracteres" })
    .transform((value) => value.toUpperCase()),
  zipCode: z
    .string()
    .trim()
    .min(8, { message: "CEP é obrigatório" })
    .max(9, { message: "CEP deve conter no máximo 9 caracteres" }),
});

interface ClinicSettingsFormProps {
  clinic: ClinicSummary;
  niches: (typeof clinicNichesTable.$inferSelect)[];
}

export function ClinicSettingsForm({
  clinic,
  niches,
}: ClinicSettingsFormProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<z.infer<typeof clinicFormSchema>>({
    resolver: zodResolver(clinicFormSchema),
    defaultValues: {
      name: clinic.name,
      nicheId: clinic.niche?.id ?? niches[0]?.id ?? "",
      cnpj: clinic.cnpj,
      phone: clinic.phone,
      email: clinic.email ?? "",
      addressLine1: clinic.addressLine1,
      addressLine2: clinic.addressLine2 ?? "",
      city: clinic.city,
      state: clinic.state,
      zipCode: clinic.zipCode,
    },
  });

  async function onSubmit(data: z.infer<typeof clinicFormSchema>) {
    try {
      await updateClinic({
        clinicId: clinic.id,
        name: data.name,
        nicheId: data.nicheId,
        cnpj: data.cnpj,
        phone: data.phone,
        email: data.email || undefined,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      });
      toast.success("Clínica atualizada com sucesso");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar clínica",
      );
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteClinic(clinic.id);
    } catch (error) {
      if (isRedirectError(error)) {
        return;
      }
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir clínica",
      );
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Clínica</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nicheId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nicho da clínica</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um nicho" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {niches.map((niche) => (
                          <SelectItem key={niche.id} value={niche.id}>
                            {niche.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Salvar alterações"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-sm">
            Ao excluir esta clínica, todos os dados relacionados (profissionais,
            clientes, agendamentos) serão permanentemente removidos. Esta ação
            não pode ser desfeita.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Excluir clínica
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente
                  a clínica <strong>{clinic.name}</strong> e todos os dados
                  relacionados (profissionais, clientes, agendamentos).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sim, excluir clínica
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

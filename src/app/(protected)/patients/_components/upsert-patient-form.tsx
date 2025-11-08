"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import z from "zod";

import { upsertPatient } from "@/actions/upsert-patient";
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
import { patientsTable } from "@/db/schema";
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

interface UpsertPatientFormProps {
  isOpen: boolean;
  patient?: typeof patientsTable.$inferSelect;
  onSuccess?: () => void;
}

export default function UpsertPatientForm({
  isOpen,
  patient,
  onSuccess,
}: UpsertPatientFormProps) {
  const { activeClinicId } = useActiveClinic();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: patient?.name ?? "",
      email: patient?.email ?? "",
      phoneNumber: patient?.phoneNumber ?? "",
      sex: patient?.sex ?? "male",
      status: patient?.status ?? "active",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  useEffect(() => {
    if (patient && isOpen) {
      form.reset({
        name: patient.name,
        email: patient.email,
        phoneNumber: patient.phoneNumber,
        sex: patient.sex,
        status: patient.status,
      });
    }
  }, [patient, form, isOpen]);

  const upsertPatientAction = useAction(upsertPatient, {
    onSuccess: () => {
      toast.success("Paciente salvo com sucesso");
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erro ao salvar paciente");
      console.error(error);
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!activeClinicId) {
      toast.error("Selecione uma clínica antes de salvar o paciente");
      return;
    }

    upsertPatientAction.execute({
      ...values,
      id: patient?.id,
      clinicId: activeClinicId,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {patient ? patient.name : "Adicionar paciente"}
        </DialogTitle>
        <DialogDescription>
          {patient
            ? "Edite as informações desse paciente."
            : "Adicione um novo paciente."}
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
                    placeholder="Digite o nome completo do paciente"
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
                    placeholder="Digite o email do paciente"
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
                    placeholder="Digite o telefone do paciente"
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
                      <SelectValue placeholder="Selecione o sexo do paciente" />
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
            <Button type="submit" disabled={upsertPatientAction.isPending}>
              {upsertPatientAction.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : patient ? (
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

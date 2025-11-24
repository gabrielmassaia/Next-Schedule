"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, TrashIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import * as React from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import z from "zod";

import { deleteProfessional } from "@/actions/delete-professional";
import { getClinicSpecialties } from "@/actions/specialties";
import { upsertProfessional } from "@/actions/upsert-professional";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { professionalsTable } from "@/db/schema";
import { useActiveClinic } from "@/providers/active-clinic";

const formSchema = z
  .object({
    name: z.string().trim().min(1, { message: "Nome é obrigatório" }),
    specialty: z
      .string()
      .trim()
      .min(1, { message: "Especialidade é obrigatória" }),
    appointmentPrice: z
      .number()
      .min(1, { message: "Preço da consulta é obrigatório" }),
    availableFromWeekDay: z
      .string()
      .min(1, { message: "Dia da semana é obrigatório" }),
    availableToWeekDay: z
      .string()
      .min(1, { message: "Dia da semana é obrigatório" }),
    availableFromTime: z
      .string()
      .trim()
      .min(1, { message: "Hora de início é obrigatória" }),
    availableToTime: z
      .string()
      .trim()
      .min(1, { message: "Hora de término é obrigatória" }),
  })
  .refine(
    (data) => {
      return data.availableFromTime < data.availableToTime;
    },
    {
      message: "A hora de início deve ser anterior à hora de término",
      path: ["availableToTime"],
    },
  );

interface UpsertProfessionalFormProps {
  professional?: typeof professionalsTable.$inferSelect;
  onSuccess?: () => void;
}

export default function UpsertProfessionalForm({
  professional,
  onSuccess,
}: UpsertProfessionalFormProps) {
  const { activeClinicId } = useActiveClinic();
  const [specialties, setSpecialties] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [loadingSpecialties, setLoadingSpecialties] = React.useState(true);

  // Load specialties for the clinic
  React.useEffect(() => {
    if (!activeClinicId) return;

    const loadSpecialties = async () => {
      try {
        setLoadingSpecialties(true);
        const data = await getClinicSpecialties(activeClinicId);
        setSpecialties(data);
      } catch (error) {
        console.error("Error loading specialties:", error);
        toast.error("Erro ao carregar especialidades");
      } finally {
        setLoadingSpecialties(false);
      }
    };

    loadSpecialties();
  }, [activeClinicId]);

  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: professional?.name ?? "",
      specialty: professional?.specialty ?? "",
      appointmentPrice: professional?.appointmentPriceInCents
        ? professional.appointmentPriceInCents / 100
        : 0,
      availableFromWeekDay:
        professional?.availableFromWeekDay?.toString() ?? "1",
      availableToWeekDay: professional?.availableToWeekDay?.toString() ?? "5",
      availableFromTime: professional?.availableFromTime ?? "",
      availableToTime: professional?.availableToTime ?? "",
    },
  });

  const upsertProfessionalAction = useAction(upsertProfessional, {
    onSuccess: () => {
      toast.success("Profissional salvo com sucesso");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erro ao salvar profissional");
      console.error(error);
    },
  });

  const deleteProfessionalAction = useAction(deleteProfessional, {
    onSuccess: () => {
      toast.success("Profissional excluído com sucesso");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erro ao excluir profissional");
      console.error(error);
    },
  });

  const handleDeleteProfessionalClick = () => {
    if (!professional?.id) {
      return;
    }

    if (!activeClinicId) {
      toast.error("Selecione uma clínica antes de excluir o profissional");
      return;
    }

    deleteProfessionalAction.execute({
      id: professional.id,
      clinicId: activeClinicId,
    });
    toast.success("Profissional excluído com sucesso");
    onSuccess?.();
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!activeClinicId) {
      toast.error("Selecione uma clínica antes de salvar");
      return;
    }

    upsertProfessionalAction.execute({
      ...values,
      id: professional?.id,
      availableFromWeekDay: parseInt(values.availableFromWeekDay),
      availableToWeekDay: parseInt(values.availableToWeekDay),
      appointmentPriceInCents: values.appointmentPrice * 100,
      clinicId: activeClinicId,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {professional ? professional.name : "Adicionar profissional"}
        </DialogTitle>
        <DialogDescription>
          {professional
            ? "Edite as informações desse profissional."
            : "Adicione um novo profissional."}
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="specialty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especialidade</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma especialidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingSpecialties ? (
                      <SelectItem value="loading" disabled>
                        Carregando...
                      </SelectItem>
                    ) : specialties.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Nenhuma especialidade disponível
                      </SelectItem>
                    ) : (
                      specialties.map((specialty) => (
                        <SelectItem key={specialty.id} value={specialty.name}>
                          {specialty.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="appointmentPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço da consulta</FormLabel>
                <NumericFormat
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue);
                  }}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  fixedDecimalScale
                  prefix="R$"
                  customInput={Input}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="availableFromWeekDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia inicial de disponibilidade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um dia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Domingo</SelectItem>
                      <SelectItem value="1">Segunda</SelectItem>
                      <SelectItem value="2">Terça</SelectItem>
                      <SelectItem value="3">Quarta</SelectItem>
                      <SelectItem value="4">Quinta</SelectItem>
                      <SelectItem value="5">Sexta</SelectItem>
                      <SelectItem value="6">Sábado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="availableToWeekDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia final de disponibilidade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um dia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Domingo</SelectItem>
                      <SelectItem value="1">Segunda</SelectItem>
                      <SelectItem value="2">Terça</SelectItem>
                      <SelectItem value="3">Quarta</SelectItem>
                      <SelectItem value="4">Quinta</SelectItem>
                      <SelectItem value="5">Sexta</SelectItem>
                      <SelectItem value="6">Sábado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="availableFromTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário inicial de disponibilidade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um horário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Manhã</SelectLabel>
                        <SelectItem value="05:00:00">05:00</SelectItem>
                        <SelectItem value="05:30:00">05:30</SelectItem>
                        <SelectItem value="06:00:00">06:00</SelectItem>
                        <SelectItem value="06:30:00">06:30</SelectItem>
                        <SelectItem value="07:00:00">07:00</SelectItem>
                        <SelectItem value="07:30:00">07:30</SelectItem>
                        <SelectItem value="08:00:00">08:00</SelectItem>
                        <SelectItem value="08:30:00">08:30</SelectItem>
                        <SelectItem value="09:00:00">09:00</SelectItem>
                        <SelectItem value="09:30:00">09:30</SelectItem>
                        <SelectItem value="10:00:00">10:00</SelectItem>
                        <SelectItem value="10:30:00">10:30</SelectItem>
                        <SelectItem value="11:00:00">11:00</SelectItem>
                        <SelectItem value="11:30:00">11:30</SelectItem>
                        <SelectItem value="12:00:00">12:00</SelectItem>
                        <SelectItem value="12:30:00">12:30</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Tarde</SelectLabel>
                        <SelectItem value="13:00:00">13:00</SelectItem>
                        <SelectItem value="13:30:00">13:30</SelectItem>
                        <SelectItem value="14:00:00">14:00</SelectItem>
                        <SelectItem value="14:30:00">14:30</SelectItem>
                        <SelectItem value="15:00:00">15:00</SelectItem>
                        <SelectItem value="15:30:00">15:30</SelectItem>
                        <SelectItem value="16:00:00">16:00</SelectItem>
                        <SelectItem value="16:30:00">16:30</SelectItem>
                        <SelectItem value="17:00:00">17:00</SelectItem>
                        <SelectItem value="17:30:00">17:30</SelectItem>
                        <SelectItem value="18:00:00">18:00</SelectItem>
                        <SelectItem value="18:30:00">18:30</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Noite</SelectLabel>
                        <SelectItem value="19:00:00">19:00</SelectItem>
                        <SelectItem value="19:30:00">19:30</SelectItem>
                        <SelectItem value="20:00:00">20:00</SelectItem>
                        <SelectItem value="20:30:00">20:30</SelectItem>
                        <SelectItem value="21:00:00">21:00</SelectItem>
                        <SelectItem value="21:30:00">21:30</SelectItem>
                        <SelectItem value="22:00:00">22:00</SelectItem>
                        <SelectItem value="22:30:00">22:30</SelectItem>
                        <SelectItem value="23:00:00">23:00</SelectItem>
                        <SelectItem value="23:30:00">23:30</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="availableToTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário final de disponibilidade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um horário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Manhã</SelectLabel>
                        <SelectItem value="05:00:00">05:00</SelectItem>
                        <SelectItem value="05:30:00">05:30</SelectItem>
                        <SelectItem value="06:00:00">06:00</SelectItem>
                        <SelectItem value="06:30:00">06:30</SelectItem>
                        <SelectItem value="07:00:00">07:00</SelectItem>
                        <SelectItem value="07:30:00">07:30</SelectItem>
                        <SelectItem value="08:00:00">08:00</SelectItem>
                        <SelectItem value="08:30:00">08:30</SelectItem>
                        <SelectItem value="09:00:00">09:00</SelectItem>
                        <SelectItem value="09:30:00">09:30</SelectItem>
                        <SelectItem value="10:00:00">10:00</SelectItem>
                        <SelectItem value="10:30:00">10:30</SelectItem>
                        <SelectItem value="11:00:00">11:00</SelectItem>
                        <SelectItem value="11:30:00">11:30</SelectItem>
                        <SelectItem value="12:00:00">12:00</SelectItem>
                        <SelectItem value="12:30:00">12:30</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Tarde</SelectLabel>
                        <SelectItem value="13:00:00">13:00</SelectItem>
                        <SelectItem value="13:30:00">13:30</SelectItem>
                        <SelectItem value="14:00:00">14:00</SelectItem>
                        <SelectItem value="14:30:00">14:30</SelectItem>
                        <SelectItem value="15:00:00">15:00</SelectItem>
                        <SelectItem value="15:30:00">15:30</SelectItem>
                        <SelectItem value="16:00:00">16:00</SelectItem>
                        <SelectItem value="16:30:00">16:30</SelectItem>
                        <SelectItem value="17:00:00">17:00</SelectItem>
                        <SelectItem value="17:30:00">17:30</SelectItem>
                        <SelectItem value="18:00:00">18:00</SelectItem>
                        <SelectItem value="18:30:00">18:30</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Noite</SelectLabel>
                        <SelectItem value="19:00:00">19:00</SelectItem>
                        <SelectItem value="19:30:00">19:30</SelectItem>
                        <SelectItem value="20:00:00">20:00</SelectItem>
                        <SelectItem value="20:30:00">20:30</SelectItem>
                        <SelectItem value="21:00:00">21:00</SelectItem>
                        <SelectItem value="21:30:00">21:30</SelectItem>
                        <SelectItem value="22:00:00">22:00</SelectItem>
                        <SelectItem value="22:30:00">22:30</SelectItem>
                        <SelectItem value="23:00:00">23:00</SelectItem>
                        <SelectItem value="23:30:00">23:30</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <DialogFooter>
            {professional && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <TrashIcon className="h-4 w-4" /> Excluir Profissional
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Tem certeza que deseja excluir esse profissional?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação não pode ser desfeita. Isso irá excluir o
                      profissional e remover todos os seus dados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProfessionalClick}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="submit" disabled={upsertProfessionalAction.isPending}>
              {upsertProfessionalAction.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : professional ? (
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

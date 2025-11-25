"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { addAppointment } from "@/actions/add-appointment";
import { getAvailableTimes } from "@/actions/get-available-times";
import { updateAppointment } from "@/actions/update-appointment";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  appointmentsTable,
  clientsTable,
  professionalsTable,
} from "@/db/schema";
import { cn } from "@/lib/utils";
import { useActiveClinic } from "@/providers/active-clinic";

const formSchema = z.object({
  clientId: z.string().min(1, {
    message: "Cliente é obrigatório.",
  }),
  professionalId: z.string().min(1, {
    message: "Profissional é obrigatório.",
  }),
  appointmentPrice: z.number().min(1, {
    message: "Valor da consulta é obrigatório.",
  }),
  date: z.date({
    message: "Data é obrigatória.",
  }),
  time: z.string().min(1, {
    message: "Horário é obrigatório.",
  }),
});

interface AddAppointmentFormProps {
  isOpen: boolean;
  clients: (typeof clientsTable.$inferSelect)[];
  professionals: (typeof professionalsTable.$inferSelect)[];
  onSuccess?: () => void;
  initialData?: typeof appointmentsTable.$inferSelect;
}

const AddAppointmentForm = ({
  clients,
  professionals,
  onSuccess,
  isOpen,
  initialData,
}: AddAppointmentFormProps) => {
  const { activeClinicId } = useActiveClinic();
  const isEditing = !!initialData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: initialData?.clientId || "",
      professionalId: initialData?.professionalId || "",
      appointmentPrice: initialData
        ? initialData.appointmentPriceInCents / 100
        : 0,
      date: initialData ? new Date(initialData.date) : undefined,
      time: initialData ? dayjs(initialData.date).format("HH:mm") : "",
    },
  });

  const selectedProfessionalId = form.watch("professionalId");
  const selectedDate = form.watch("date");

  const { data: availableTimes } = useQuery({
    queryKey: [
      "available-times",
      selectedDate,
      selectedProfessionalId,
      activeClinicId,
      initialData?.id, // Add ID to query key to force refresh if editing different appointment
    ],
    queryFn: () =>
      getAvailableTimes({
        date: dayjs(selectedDate).format("YYYY-MM-DD"),
        professionalId: selectedProfessionalId,
        clinicId: activeClinicId!,
        excludeAppointmentId: initialData?.id,
      }),
    enabled: !!selectedDate && !!selectedProfessionalId && !!activeClinicId,
  });

  useEffect(() => {
    if (selectedProfessionalId) {
      const selectedProfessional = professionals.find(
        (professional) => professional.id === selectedProfessionalId,
      );

      if (selectedProfessional) {
        const currentPrice = form.getValues("appointmentPrice");
        if (currentPrice === 0 && !initialData) {
          form.setValue(
            "appointmentPrice",
            selectedProfessional.appointmentPriceInCents / 100,
          );
        } else if (selectedProfessionalId !== initialData?.professionalId) {
          form.setValue(
            "appointmentPrice",
            selectedProfessional.appointmentPriceInCents / 100,
          );
        }
      }
    } else {
      if (!initialData) {
        form.setValue("appointmentPrice", 0);
      }
    }
  }, [selectedProfessionalId, professionals, form, initialData]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          clientId: initialData.clientId,
          professionalId: initialData.professionalId,
          appointmentPrice: initialData.appointmentPriceInCents / 100,
          date: new Date(initialData.date),
          time: dayjs(initialData.date).format("HH:mm"),
        });
      } else {
        form.reset({
          clientId: "",
          professionalId: "",
          appointmentPrice: 0,
          date: undefined,
          time: "",
        });
      }
    }
  }, [isOpen, form, initialData]);

  const createAppointmentAction = useAction(addAppointment, {
    onSuccess: () => {
      toast.success("Agendamento criado com sucesso.");
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao criar agendamento.");
    },
  });

  const updateAppointmentAction = useAction(updateAppointment, {
    onSuccess: () => {
      toast.success("Agendamento atualizado com sucesso.");
      onSuccess?.();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao atualizar agendamento.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!activeClinicId) {
      toast.error("Selecione uma clínica para criar o agendamento");
      return;
    }

    if (isEditing && initialData) {
      updateAppointmentAction.execute({
        ...values,
        id: initialData.id,
        clinicId: activeClinicId,
        appointmentPriceInCents: values.appointmentPrice * 100,
      });
    } else {
      createAppointmentAction.execute({
        ...values,
        clinicId: activeClinicId,
        appointmentPriceInCents: values.appointmentPrice * 100,
      });
    }
  };

  const isDateAvailable = (date: Date) => {
    if (!selectedProfessionalId) return false;
    const selectedProfessional = professionals.find(
      (professional) => professional.id === selectedProfessionalId,
    );
    if (!selectedProfessional) return false;
    const dayOfWeek = date.getDay();
    return (
      dayOfWeek >= selectedProfessional?.availableFromWeekDay &&
      dayOfWeek <= selectedProfessional?.availableToWeekDay
    );
  };

  const isDateTimeEnabled = !!selectedProfessionalId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPending =
    createAppointmentAction.isPending || updateAppointmentAction.isPending;

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Editar agendamento" : "Novo agendamento"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Edite os dados do agendamento."
            : "Crie um novo agendamento para sua clínica."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isEditing}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="professionalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profissional</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um profissional" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {professionals.map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.name} - {professional.specialty}
                      </SelectItem>
                    ))}
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
                <FormLabel>Valor da consulta</FormLabel>
                <NumericFormat
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value.floatValue);
                  }}
                  decimalScale={2}
                  fixedDecimalScale
                  decimalSeparator=","
                  thousandSeparator="."
                  prefix="R$ "
                  allowNegative={false}
                  disabled={!selectedProfessionalId}
                  customInput={Input}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        disabled={!isDateTimeEnabled}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const compareDate = new Date(date);
                        compareDate.setHours(0, 0, 0, 0);
                        // Allow the initial date even if it's in the past or technically "unavailable" (e.g. schedule changed)
                        if (
                          initialData &&
                          compareDate.getTime() ===
                            new Date(initialData.date).setHours(0, 0, 0, 0)
                        ) {
                          return false;
                        }
                        return compareDate < today || !isDateAvailable(date);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!isDateTimeEnabled || !selectedDate}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(availableTimes?.data ?? [])
                      // Filtra horários se a data for hoje
                      .filter((time) => {
                        if (!selectedDate) return true;
                        const isToday =
                          dayjs(selectedDate).format("YYYY-MM-DD") ===
                          dayjs().format("YYYY-MM-DD");
                        if (!isToday) return true;
                        // time.value deve estar no formato "HH:mm"
                        const [hour, minute] = time.value
                          .split(":")
                          .map(Number);
                        const now = dayjs();
                        // Só permite horários futuros
                        return (
                          hour > now.hour() ||
                          (hour === now.hour() && minute > now.minute())
                        );
                      })
                      .map((time) => (
                        <SelectItem
                          key={time.value}
                          value={time.value}
                          disabled={
                            !time.available &&
                            time.value !==
                              (initialData
                                ? dayjs(initialData.date).format("HH:mm")
                                : "")
                          } // Allow selecting current time if editing
                        >
                          {time.label}{" "}
                          {!time.available &&
                            time.value !==
                              (initialData
                                ? dayjs(initialData.date).format("HH:mm")
                                : "") &&
                            "(Indisponível)"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? "Atualizando..."
                  : "Criando..."
                : isEditing
                  ? "Atualizar agendamento"
                  : "Criar agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default AddAppointmentForm;

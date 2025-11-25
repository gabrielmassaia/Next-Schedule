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
import { getClinicDetails } from "@/actions/get-clinic-details";
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
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { professionalsTable } from "@/db/schema";
import { maskCPF, maskPhone, unmask } from "@/lib/masks";
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
    workingDays: z
      .array(z.number())
      .min(1, { message: "Selecione pelo menos um dia de atendimento" }),
    availableFromTime: z
      .string()
      .trim()
      .min(1, { message: "Hora de início é obrigatória" }),
    availableToTime: z
      .string()
      .trim()
      .min(1, { message: "Hora de término é obrigatória" }),
    hasCustomDuration: z.boolean(),
    appointmentDuration: z.number().optional(),
    cpf: z.string().optional(),
    phone: z.string().optional(),
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
  const [clinicDetails, setClinicDetails] = React.useState<{
    hasLunchBreak: boolean;
    lunchBreakStart: string | null;
    lunchBreakEnd: string | null;
    operatingHours: {
      dayOfWeek: number;
      isActive: boolean;
      startTime: string;
      endTime: string;
    }[];
  } | null>(null);

  // Load specialties and clinic details
  React.useEffect(() => {
    if (!activeClinicId) return;

    const loadData = async () => {
      try {
        setLoadingSpecialties(true);
        const [specialtiesData, clinicDetailsData] = await Promise.all([
          getClinicSpecialties(activeClinicId),
          getClinicDetails(activeClinicId),
        ]);

        setSpecialties(specialtiesData);
        setClinicDetails(clinicDetailsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Erro ao carregar dados da clínica");
      } finally {
        setLoadingSpecialties(false);
      }
    };

    loadData();
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
      workingDays: professional?.workingDays ?? [],
      availableFromTime: professional?.availableFromTime ?? "",
      availableToTime: professional?.availableToTime ?? "",
      hasCustomDuration: !!professional?.appointmentDuration,
      appointmentDuration: professional?.appointmentDuration ?? 30,
      cpf: professional?.cpf ? maskCPF(professional.cpf) : "",
      phone: professional?.phone ? maskPhone(professional.phone) : "",
    },
  });

  React.useEffect(() => {
    if (professional) {
      form.reset({
        name: professional.name,
        specialty: professional.specialty,
        appointmentPrice: professional.appointmentPriceInCents / 100,
        workingDays: professional.workingDays,
        availableFromTime: professional.availableFromTime,
        availableToTime: professional.availableToTime,
        hasCustomDuration: !!professional.appointmentDuration,
        appointmentDuration: professional.appointmentDuration ?? 30,
        cpf: professional.cpf ? maskCPF(professional.cpf) : "",
        phone: professional.phone ? maskPhone(professional.phone) : "",
      });
    } else {
      form.reset({
        name: "",
        specialty: "",
        appointmentPrice: 0,
        workingDays: [],
        availableFromTime: "",
        availableToTime: "",
        hasCustomDuration: false,
        appointmentDuration: 30,
        cpf: "",
        phone: "",
      });
    }
  }, [professional, form]);

  const hasCustomDuration = form.watch("hasCustomDuration");
  const appointmentDuration = form.watch("appointmentDuration") || 30;

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
      appointmentPriceInCents: values.appointmentPrice * 100,
      clinicId: activeClinicId,
      workingDays: values.workingDays,
      appointmentDuration: values.hasCustomDuration
        ? values.appointmentDuration
        : undefined,
      cpf: values.cpf ? unmask(values.cpf) : undefined,
      phone: values.phone ? unmask(values.phone) : undefined,
    });
  };

  // Generate time slots based on valid range and lunch break
  const generateTimeOptions = () => {
    if (!clinicDetails) return [];

    const activeDays = clinicDetails.operatingHours.filter((oh) => oh.isActive);
    if (activeDays.length === 0) return [];

    let minStart = "23:59";
    let maxEnd = "00:00";

    activeDays.forEach((day) => {
      if (day.startTime < minStart) minStart = day.startTime;
      if (day.endTime > maxEnd) maxEnd = day.endTime;
    });

    if (minStart >= maxEnd) {
      minStart = "05:00";
      maxEnd = "23:30";
    }

    const options = [];
    const [startHour, startMinute] = minStart.split(":").map(Number);
    const [endHour, endMinute] = maxEnd.split(":").map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    const interval = appointmentDuration;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute <= endMinute)
    ) {
      const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}:00`;
      const label = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

      let isLunchBreak = false;
      if (
        clinicDetails.hasLunchBreak &&
        clinicDetails.lunchBreakStart &&
        clinicDetails.lunchBreakEnd
      ) {
        const lunchStart = clinicDetails.lunchBreakStart + ":00";
        const lunchEnd = clinicDetails.lunchBreakEnd + ":00";

        // Calculate slot end time
        const slotEndMinute = currentMinute + interval;
        const slotEndHour = currentHour + Math.floor(slotEndMinute / 60);
        const normalizedSlotEndMinute = slotEndMinute % 60;

        const slotEndTimeString = `${slotEndHour.toString().padStart(2, "0")}:${normalizedSlotEndMinute.toString().padStart(2, "0")}:00`;

        // Check if slot overlaps with lunch break
        // Overlap if: Start < LunchEnd AND End > LunchStart
        // But we want to ensure it fits completely BEFORE or AFTER

        const fitsBeforeLunch = slotEndTimeString <= lunchStart;
        const fitsAfterLunch = timeString >= lunchEnd;

        if (!fitsBeforeLunch && !fitsAfterLunch) {
          isLunchBreak = true;
        }
      }

      if (!isLunchBreak) {
        options.push({ value: timeString, label });
      }

      currentMinute += interval;
      while (currentMinute >= 60) {
        currentHour++;
        currentMinute -= 60;
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const getDayLabel = (day: number) => {
    const days = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];
    return days[day];
  };

  const activeDays =
    clinicDetails?.operatingHours
      .filter((oh) => oh.isActive)
      .map((oh) => oh.dayOfWeek) || [];

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
                <FormLabel>
                  Nome <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    CPF <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(maskCPF(e.target.value));
                      }}
                      maxLength={14}
                    />
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
                  <FormLabel>
                    Telefone <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(maskPhone(e.target.value));
                      }}
                      maxLength={16}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="specialty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Especialidade <span className="text-red-500">*</span>
                </FormLabel>
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
                <FormLabel>
                  Preço da consulta <span className="text-red-500">*</span>
                </FormLabel>
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

          <FormField
            control={form.control}
            name="workingDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Dias de Atendimento <span className="text-red-500">*</span>
                </FormLabel>
                <div className="space-y-4">
                  {/* Available Days Area */}
                  <div>
                    {activeDays.filter((day) => !field.value.includes(day))
                      .length > 0 && (
                      <span className="text-muted-foreground mb-2 block text-sm">
                        Adicionar dia:
                      </span>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {activeDays
                        .filter((day) => !field.value.includes(day))
                        .map((day) => (
                          <Badge
                            key={day}
                            variant="outline"
                            className="hover:bg-secondary cursor-pointer"
                            onClick={() => {
                              field.onChange([...field.value, day].sort());
                            }}
                          >
                            {getDayLabel(day)}
                            <span className="ml-1 text-xs">+</span>
                          </Badge>
                        ))}
                      {activeDays.filter((day) => !field.value.includes(day))
                        .length === 0 && (
                        <span className="text-muted-foreground text-sm italic">
                          Todos os dias disponíveis foram selecionados
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selected Days Area */}
                  {field.value.length > 0 && (
                    <div className="rounded-md border p-4">
                      <span className="text-muted-foreground mb-2 block text-sm">
                        Dias selecionados:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {field.value.sort().map((day: number) => (
                          <Badge
                            key={day}
                            variant="default"
                            className="hover:bg-destructive/90 cursor-pointer"
                            onClick={() => {
                              field.onChange(
                                field.value.filter((d: number) => d !== day),
                              );
                            }}
                          >
                            {getDayLabel(day)}
                            <TrashIcon className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hasCustomDuration"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-y-0 space-x-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">
                  Personalizar tempo médio de atendimento
                </FormLabel>
              </FormItem>
            )}
          />
          {hasCustomDuration && (
            <FormField
              control={form.control}
              name="appointmentDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo em minutos</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="availableFromTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Horário inicial de disponibilidade{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
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
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
              name="availableToTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Horário final de disponibilidade{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
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
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
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

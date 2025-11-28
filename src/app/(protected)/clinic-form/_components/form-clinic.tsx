"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { createClinic } from "@/actions/create-clinic";
import { upsertInsurancePlans } from "@/actions/insurance-plans";
import { upsertOperatingHours } from "@/actions/operating-hours";
import { InsurancePlansInput } from "@/app/(protected)/clinic-form/_components/insurance-plans-input";
import { OperatingHoursInput } from "@/app/(protected)/clinic-form/_components/operating-hours-input";
import { PaymentMethodsInput } from "@/app/(protected)/clinic-form/_components/payment-methods-input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clinicNichesTable } from "@/db/schema";
import { authClient } from "@/lib/auth-client";
import { maskCNPJ, maskPhone, unmask } from "@/lib/masks";
import { useActiveClinic } from "@/providers/active-clinic";

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
  cnpj: z.string().trim().min(1, { message: "CNPJ é obrigatório" }),
  phone: z.string().trim().min(1, { message: "Telefone é obrigatório" }),
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
  // Operating Hours
  operatingHours: z.array(
    z.object({
      dayOfWeek: z.number(),
      isActive: z.boolean(),
      startTime: z.string(),
      endTime: z.string(),
    }),
  ),
  // Lunch Break
  hasLunchBreak: z.boolean(),
  lunchBreakStart: z.string().optional(),
  lunchBreakEnd: z.string().optional(),
  // Service Type & Insurance
  serviceType: z.enum(["convenio", "particular", "ambos"]).optional(),
  insurancePlans: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      ansRegistration: z.string().optional(),
      isManual: z.boolean(),
    }),
  ),
  // Payment Methods
  paymentMethods: z.array(z.string()),
  // Parking
  hasParking: z.boolean(),
});

interface FormClinicProps {
  niches: (typeof clinicNichesTable.$inferSelect)[];
}

export default function FormClinic({ niches }: FormClinicProps) {
  const router = useRouter();
  const { refreshClinics } = useActiveClinic();
  const form = useForm<z.infer<typeof clinicFormSchema>>({
    resolver: zodResolver(clinicFormSchema),
    defaultValues: {
      name: "",
      nicheId: niches[0]?.id ?? "",
      cnpj: "",
      phone: "",
      email: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      operatingHours: [
        { dayOfWeek: 1, isActive: false, startTime: "08:00", endTime: "18:00" },
        { dayOfWeek: 2, isActive: false, startTime: "08:00", endTime: "18:00" },
        { dayOfWeek: 3, isActive: false, startTime: "08:00", endTime: "18:00" },
        { dayOfWeek: 4, isActive: false, startTime: "08:00", endTime: "18:00" },
        { dayOfWeek: 5, isActive: false, startTime: "08:00", endTime: "18:00" },
        { dayOfWeek: 6, isActive: false, startTime: "08:00", endTime: "12:00" },
        { dayOfWeek: 0, isActive: false, startTime: "08:00", endTime: "12:00" },
      ],
      hasLunchBreak: false,
      lunchBreakStart: "12:00",
      lunchBreakEnd: "13:00",
      serviceType: undefined,
      insurancePlans: [],
      paymentMethods: [],
      hasParking: false,
    },
  });

  async function onSubmit(data: z.infer<typeof clinicFormSchema>) {
    try {
      const result = await createClinic({
        name: data.name,
        nicheId: data.nicheId,
        cnpj: unmask(data.cnpj),
        phone: unmask(data.phone),
        email: data.email || undefined,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        hasLunchBreak: data.hasLunchBreak,
        lunchBreakStart: data.hasLunchBreak ? data.lunchBreakStart : undefined,
        lunchBreakEnd: data.hasLunchBreak ? data.lunchBreakEnd : undefined,
        serviceType: data.serviceType,
        paymentMethods: data.paymentMethods,
        hasParking: data.hasParking,
      });

      if (!result.success || !result.clinicId) {
        throw new Error("Falha ao criar clínica");
      }

      // Save operating hours
      await upsertOperatingHours(result.clinicId, data.operatingHours);

      // Save insurance plans if any
      if (data.insurancePlans && data.insurancePlans.length > 0) {
        await upsertInsurancePlans(result.clinicId, data.insurancePlans);
      }

      // Atualizar lista de clínicas no contexto
      await refreshClinics();

      // Forçar refresh do session para manter consistência
      await authClient.getSession();

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      if (isRedirectError(error)) {
        return;
      }

      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao criar clínica";
      toast.error(errorMessage);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Dados Gerais</TabsTrigger>
              <TabsTrigger value="address">Endereço</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nome da clínica <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Minha Clínica" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nicheId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nicho de atuação <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
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

                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        CNPJ <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00.000.000/0000-00"
                          {...field}
                          onChange={(e) => {
                            field.onChange(maskCNPJ(e.target.value));
                          }}
                          maxLength={18}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                          placeholder="(00) 00000-0000"
                          {...field}
                          onChange={(e) => {
                            field.onChange(maskPhone(e.target.value));
                          }}
                          maxLength={15}
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
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="contato@minhaclinica.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="address" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        CEP <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Endereço <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, Número, Bairro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input placeholder="Apto, Sala, Bloco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Cidade <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} />
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
                      <FormLabel>
                        UF <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="SP" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4 space-y-6">
              <OperatingHoursInput />

              <div className="space-y-4 rounded-lg border p-4">
                <FormField
                  control={form.control}
                  name="hasLunchBreak"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Horário de Almoço
                        </FormLabel>
                        <FormDescription>
                          A clínica fecha para horário de almoço?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("hasLunchBreak") && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lunchBreakStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Início do Almoço</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lunchBreakEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fim do Almoço</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <FormField
                  control={form.control}
                  name="hasParking"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Estacionamento
                        </FormLabel>
                        <FormDescription>
                          A clínica possui estacionamento próprio ou conveniado?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="financial" className="mt-4 space-y-6">
              <PaymentMethodsInput />

              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-medium">Convênios e Planos</h3>
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Atendimento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de atendimento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="particular">Particular</SelectItem>
                          <SelectItem value="convenio">Convênio</SelectItem>
                          <SelectItem value="ambos">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(form.watch("serviceType") === "convenio" ||
                  form.watch("serviceType") === "ambos") && (
                  <InsurancePlansInput />
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Criar clínica
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

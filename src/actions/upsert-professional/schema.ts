import { z } from "zod";

export const upsertProfessionalSchema = z
  .object({
    clinicId: z.string().uuid({ message: "Clínica é obrigatória" }),
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, { message: "Nome é obrigatório" }),
    specialty: z.string().min(1, { message: "Especialidade é obrigatória" }),
    appointmentPriceInCents: z
      .number()
      .min(1, { message: "Preço da consulta é obrigatório" }),
    appointmentDuration: z.number().optional(),
    cpf: z.string().optional(),
    phone: z.string().optional(),
    workingDays: z
      .array(z.number().int().min(0).max(6))
      .min(1, { message: "Selecione pelo menos um dia de atendimento" }),
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

export type UpsertProfessionalSchema = z.infer<typeof upsertProfessionalSchema>;

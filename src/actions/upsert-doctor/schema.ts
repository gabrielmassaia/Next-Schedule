import { z } from "zod";

export const upsertDoctorSchema = z
  .object({
    clinicId: z.string().uuid({ message: "Clínica é obrigatória" }),
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, { message: "Nome é obrigatório" }),
    specialty: z
      .string()
      .trim()
      .min(1, { message: "Especialidade é obrigatória" }),
    appointmentPriceInCents: z
      .number()
      .min(1, { message: "Preço da consulta é obrigatório" }),
    availableFromWeekDay: z
      .number()
      .min(0)
      .max(6)
      .refine((val) => val >= 0 && val <= 6, {
        message: "Dia da semana inválido",
      }),
    availableToWeekDay: z
      .number()
      .min(0)
      .max(6)
      .refine((val) => val >= 0 && val <= 6, {
        message: "Dia da semana inválido",
      }),
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

export type UpsertDoctorSchema = z.infer<typeof upsertDoctorSchema>;

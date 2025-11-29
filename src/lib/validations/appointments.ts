import { z } from "zod";

export const addAppointmentSchema = z.object({
  clinicId: z.string().uuid({
    message: "Clínica é obrigatória.",
  }),
  clientId: z.string().uuid({
    message: "Cliente é obrigatório.",
  }),
  professionalId: z.string().uuid({
    message: "Profissional é obrigatório.",
  }),
  date: z.date({
    message: "Data é obrigatória.",
  }),
  time: z.string().min(1, {
    message: "Horário é obrigatório.",
  }),
  appointmentPriceInCents: z.number().min(1, {
    message: "Valor da consulta é obrigatório.",
  }),
});

export type AddAppointmentInput = z.infer<typeof addAppointmentSchema>;

export const cancelAppointmentSchema = z.object({
  id: z.string().uuid(),
  clinicId: z.string().uuid(),
});

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

export const updateAppointmentSchema = z.object({
  id: z.string().uuid(),
  clinicId: z.string().uuid(),
  professionalId: z.string().uuid(),
  date: z.date(),
  time: z.string(),
  appointmentPriceInCents: z.number().int().positive(),
});

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

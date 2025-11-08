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

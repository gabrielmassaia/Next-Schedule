import { z } from "zod";

export const clinicPersonaSchema = z.object({
  assistantTone: z.string().min(1, "O tom do assistente é obrigatório"),
  welcomeMessage: z.string().min(1, "A mensagem de boas-vindas é obrigatória"),
  rules: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, "Deve ser um JSON válido"),
  appointmentFlow: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, "Deve ser um JSON válido"),
  forbiddenTopics: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, "Deve ser um JSON válido"),
  availability: z.string().min(1, "A disponibilidade é obrigatória"),
  autoResponsesEnabled: z.boolean(),
  language: z.string(),
});

export type ClinicPersonaSchema = z.infer<typeof clinicPersonaSchema>;

import { z } from "zod";

export const clinicPersonaSchema = z.object({
  assistantTone: z.string().min(1, "O tom do assistente é obrigatório"),
  welcomeMessage: z.string().min(1, "A mensagem de boas-vindas é obrigatória"),
  rules: z.array(
    z.object({ value: z.string().min(1, "A regra não pode ser vazia") }),
  ),
  appointmentFlow: z.array(
    z.object({ value: z.string().min(1, "O passo não pode ser vazio") }),
  ),
  forbiddenTopics: z.array(
    z.object({ value: z.string().min(1, "O tópico não pode ser vazio") }),
  ),
  availability: z.string().min(1, "A disponibilidade é obrigatória"),
  autoResponsesEnabled: z.boolean(),
  language: z.string(),
});

export type ClinicPersonaSchema = z.infer<typeof clinicPersonaSchema>;

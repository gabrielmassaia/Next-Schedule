"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { clinicAgentSettingsTable } from "@/db/schema";
import { actionClient } from "@/lib/next-safe-action";
import { clinicPersonaSchema } from "@/lib/validations/clinic-settings";

export const upsertClinicSettingsAgent = actionClient
  .schema(clinicPersonaSchema)
  .action(async ({ parsedInput }) => {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const activeClinicId = cookieStore.get("activeClinicId")?.value;

    if (!activeClinicId) {
      throw new Error("Nenhuma clínica selecionada");
    }

    const existingSettings = await db.query.clinicAgentSettingsTable.findFirst({
      where: eq(clinicAgentSettingsTable.clinicId, activeClinicId),
    });

    const dataToSave = {
      clinicId: activeClinicId,
      assistantTone: parsedInput.assistantTone,
      welcomeMessage: parsedInput.welcomeMessage,
      rules: parsedInput.rules.map((r) => r.value) as unknown as Record<
        string,
        unknown
      >,
      appointmentFlow: parsedInput.appointmentFlow.map(
        (r) => r.value,
      ) as unknown as Record<string, unknown>,
      forbiddenTopics: parsedInput.forbiddenTopics.map(
        (r) => r.value,
      ) as unknown as Record<string, unknown>,
      availability: parsedInput.availability,
      autoResponsesEnabled: parsedInput.autoResponsesEnabled,
      language: parsedInput.language,
    };

    if (existingSettings) {
      await db
        .update(clinicAgentSettingsTable)
        .set(dataToSave)
        .where(eq(clinicAgentSettingsTable.id, existingSettings.id));
    } else {
      await db.insert(clinicAgentSettingsTable).values(dataToSave);
    }

    revalidatePath("/dashboard/clinica/configuracao");
    return { success: true };
  });

export const getClinicSettingsAgent = async () => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const activeClinicId = cookieStore.get("activeClinicId")?.value;

  if (!activeClinicId) {
    return null;
  }

  const settings = await db.query.clinicAgentSettingsTable.findFirst({
    where: eq(clinicAgentSettingsTable.clinicId, activeClinicId),
  });

  if (!settings) return null;

  return {
    ...settings,
    assistantTone: settings.assistantTone ?? "",
    welcomeMessage: settings.welcomeMessage ?? "",
    availability: settings.availability ?? "",
    autoResponsesEnabled: settings.autoResponsesEnabled ?? true,
    language: settings.language ?? "pt-BR",
    rules: Array.isArray(settings.rules)
      ? settings.rules.map((r: string) => ({ value: r }))
      : [],
    appointmentFlow: Array.isArray(settings.appointmentFlow)
      ? settings.appointmentFlow.map((r: string) => ({ value: r }))
      : [],
    forbiddenTopics: Array.isArray(settings.forbiddenTopics)
      ? settings.forbiddenTopics.map((r: string) => ({ value: r }))
      : [],
  };
};

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
      rules: JSON.parse(parsedInput.rules),
      appointmentFlow: JSON.parse(parsedInput.appointmentFlow),
      forbiddenTopics: JSON.parse(parsedInput.forbiddenTopics),
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
    rules: settings.rules ? JSON.stringify(settings.rules, null, 2) : "{}",
    appointmentFlow: settings.appointmentFlow
      ? JSON.stringify(settings.appointmentFlow, null, 2)
      : "{}",
    forbiddenTopics: settings.forbiddenTopics
      ? JSON.stringify(settings.forbiddenTopics, null, 2)
      : "{}",
  };
};

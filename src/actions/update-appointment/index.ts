"use server";

import { updateClinicAppointment } from "@/lib/appointments";
import { actionClient } from "@/lib/next-safe-action";
import { updateAppointmentSchema } from "@/lib/validations/appointments";

export const updateAppointment = actionClient
  .schema(updateAppointmentSchema)
  .action(async ({ parsedInput }) => {
    await updateClinicAppointment(parsedInput);
    return { success: true };
  });

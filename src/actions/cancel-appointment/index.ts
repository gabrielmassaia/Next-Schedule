"use server";

import { createSafeActionClient } from "next-safe-action";

import { cancelClinicAppointment } from "@/lib/appointments";
import { cancelAppointmentSchema } from "@/lib/validations/appointments";

const action = createSafeActionClient();

export const cancelAppointment = action
  .schema(cancelAppointmentSchema)
  .action(async ({ parsedInput: { id, clinicId } }) => {
    await cancelClinicAppointment(id, clinicId);
    return { success: true };
  });

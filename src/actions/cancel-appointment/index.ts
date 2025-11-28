"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";

const action = createSafeActionClient();

const cancelAppointmentSchema = z.object({
  id: z.string().uuid(),
  clinicId: z.string().uuid(),
});

export const cancelAppointment = action
  .schema(cancelAppointmentSchema)
  .action(async ({ parsedInput: { id } }) => {
    await db
      .update(appointmentsTable)
      .set({ status: "cancelled" })
      .where(eq(appointmentsTable.id, id));

    revalidatePath("/appointments");
    revalidatePath("/dashboard");

    return { success: true };
  });

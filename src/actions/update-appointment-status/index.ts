"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { actionClient } from "@/lib/next-safe-action";

const updateAppointmentStatusSchema = z.object({
  id: z.string().uuid(),
  clinicId: z.string().uuid(),
  status: z.enum(["scheduled", "completed", "cancelled"]),
});

export const updateAppointmentStatus = actionClient
  .schema(updateAppointmentStatusSchema)
  .action(async ({ parsedInput: { id, clinicId, status } }) => {
    // Verify appointment belongs to clinic
    const appointment = await db.query.appointmentsTable.findFirst({
      where: and(
        eq(appointmentsTable.id, id),
        eq(appointmentsTable.clinicId, clinicId),
      ),
    });

    if (!appointment) {
      throw new Error("Agendamento não encontrado.");
    }

    await db
      .update(appointmentsTable)
      .set({ status })
      .where(eq(appointmentsTable.id, id));

    revalidatePath("/appointments");

    return { success: true };
  });

"use server";

import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable, professionalsTable } from "@/db/schema";
import { actionClient } from "@/lib/next-safe-action";

const updateAppointmentSchema = z.object({
  id: z.string().uuid(),
  clinicId: z.string().uuid(),
  professionalId: z.string().uuid(),
  date: z.date(),
  time: z.string(),
  appointmentPriceInCents: z.number().int().positive(),
});

export const updateAppointment = actionClient
  .schema(updateAppointmentSchema)
  .action(
    async ({
      parsedInput: {
        id,
        clinicId,
        professionalId,
        date,
        time,
        appointmentPriceInCents,
      },
    }) => {
      const appointmentDateTime = dayjs(date)
        .set("hour", parseInt(time.split(":")[0]))
        .set("minute", parseInt(time.split(":")[1]))
        .toDate();

      // Check if professional exists and belongs to clinic
      const professional = await db.query.professionalsTable.findFirst({
        where: and(
          eq(professionalsTable.id, professionalId),
          eq(professionalsTable.clinicId, clinicId),
        ),
      });

      if (!professional) {
        throw new Error("Profissional não encontrado.");
      }

      // Check availability (excluding current appointment)
      const conflict = await db.query.appointmentsTable.findFirst({
        where: and(
          eq(appointmentsTable.clinicId, clinicId),
          eq(appointmentsTable.professionalId, professionalId),
          eq(appointmentsTable.date, appointmentDateTime),
        ),
      });

      if (conflict && conflict.id !== id) {
        throw new Error("Horário indisponível.");
      }

      await db
        .update(appointmentsTable)
        .set({
          professionalId,
          date: appointmentDateTime,
          appointmentPriceInCents,
        })
        .where(eq(appointmentsTable.id, id));

      revalidatePath("/appointments");

      return { success: true };
    },
  );

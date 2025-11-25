"use server";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  appointmentsTable,
  clinicsTable,
  professionalsTable,
} from "@/db/schema";
import { actionClient } from "@/lib/next-safe-action";

dayjs.extend(utc);
dayjs.extend(timezone);

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
      const clinic = await db.query.clinicsTable.findFirst({
        where: eq(clinicsTable.id, clinicId),
        columns: {
          timezone: true,
        },
      });

      if (!clinic) {
        throw new Error("Clínica não encontrada");
      }

      const appointmentDateTime = dayjs(date)
        .tz(clinic.timezone)
        .set("hour", parseInt(time.split(":")[0]))
        .set("minute", parseInt(time.split(":")[1]))
        .set("second", 0)
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

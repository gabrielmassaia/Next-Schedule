"use server";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getClinicAvailability } from "@/lib/availability";
import { actionClient } from "@/lib/next-safe-action";

dayjs.extend(utc);
dayjs.extend(timezone);

export const getAvailableTimes = actionClient
  .schema(
    z.object({
      clinicId: z.string().uuid(),
      professionalId: z.string(),
      date: z.string().date(), // YYYY-MM-DD,
      excludeAppointmentId: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      throw new Error("Não autorizado");
    }
    const membership = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.userId, session.user.id),
        eq(usersToClinicsTable.clinicId, parsedInput.clinicId),
      ),
    });
    if (!membership) {
      throw new Error("Clínica não encontrada");
    }

    return await getClinicAvailability({
      clinicId: parsedInput.clinicId,
      professionalId: parsedInput.professionalId,
      date: parsedInput.date,
      excludeAppointmentId: parsedInput.excludeAppointmentId,
    });
  });

"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { usersToClinicsTable } from "@/db/schema";
import { createClinicAppointment } from "@/lib/appointments";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { addAppointmentSchema } from "./schema";

export const addAppointment = actionClient
  .schema(addAppointmentSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Não autorizado");
    }

    const { clinicId } = parsedInput;

    const membership = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.clinicId, clinicId),
        eq(usersToClinicsTable.userId, session.user.id),
      ),
    });

    if (!membership) {
      throw new Error("Clínica não encontrada");
    }

    await createClinicAppointment(parsedInput);
  });

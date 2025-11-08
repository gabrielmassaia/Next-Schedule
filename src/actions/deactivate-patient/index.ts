"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { patientsTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const togglePatientStatus = actionClient
  .schema(
    z.object({
      id: z.string(),
      status: z.enum(["active", "inactive"]),
      clinicId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Usuário não autenticado");
    }

    const membership = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.userId, session.user.id),
        eq(usersToClinicsTable.clinicId, parsedInput.clinicId),
      ),
    });

    if (!membership) {
      throw new Error("Você não tem permissão para acessar esta clínica");
    }

    const patient = await db.query.patientsTable.findFirst({
      where: eq(patientsTable.id, parsedInput.id),
    });

    if (!patient) {
      throw new Error("Paciente não encontrado");
    }

    if (patient.clinicId !== parsedInput.clinicId) {
      throw new Error("Você não tem permissão para alterar este paciente");
    }

    await db
      .update(patientsTable)
      .set({
        status: parsedInput.status,
        updatedAt: new Date(),
      })
      .where(eq(patientsTable.id, parsedInput.id));

    revalidatePath("/patients");
  });

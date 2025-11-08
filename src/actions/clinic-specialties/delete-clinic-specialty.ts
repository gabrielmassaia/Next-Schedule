"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { clinicSpecialtiesTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

const deleteClinicSpecialtySchema = z.object({
  clinicId: z.string().uuid(),
  specialtyId: z.string().uuid(),
});

export const deleteClinicSpecialty = actionClient
  .schema(deleteClinicSpecialtySchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Não autorizado");
    }

    const membership = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.clinicId, parsedInput.clinicId),
        eq(usersToClinicsTable.userId, session.user.id),
      ),
    });

    if (!membership) {
      throw new Error("Clínica não encontrada");
    }

    const specialty = await db.query.clinicSpecialtiesTable.findFirst({
      where: eq(clinicSpecialtiesTable.id, parsedInput.specialtyId),
    });

    if (!specialty || specialty.clinicId !== parsedInput.clinicId) {
      throw new Error("Especialidade não encontrada nesta clínica");
    }

    await db
      .delete(clinicSpecialtiesTable)
      .where(eq(clinicSpecialtiesTable.id, parsedInput.specialtyId));

    revalidatePath("/specialties");
  });

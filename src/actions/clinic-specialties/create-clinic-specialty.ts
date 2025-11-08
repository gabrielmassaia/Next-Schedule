"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { clinicSpecialtiesTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

const createClinicSpecialtySchema = z.object({
  clinicId: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(1, { message: "Nome é obrigatório" })
    .max(120, { message: "Nome deve ter no máximo 120 caracteres" }),
  description: z
    .string()
    .trim()
    .max(500, { message: "Descrição deve ter no máximo 500 caracteres" })
    .optional(),
});

export const createClinicSpecialty = actionClient
  .schema(createClinicSpecialtySchema)
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

    await db.insert(clinicSpecialtiesTable).values({
      clinicId: parsedInput.clinicId,
      name: parsedInput.name,
      description: parsedInput.description ?? null,
    });

    revalidatePath("/specialties");
  });

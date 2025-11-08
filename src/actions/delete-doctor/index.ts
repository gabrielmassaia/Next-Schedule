"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { doctorsTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const deleteDoctor = actionClient
  .schema(
    z.object({
      id: z.string(),
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
        eq(usersToClinicsTable.clinicId, parsedInput.clinicId),
        eq(usersToClinicsTable.userId, session.user.id),
      ),
    });

    if (!membership) {
      throw new Error("Você não tem permissão para acessar esta clínica");
    }

    const doctor = await db.query.doctorsTable.findFirst({
      where: eq(doctorsTable.id, parsedInput.id),
    });

    if (!doctor) {
      throw new Error("Médico não encontrado");
    }

    if (doctor.clinicId !== parsedInput.clinicId) {
      throw new Error("Você não tem permissão para excluir este médico");
    }

    await db.delete(doctorsTable).where(eq(doctorsTable.id, parsedInput.id));

    revalidatePath("/doctors");
  });

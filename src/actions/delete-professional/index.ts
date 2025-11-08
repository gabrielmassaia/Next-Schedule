"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { professionalsTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const deleteProfessional = actionClient
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

    const professional = await db.query.professionalsTable.findFirst({
      where: eq(professionalsTable.id, parsedInput.id),
    });

    if (!professional) {
      throw new Error("Profissional não encontrado");
    }

    if (professional.clinicId !== parsedInput.clinicId) {
      throw new Error("Você não tem permissão para excluir este profissional");
    }

    await db
      .delete(professionalsTable)
      .where(eq(professionalsTable.id, parsedInput.id));

    revalidatePath("/professionals");
  });

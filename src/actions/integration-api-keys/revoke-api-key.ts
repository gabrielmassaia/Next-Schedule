"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { integrationApiKeysTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { readActiveClinicIdFromCookies } from "@/lib/clinic-session";
import { actionClient } from "@/lib/next-safe-action";

export const revokeApiKey = actionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Usuário não autenticado");
    }

    // Get active clinic from cookies
    const activeClinicId = await readActiveClinicIdFromCookies();

    if (!activeClinicId) {
      throw new Error("Nenhuma clínica ativa selecionada");
    }

    // Verify user has access to this clinic
    const membership = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.userId, session.user.id),
        eq(usersToClinicsTable.clinicId, activeClinicId),
      ),
    });

    if (!membership) {
      throw new Error("Você não tem acesso a esta clínica");
    }

    await db
      .delete(integrationApiKeysTable)
      .where(
        and(
          eq(integrationApiKeysTable.id, parsedInput.id),
          eq(integrationApiKeysTable.clinicId, activeClinicId),
        ),
      );

    revalidatePath("/subscription");
    revalidatePath("/apikey");
  });

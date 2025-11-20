"use server";

import { createHash, randomBytes } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { integrationApiKeysTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

const MAX_KEYS_PER_USER = 5;

export const createApiKey = actionClient
  .schema(
    z.object({
      name: z.string().trim().min(1, { message: "Informe um nome" }).max(120),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Não autenticado");
    }

    // Get active clinic from cookies
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const activeClinicId = cookieStore.get("active-clinic-id")?.value;

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

    const existingKeys = await db
      .select({ id: integrationApiKeysTable.id })
      .from(integrationApiKeysTable)
      .where(eq(integrationApiKeysTable.clinicId, activeClinicId));

    if (existingKeys.length >= MAX_KEYS_PER_USER) {
      throw new Error("Limite de chaves de API atingido");
    }

    const plainKey = randomBytes(32).toString("hex");
    const hashedKey = createHash("sha256").update(plainKey).digest("hex");

    await db.insert(integrationApiKeysTable).values({
      clinicId: activeClinicId,
      name: parsedInput.name,
      hashedKey,
    });

    revalidatePath("/subscription");
    revalidatePath("/apikey");

    return {
      apiKey: plainKey,
      name: parsedInput.name,
    };
  });

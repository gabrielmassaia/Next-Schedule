"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getPlanBySlug } from "@/data/subscription-plans";
import { db } from "@/db";
import { clientsTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertClientSchema } from "./schema";

export const upsertClient = actionClient
  .schema(upsertClientSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Não autorizado");
    }
    const { clinicId, id: clientId, ...clientData } = parsedInput;

    const membership = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.clinicId, clinicId),
        eq(usersToClinicsTable.userId, session.user.id),
      ),
    });

    if (!membership) {
      throw new Error("Clínica não encontrada");
    }

    if (clientId) {
      const client = await db.query.clientsTable.findFirst({
        where: eq(clientsTable.id, clientId),
      });

      if (!client || client.clinicId !== clinicId) {
        throw new Error("Cliente não pertence a esta clínica");
      }
    }

    const plan = await getPlanBySlug(session.user.plan);
    if (!clientId && typeof plan.limits.clientsPerClinic === "number") {
      const [totalClients] = await db
        .select({ total: count() })
        .from(clientsTable)
        .where(eq(clientsTable.clinicId, clinicId));

      if ((totalClients.total ?? 0) >= plan.limits.clientsPerClinic) {
        throw new Error(
          "Limite de clientes do plano atingido. Faça upgrade para cadastrar mais.",
        );
      }
    }

    await db
      .insert(clientsTable)
      .values({
        ...clientData,
        id: clientId,
        clinicId,
      })
      .onConflictDoUpdate({
        target: [clientsTable.id],
        set: {
          ...clientData,
        },
      });

    revalidatePath("/clients");
  });

"use server";

import { and, count, eq, ne } from "drizzle-orm";
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

    // Validar email duplicado (exceto se for update do mesmo cliente)
    const existingClientWithEmail = await db.query.clientsTable.findFirst({
      where: and(
        eq(clientsTable.clinicId, clinicId),
        eq(clientsTable.email, clientData.email),
        clientId ? ne(clientsTable.id, clientId) : undefined,
      ),
    });

    if (existingClientWithEmail) {
      throw new Error("Já existe um cliente com este email nesta clínica");
    }

    // Validar telefone duplicado (exceto se for update do mesmo cliente)
    const existingClientWithPhone = await db.query.clientsTable.findFirst({
      where: and(
        eq(clientsTable.clinicId, clinicId),
        eq(clientsTable.phoneNumber, clientData.phoneNumber),
        clientId ? ne(clientsTable.id, clientId) : undefined,
      ),
    });

    if (existingClientWithPhone) {
      throw new Error("Já existe um cliente com este telefone nesta clínica");
    }

    await db
      .insert(clientsTable)
      .values({
        ...clientData,
        id: clientId,
        clinicId,
        cpf: clientData.cpf,
      })
      .onConflictDoUpdate({
        target: [clientsTable.id],
        set: {
          ...clientData,
          cpf: clientData.cpf,
        },
      });

    revalidatePath("/clients");
  });

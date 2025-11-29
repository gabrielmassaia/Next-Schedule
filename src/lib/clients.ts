import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getPlanBySlug } from "@/data/subscription-plans";
import { db } from "@/db";
import {
  clientsTable,
  clinicFeaturesTable,
  usersToClinicsTable,
} from "@/db/schema";
import { UpsertClientInput } from "@/lib/validations/clients";

export async function getClinicClientLimit(clinicId: string): Promise<number> {
  const features = await db.query.clinicFeaturesTable.findFirst({
    where: eq(clinicFeaturesTable.clinicId, clinicId),
  });

  if (!features) {
    // Default fallback if no features found (should not happen if correctly initialized)
    // Assume strict limit or open? Let's assume strict 0 to force config, or 100?
    // Better to assume plan sync if missing.
    return 0;
  }

  if (!features.syncWithPlan) {
    return features.clientsPerClinic ?? 0;
  }

  // Sync with plan: find owner's plan
  // Heuristic: find first user of the clinic
  const membership = await db.query.usersToClinicsTable.findFirst({
    where: eq(usersToClinicsTable.clinicId, clinicId),
    with: {
      user: true,
    },
  });

  if (!membership || !membership.user || !membership.user.plan) {
    return 0; // No user or no plan
  }

  const plan = await getPlanBySlug(membership.user.plan);
  return typeof plan.limits.patientsPerClinic === "number"
    ? plan.limits.patientsPerClinic
    : Infinity;
}

export async function upsertClinicClient(
  input: UpsertClientInput,
  options?: { bypassPlanCheck?: boolean; clientLimit?: number },
) {
  const { clinicId, id: clientId, ...clientData } = input;

  // Check plan limits if creating new client
  if (!clientId && !options?.bypassPlanCheck) {
    const limit =
      options?.clientLimit ?? (await getClinicClientLimit(clinicId));

    if (limit !== Infinity) {
      const [totalClients] = await db
        .select({ total: count() })
        .from(clientsTable)
        .where(eq(clientsTable.clinicId, clinicId));

      if ((totalClients.total ?? 0) >= limit) {
        throw new Error(
          "Limite de clientes do plano atingido. Faça upgrade para cadastrar mais.",
        );
      }
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
}

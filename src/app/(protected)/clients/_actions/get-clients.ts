"use server";

import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import { requirePlan } from "@/_helpers/require-plan";
import { db } from "@/db";
import { clientsTable } from "@/db/schema";

interface GetClientsParams {
  page?: number;
  limit?: number;
  query?: string;
  cpf?: string;
  status?: string;
}

export async function getClients({
  page = 1,
  limit = 30,
  query,
  status,
  cpf,
}: GetClientsParams) {
  const { activeClinic, plan } = await requirePlan();
  if (!activeClinic) {
    return { clients: [], totalCount: 0, pageCount: 0, hasReachedLimit: false };
  }

  const offset = (page - 1) * limit;

  const unmaskedCpf = cpf ? cpf.replace(/\D/g, "") : undefined;

  const where = and(
    eq(clientsTable.clinicId, activeClinic.id),
    query
      ? or(
          ilike(clientsTable.name, `%${query}%`),
          ilike(clientsTable.email, `%${query}%`),
          ilike(clientsTable.phoneNumber, `%${query}%`),
        )
      : undefined,
    unmaskedCpf ? ilike(clientsTable.cpf, `%${unmaskedCpf}%`) : undefined,
    status && status !== "all"
      ? eq(clientsTable.status, status as "active" | "inactive")
      : undefined,
  );

  const [clients, totalCount] = await Promise.all([
    db.query.clientsTable.findMany({
      where,
      limit,
      offset,
      orderBy: [desc(clientsTable.createdAt)],
    }),
    db
      .select({ count: count() })
      .from(clientsTable)
      .where(where)
      .then((res) => res[0].count),
  ]);

  const pageCount = Math.ceil(totalCount / limit);
  const maxClients = plan.limits.clientsPerClinic;
  const hasReachedLimit =
    typeof maxClients === "number" && totalCount >= maxClients;

  return {
    clients,
    totalCount,
    pageCount,
    hasReachedLimit,
  };
}

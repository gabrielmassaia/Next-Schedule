"use server";

import { eq } from "drizzle-orm";

import { requirePlan } from "@/_helpers/require-plan";
import { db } from "@/db";
import { clientsTable, professionalsTable } from "@/db/schema";

export async function getFormData() {
  const { activeClinic } = await requirePlan();
  if (!activeClinic) {
    return { clients: [], professionals: [] };
  }

  const [clients, professionals] = await Promise.all([
    db.query.clientsTable.findMany({
      where: eq(clientsTable.clinicId, activeClinic.id),
    }),
    db.query.professionalsTable.findMany({
      where: eq(professionalsTable.clinicId, activeClinic.id),
    }),
  ]);

  return { clients, professionals };
}

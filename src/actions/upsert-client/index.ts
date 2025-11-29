"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { getPlanBySlug } from "@/data/subscription-plans";
import { db } from "@/db";
import { usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { upsertClinicClient } from "@/lib/clients";
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
    const { clinicId } = parsedInput;

    const membership = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.clinicId, clinicId),
        eq(usersToClinicsTable.userId, session.user.id),
      ),
    });

    if (!membership) {
      throw new Error("Clínica não encontrada");
    }

    const plan = await getPlanBySlug(session.user.plan);
    const clientLimit =
      typeof plan.limits.patientsPerClinic === "number"
        ? plan.limits.patientsPerClinic
        : Infinity;

    await upsertClinicClient(parsedInput, {
      clientLimit,
    });
  });

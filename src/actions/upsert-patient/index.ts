"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getPlanBySlug } from "@/data/subscription-plans";
import { db } from "@/db";
import { patientsTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertPatientSchema } from "./schema";

export const upsertPatient = actionClient
  .schema(upsertPatientSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Não autorizado");
    }
    const { clinicId, id: patientId, ...patientData } = parsedInput;

    const membership = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.clinicId, clinicId),
        eq(usersToClinicsTable.userId, session.user.id),
      ),
    });

    if (!membership) {
      throw new Error("Clínica não encontrada");
    }

    if (patientId) {
      const patient = await db.query.patientsTable.findFirst({
        where: eq(patientsTable.id, patientId),
      });

      if (!patient || patient.clinicId !== clinicId) {
        throw new Error("Paciente não pertence a esta clínica");
      }
    }

    const plan = await getPlanBySlug(session.user.plan);
    if (!patientId && typeof plan.limits.patientsPerClinic === "number") {
      const [totalPatients] = await db
        .select({ total: count() })
        .from(patientsTable)
        .where(eq(patientsTable.clinicId, clinicId));

      if ((totalPatients.total ?? 0) >= plan.limits.patientsPerClinic) {
        throw new Error(
          "Limite de pacientes do plano atingido. Faça upgrade para cadastrar mais.",
        );
      }
    }

    await db
      .insert(patientsTable)
      .values({
        ...patientData,
        id: patientId,
        clinicId,
      })
      .onConflictDoUpdate({
        target: [patientsTable.id],
        set: {
          ...patientData,
        },
      });

    revalidatePath("/patients");
  });

"use server";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getPlanBySlug } from "@/data/subscription-plans";
import { db } from "@/db";
import { professionalsTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertDoctorSchema } from "./schema";

dayjs.extend(utc);

export const upsertDoctor = actionClient
  .schema(upsertDoctorSchema)
  .action(async ({ parsedInput }) => {
    const availableFromTime = parsedInput.availableFromTime; // 15:30:00
    const availableToTime = parsedInput.availableToTime; // 16:00:00

    const availableFromTimeUTC = dayjs()
      .set("hour", parseInt(availableFromTime.split(":")[0]))
      .set("minute", parseInt(availableFromTime.split(":")[1]))
      .set("second", parseInt(availableFromTime.split(":")[2]))
      .utc();
    const availableToTimeUTC = dayjs()
      .set("hour", parseInt(availableToTime.split(":")[0]))
      .set("minute", parseInt(availableToTime.split(":")[1]))
      .set("second", parseInt(availableToTime.split(":")[2]))
      .utc();

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Não autorizado");
    }
    const { clinicId, id: professionalId, ...professionalData } = parsedInput;

    const belongsToClinic = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.clinicId, clinicId),
        eq(usersToClinicsTable.userId, session.user.id),
      ),
    });

    if (!belongsToClinic) {
      throw new Error("Clínica não encontrada");
    }

    if (professionalId) {
      const professional = await db.query.professionalsTable.findFirst({
        where: eq(professionalsTable.id, professionalId),
      });
      if (!professional || professional.clinicId !== clinicId) {
        throw new Error("Profissional não encontrado nesta clínica");
      }
    }

    const plan = await getPlanBySlug(session.user.plan);
    if (!professionalId && typeof plan.limits.professionalsPerClinic === "number") {
      const [totalProfessionals] = await db
        .select({ total: count() })
        .from(professionalsTable)
        .where(eq(professionalsTable.clinicId, clinicId));
      if ((totalProfessionals.total ?? 0) >= plan.limits.professionalsPerClinic) {
        throw new Error(
          "Limite de profissionais do seu plano foi atingido. Faça upgrade para cadastrar mais.",
        );
      }
    }
    await db
      .insert(professionalsTable)
      .values({
        ...professionalData,
        id: professionalId,
        clinicId,
        availableFromTime: availableFromTimeUTC.format("HH:mm:ss"),
        availableToTime: availableToTimeUTC.format("HH:mm:ss"),
      })
      .onConflictDoUpdate({
        target: [professionalsTable.id],
        set: {
          ...professionalData,
          clinicId,
          availableFromTime: availableFromTimeUTC.format("HH:mm:ss"),
          availableToTime: availableToTimeUTC.format("HH:mm:ss"),
        },
      });
    revalidatePath("/doctors");
  });

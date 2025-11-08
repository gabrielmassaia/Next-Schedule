"use server";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getPlanBySlug } from "@/data/subscription-plans";
import { db } from "@/db";
import { doctorsTable, usersToClinicsTable } from "@/db/schema";
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
    const { clinicId, id: doctorId, ...doctorData } = parsedInput;

    const belongsToClinic = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.clinicId, clinicId),
        eq(usersToClinicsTable.userId, session.user.id),
      ),
    });

    if (!belongsToClinic) {
      throw new Error("Clínica não encontrada");
    }

    if (doctorId) {
      const doctor = await db.query.doctorsTable.findFirst({
        where: eq(doctorsTable.id, doctorId),
      });
      if (!doctor || doctor.clinicId !== clinicId) {
        throw new Error("Médico não encontrado nesta clínica");
      }
    }

    const plan = getPlanBySlug(session.user.plan);
    if (!doctorId && typeof plan.limits.doctorsPerClinic === "number") {
      const [totalDoctors] = await db
        .select({ total: count() })
        .from(doctorsTable)
        .where(eq(doctorsTable.clinicId, clinicId));
      if ((totalDoctors.total ?? 0) >= plan.limits.doctorsPerClinic) {
        throw new Error(
          "Limite de médicos do seu plano foi atingido. Faça upgrade para cadastrar mais.",
        );
      }
    }
    await db
      .insert(doctorsTable)
      .values({
        ...doctorData,
        id: doctorId,
        clinicId,
        availableFromTime: availableFromTimeUTC.format("HH:mm:ss"),
        availableToTime: availableToTimeUTC.format("HH:mm:ss"),
      })
      .onConflictDoUpdate({
        target: [doctorsTable.id],
        set: {
          ...doctorData,
          clinicId,
          availableFromTime: availableFromTimeUTC.format("HH:mm:ss"),
          availableToTime: availableToTimeUTC.format("HH:mm:ss"),
        },
      });
    revalidatePath("/doctors");
  });

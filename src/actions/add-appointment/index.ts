"use server";

import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import {
  appointmentsTable,
  doctorsTable,
  patientsTable,
  usersToClinicsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { getAvailableTimes } from "../get-available-times";
import { addAppointmentSchema } from "./schema";

export const addAppointment = actionClient
  .schema(addAppointmentSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Não autorizado");
    }

    const { clinicId, ...appointmentData } = parsedInput;

    const membership = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.clinicId, clinicId),
        eq(usersToClinicsTable.userId, session.user.id),
      ),
    });

    if (!membership) {
      throw new Error("Clínica não encontrada");
    }

    const availableTimes = await getAvailableTimes({
      doctorId: appointmentData.doctorId,
      clinicId,
      date: dayjs(appointmentData.date).format("YYYY-MM-DD"),
    });
    if (!availableTimes?.data) {
      throw new Error("Nenhum horário disponível");
    }
    const isTimeAvailable = availableTimes.data?.some(
      (time: { value: string; available: boolean }) =>
        time.value === appointmentData.time && time.available,
    );
    if (!isTimeAvailable) {
      throw new Error("Horário não disponível");
    }
    const appointmentDateTime = dayjs(appointmentData.date)
      .set("hour", parseInt(appointmentData.time.split(":")[0]))
      .set("minute", parseInt(appointmentData.time.split(":")[1]))
      .toDate();

    const [doctor, patient] = await Promise.all([
      db.query.doctorsTable.findFirst({
        where: and(
          eq(doctorsTable.id, appointmentData.doctorId),
          eq(doctorsTable.clinicId, clinicId),
        ),
      }),
      db.query.patientsTable.findFirst({
        where: and(
          eq(patientsTable.id, appointmentData.patientId),
          eq(patientsTable.clinicId, clinicId),
        ),
      }),
    ]);

    if (!doctor || !patient) {
      throw new Error("Paciente ou médico não pertence a esta clínica");
    }

    await db.insert(appointmentsTable).values({
      ...appointmentData,
      clinicId,
      date: appointmentDateTime,
    });

    revalidatePath("/appointments");
    revalidatePath("/dashboard");
  });

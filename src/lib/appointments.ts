import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  appointmentsTable,
  clientsTable,
  clinicsTable,
  professionalsTable,
} from "@/db/schema";
import { getClinicAvailability } from "@/lib/availability";
import {
  AddAppointmentInput,
  UpdateAppointmentInput,
} from "@/lib/validations/appointments";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function createClinicAppointment(input: AddAppointmentInput) {
  const { clinicId, ...appointmentData } = input;

  const clinic = await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.id, clinicId),
    columns: {
      timezone: true,
    },
  });

  if (!clinic) {
    throw new Error("Clínica não encontrada");
  }

  const availableTimes = await getClinicAvailability({
    professionalId: appointmentData.professionalId,
    clinicId,
    date: dayjs(appointmentData.date).format("YYYY-MM-DD"),
  });

  const isTimeAvailable = availableTimes.some(
    (time) => time.value === appointmentData.time && time.available,
  );

  if (!isTimeAvailable) {
    throw new Error("Horário não disponível");
  }

  const appointmentDateTime = dayjs(appointmentData.date)
    .tz(clinic.timezone)
    .set("hour", parseInt(appointmentData.time.split(":")[0]))
    .set("minute", parseInt(appointmentData.time.split(":")[1]))
    .set("second", 0)
    .toDate();

  const [professional, client] = await Promise.all([
    db.query.professionalsTable.findFirst({
      where: and(
        eq(professionalsTable.id, appointmentData.professionalId),
        eq(professionalsTable.clinicId, clinicId),
      ),
    }),
    db.query.clientsTable.findFirst({
      where: and(
        eq(clientsTable.id, appointmentData.clientId),
        eq(clientsTable.clinicId, clinicId),
      ),
    }),
  ]);

  if (!professional || !client) {
    throw new Error("Cliente ou profissional não pertence a esta clínica");
  }

  const [appointment] = await db
    .insert(appointmentsTable)
    .values({
      ...appointmentData,
      clinicId,
      date: appointmentDateTime,
    })
    .returning();

  revalidatePath("/appointments");
  revalidatePath("/dashboard");

  return appointment;
}

export async function cancelClinicAppointment(
  appointmentId: string,
  clinicId: string,
) {
  const appointment = await db.query.appointmentsTable.findFirst({
    where: eq(appointmentsTable.id, appointmentId),
  });

  if (!appointment) {
    throw new Error("Agendamento não encontrado");
  }

  if (appointment.clinicId !== clinicId) {
    throw new Error("Agendamento não pertence a esta clínica");
  }

  await db
    .update(appointmentsTable)
    .set({ status: "cancelled" })
    .where(eq(appointmentsTable.id, appointmentId));

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
}

export async function updateClinicAppointment(input: UpdateAppointmentInput) {
  const { id, clinicId, professionalId, date, time, appointmentPriceInCents } =
    input;

  const clinic = await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.id, clinicId),
    columns: {
      timezone: true,
    },
  });

  if (!clinic) {
    throw new Error("Clínica não encontrada");
  }

  // Check availability excluding the current appointment
  const availableTimes = await getClinicAvailability({
    professionalId,
    clinicId,
    date: dayjs(date).format("YYYY-MM-DD"),
    excludeAppointmentId: id,
  });

  const isTimeAvailable = availableTimes.some(
    (t) => t.value === time && t.available,
  );

  if (!isTimeAvailable) {
    throw new Error("Horário indisponível.");
  }

  const appointmentDateTime = dayjs(date)
    .tz(clinic.timezone)
    .set("hour", parseInt(time.split(":")[0]))
    .set("minute", parseInt(time.split(":")[1]))
    .set("second", 0)
    .toDate();

  const professional = await db.query.professionalsTable.findFirst({
    where: and(
      eq(professionalsTable.id, professionalId),
      eq(professionalsTable.clinicId, clinicId),
    ),
  });

  if (!professional) {
    throw new Error("Profissional não encontrado.");
  }

  await db
    .update(appointmentsTable)
    .set({
      professionalId,
      date: appointmentDateTime,
      appointmentPriceInCents,
    })
    .where(eq(appointmentsTable.id, id));

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
}

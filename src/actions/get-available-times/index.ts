"use server";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { generateTimeSlots } from "@/_helpers/time";
import { db } from "@/db";
import {
  appointmentsTable,
  doctorsTable,
  usersToClinicsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

dayjs.extend(utc);
dayjs.extend(timezone);

export const getAvailableTimes = actionClient
  .schema(
    z.object({
      clinicId: z.string().uuid(),
      doctorId: z.string(),
      date: z.string().date(), // YYYY-MM-DD,
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      throw new Error("Não autorizado");
    }
    const membership = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.userId, session.user.id),
        eq(usersToClinicsTable.clinicId, parsedInput.clinicId),
      ),
    });
    if (!membership) {
      throw new Error("Clínica não encontrada");
    }
    const doctor = await db.query.doctorsTable.findFirst({
      where: and(
        eq(doctorsTable.id, parsedInput.doctorId),
        eq(doctorsTable.clinicId, parsedInput.clinicId),
      ),
    });
    if (!doctor) {
      throw new Error("Médico não encontrado");
    }
    const selectedDayOfWeek = dayjs(parsedInput.date).day();
    const doctorIsAvailable =
      selectedDayOfWeek >= doctor.availableFromWeekDay &&
      selectedDayOfWeek <= doctor.availableToWeekDay;
    if (!doctorIsAvailable) {
      return [];
    }
    const appointments = await db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.doctorId, parsedInput.doctorId),
        eq(appointmentsTable.clinicId, parsedInput.clinicId),
      ),
    });
    const appointmentsOnSelectedDate = appointments
      .filter((appointment) => {
        return dayjs(appointment.date).isSame(parsedInput.date, "day");
      })
      .map((appointment) => dayjs(appointment.date).format("HH:mm:ss"));
    const timeSlots = generateTimeSlots();

    const doctorAvailableFrom = dayjs()
      .utc()
      .set("hour", Number(doctor.availableFromTime.split(":")[0]))
      .set("minute", Number(doctor.availableFromTime.split(":")[1]))
      .set("second", 0)
      .local();
    const doctorAvailableTo = dayjs()
      .utc()
      .set("hour", Number(doctor.availableToTime.split(":")[0]))
      .set("minute", Number(doctor.availableToTime.split(":")[1]))
      .set("second", 0)
      .local();
    const doctorTimeSlots = timeSlots.filter((time) => {
      const date = dayjs()
        .utc()
        .set("hour", Number(time.split(":")[0]))
        .set("minute", Number(time.split(":")[1]))
        .set("second", 0);

      return (
        date.format("HH:mm:ss") >= doctorAvailableFrom.format("HH:mm:ss") &&
        date.format("HH:mm:ss") <= doctorAvailableTo.format("HH:mm:ss")
      );
    });
    return doctorTimeSlots.map((time) => {
      return {
        value: time,
        available: !appointmentsOnSelectedDate.includes(time),
        label: time.substring(0, 5),
      };
    });
  });

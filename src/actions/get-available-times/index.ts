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
  clinicsTable,
  professionalsTable,
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
      professionalId: z.string(),
      date: z.string().date(), // YYYY-MM-DD,
      excludeAppointmentId: z.string().optional(),
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

    const clinic = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.id, parsedInput.clinicId),
      with: {
        operatingHours: true,
      },
      columns: {
        id: true,
        timezone: true,
        hasLunchBreak: true,
        lunchBreakStart: true,
        lunchBreakEnd: true,
      },
    });

    if (!clinic) {
      throw new Error("Clínica não encontrada");
    }

    const professional = await db.query.professionalsTable.findFirst({
      where: and(
        eq(professionalsTable.id, parsedInput.professionalId),
        eq(professionalsTable.clinicId, parsedInput.clinicId),
      ),
    });
    if (!professional) {
      throw new Error("Profissional não encontrado");
    }
    const selectedDayOfWeek = dayjs(parsedInput.date).day();

    // Check if professional works on this day
    if (!professional.workingDays.includes(selectedDayOfWeek)) {
      return [];
    }

    // Clinic Operating Hours Logic
    const dayOperatingHours = clinic.operatingHours.find(
      (oh) => oh.dayOfWeek === selectedDayOfWeek,
    );

    // If clinic has configured hours (any day), we enforce them.
    // If no hours configured at all, we assume legacy/open.
    const hasConfiguredHours = clinic.operatingHours.length > 0;

    if (hasConfiguredHours) {
      if (!dayOperatingHours || !dayOperatingHours.isActive) {
        // Closed on this day
        return [];
      }
    }

    const appointments = await db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.professionalId, parsedInput.professionalId),
        eq(appointmentsTable.clinicId, parsedInput.clinicId),
      ),
    });

    const bookedIntervals = appointments
      .filter((appointment) => {
        if (
          parsedInput.excludeAppointmentId &&
          appointment.id === parsedInput.excludeAppointmentId
        ) {
          return false;
        }
        return dayjs(appointment.date)
          .tz(clinic.timezone)
          .isSame(parsedInput.date, "day");
      })
      .map((appointment) => {
        const start = dayjs(appointment.date).tz(clinic.timezone);
        const duration = professional.appointmentDuration || 30;
        return {
          start,
          end: start.add(duration, "minute"),
        };
      });

    const timeSlots = generateTimeSlots(professional.appointmentDuration || 30);

    // Determine effective start/end times
    let startHour = Number(professional.availableFromTime.split(":")[0]);
    let startMinute = Number(professional.availableFromTime.split(":")[1]);
    let endHour = Number(professional.availableToTime.split(":")[0]);
    let endMinute = Number(professional.availableToTime.split(":")[1]);

    if (hasConfiguredHours && dayOperatingHours) {
      const clinicStartHour = Number(dayOperatingHours.startTime.split(":")[0]);
      const clinicStartMinute = Number(
        dayOperatingHours.startTime.split(":")[1],
      );
      const clinicEndHour = Number(dayOperatingHours.endTime.split(":")[0]);
      const clinicEndMinute = Number(dayOperatingHours.endTime.split(":")[1]);

      // Max Start
      if (
        clinicStartHour > startHour ||
        (clinicStartHour === startHour && clinicStartMinute > startMinute)
      ) {
        startHour = clinicStartHour;
        startMinute = clinicStartMinute;
      }

      // Min End
      if (
        clinicEndHour < endHour ||
        (clinicEndHour === endHour && clinicEndMinute < endMinute)
      ) {
        endHour = clinicEndHour;
        endMinute = clinicEndMinute;
      }
    }

    const effectiveAvailableFrom = dayjs()
      .tz(clinic.timezone)
      .set("hour", startHour)
      .set("minute", startMinute)
      .set("second", 0);
    const effectiveAvailableTo = dayjs()
      .tz(clinic.timezone)
      .set("hour", endHour)
      .set("minute", endMinute)
      .set("second", 0);

    // Lunch Break Logic
    let lunchStart: dayjs.Dayjs | null = null;
    let lunchEnd: dayjs.Dayjs | null = null;

    if (
      clinic.hasLunchBreak &&
      clinic.lunchBreakStart &&
      clinic.lunchBreakEnd
    ) {
      lunchStart = dayjs()
        .tz(clinic.timezone)
        .set("hour", Number(clinic.lunchBreakStart.split(":")[0]))
        .set("minute", Number(clinic.lunchBreakStart.split(":")[1]))
        .set("second", 0);
      lunchEnd = dayjs()
        .tz(clinic.timezone)
        .set("hour", Number(clinic.lunchBreakEnd.split(":")[0]))
        .set("minute", Number(clinic.lunchBreakEnd.split(":")[1]))
        .set("second", 0);
    }

    const professionalTimeSlots = timeSlots.filter((time) => {
      const slotStart = dayjs()
        .tz(clinic.timezone)
        .set("hour", Number(time.split(":")[0]))
        .set("minute", Number(time.split(":")[1]))
        .set("second", 0);

      const duration = professional.appointmentDuration || 30;
      const slotEnd = slotStart.add(duration, "minute");

      // Check range (Start must be >= AvailableFrom, End must be <= AvailableTo)
      if (
        slotStart.isBefore(effectiveAvailableFrom) ||
        slotEnd.isAfter(effectiveAvailableTo)
      ) {
        return false;
      }

      // Check lunch break (End must be <= LunchStart OR Start must be >= LunchEnd)
      if (lunchStart && lunchEnd) {
        const slotStartStr = slotStart.format("HH:mm");
        const slotEndStr = slotEnd.format("HH:mm");
        const lunchStartStr = lunchStart.format("HH:mm");
        const lunchEndStr = lunchEnd.format("HH:mm");

        const fitsBeforeLunch = slotEndStr <= lunchStartStr;
        const fitsAfterLunch = slotStartStr >= lunchEndStr;

        if (!fitsBeforeLunch && !fitsAfterLunch) {
          return false;
        }
      }

      // Check for overlaps with booked appointments
      for (const booked of bookedIntervals) {
        // Overlap condition: Start < BookedEnd AND End > BookedStart
        if (slotStart.isBefore(booked.end) && slotEnd.isAfter(booked.start)) {
          return false;
        }
      }

      return true;
    });

    return professionalTimeSlots.map((time) => {
      return {
        value: time,
        available: true,
        label: time.substring(0, 5),
      };
    });
  });

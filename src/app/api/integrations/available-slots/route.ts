import { createHash } from "node:crypto";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import {
  appointmentsTable,
  clinicsTable,
  integrationApiKeysTable,
  professionalsTable,
} from "@/db/schema";

dayjs.extend(utc);
dayjs.extend(timezone);

const schema = z.object({
  professionalCpf: z.string().min(11).max(14),
  date: z.string().date(),
});

async function validateApiKey(apiKey: string) {
  const hashedKey = createHash("sha256").update(apiKey).digest("hex");

  const apiKeyRecord = await db.query.integrationApiKeysTable.findFirst({
    where: eq(integrationApiKeysTable.hashedKey, hashedKey),
  });

  if (!apiKeyRecord) {
    return null;
  }

  await db
    .update(integrationApiKeysTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(integrationApiKeysTable.id, apiKeyRecord.id));

  return apiKeyRecord;
}

function generateTimeSlots(
  fromTime: string,
  toTime: string,
  slotDuration: number = 60,
): string[] {
  const slots: string[] = [];
  const [fromHour, fromMinute] = fromTime.split(":").map(Number);
  const [toHour, toMinute] = toTime.split(":").map(Number);

  let current = dayjs()
    .hour(fromHour)
    .minute(fromMinute)
    .second(0)
    .millisecond(0);
  const end = dayjs().hour(toHour).minute(toMinute).second(0).millisecond(0);

  while (current.isBefore(end)) {
    slots.push(current.format("HH:mm"));
    current = current.add(slotDuration, "minute");
  }

  return slots;
}

/**
 * @swagger
 * /api/integrations/available-slots:
 *   get:
 *     summary: Get available time slots for a professional
 *     tags:
 *       - Appointments
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: professionalCpf
 *         required: true
 *         schema:
 *           type: string
 *           description: CPF do profissional (com ou sem formatação)
 *           example: "12345678900"
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-25"
 *     responses:
 *       200:
 *         description: List of available slots
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 availableSlots:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "09:00"
 *                 professionalId:
 *                   type: string
 *                   description: ID do profissional
 *                 professionalCpf:
 *                   type: string
 *                   description: CPF do profissional
 *                 professionalName:
 *                   type: string
 *                 date:
 *                   type: string
 *                 appointmentPriceInCents:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Professional not found
 */
export async function GET(request: NextRequest) {
  try {
    const headerKey = request.headers
      .get("authorization")
      ?.replace("Bearer", "")
      .trim();
    const apiKey = headerKey || request.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json({ message: "API key ausente" }, { status: 401 });
    }

    const apiKeyRecord = await validateApiKey(apiKey);

    if (!apiKeyRecord) {
      return NextResponse.json(
        { message: "Chave de API inválida" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const professionalCpf = searchParams.get("professionalCpf");
    const date = searchParams.get("date");

    const parsed = schema.parse({ professionalCpf, date });

    // Fetch clinic to get timezone
    const clinic = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.id, apiKeyRecord.clinicId),
      columns: {
        timezone: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { message: "Clínica não encontrada" },
        { status: 404 },
      );
    }

    const professional = await db.query.professionalsTable.findFirst({
      where: and(
        eq(professionalsTable.cpf, parsed.professionalCpf),
        eq(professionalsTable.clinicId, apiKeyRecord.clinicId),
      ),
    });

    if (!professional) {
      return NextResponse.json(
        { message: "Profissional não encontrado com este CPF" },
        { status: 404 },
      );
    }

    const requestedDate = dayjs(parsed.date);
    const dayOfWeek = requestedDate.day();

    // Check if professional works on this day
    if (!professional.workingDays.includes(dayOfWeek)) {
      return NextResponse.json({
        availableSlots: [],
        message: "Profissional não trabalha neste dia da semana",
      });
    }

    // Generate all possible time slots
    const allSlots = generateTimeSlots(
      professional.availableFromTime,
      professional.availableToTime,
      professional.appointmentDuration || 60,
    );

    // Get existing appointments for this professional on this date
    const existingAppointments = await db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.professionalId, professional.id),
        eq(appointmentsTable.clinicId, apiKeyRecord.clinicId),
      ),
    });

    // Filter appointments for the requested date and convert to clinic timezone
    const bookedTimes = new Set(
      existingAppointments
        .filter((apt) => {
          // Convert UTC appointment date to clinic timezone and compare
          return dayjs(apt.date).tz(clinic.timezone).isSame(parsed.date, "day");
        })
        .map((apt) => {
          // Convert UTC to clinic timezone for time comparison
          return dayjs(apt.date).tz(clinic.timezone).format("HH:mm");
        }),
    );

    const availableSlots = allSlots.filter((slot) => !bookedTimes.has(slot));

    return NextResponse.json({
      availableSlots,
      professionalId: professional.id,
      professionalCpf: professional.cpf,
      professionalName: professional.name,
      date: parsed.date,
      appointmentPriceInCents: professional.appointmentPriceInCents,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Parâmetros inválidos", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

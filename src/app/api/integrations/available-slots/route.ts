import { createHash } from "node:crypto";

import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import {
  appointmentsTable,
  integrationApiKeysTable,
  professionalsTable,
} from "@/db/schema";

const schema = z.object({
  professionalId: z.string().uuid(),
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
 *         name: professionalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
    const professionalId = searchParams.get("professionalId");
    const date = searchParams.get("date");

    const parsed = schema.parse({ professionalId, date });

    const professional = await db.query.professionalsTable.findFirst({
      where: and(
        eq(professionalsTable.id, parsed.professionalId),
        eq(professionalsTable.clinicId, apiKeyRecord.clinicId),
      ),
    });

    if (!professional) {
      return NextResponse.json(
        { message: "Profissional não encontrado" },
        { status: 404 },
      );
    }

    const requestedDate = dayjs(parsed.date);
    const dayOfWeek = requestedDate.day();

    // Check if the requested date is within professional's working days
    if (
      dayOfWeek < professional.availableFromWeekDay ||
      dayOfWeek > professional.availableToWeekDay
    ) {
      return NextResponse.json({
        availableSlots: [],
        message: "Profissional não trabalha neste dia da semana",
      });
    }

    // Generate all possible time slots
    const allSlots = generateTimeSlots(
      professional.availableFromTime,
      professional.availableToTime,
    );

    // Get existing appointments for this professional on this date
    const startOfDay = requestedDate.startOf("day").toDate();
    const endOfDay = requestedDate.endOf("day").toDate();

    const existingAppointments = await db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.professionalId, parsed.professionalId),
        eq(appointmentsTable.clinicId, apiKeyRecord.clinicId),
        and(
          eq(appointmentsTable.date, startOfDay),
          eq(appointmentsTable.date, endOfDay),
        ),
      ),
    });

    // Filter out booked slots
    const bookedTimes = new Set(
      existingAppointments.map((apt) => dayjs(apt.date).format("HH:mm")),
    );

    const availableSlots = allSlots.filter((slot) => !bookedTimes.has(slot));

    return NextResponse.json({
      availableSlots,
      professionalId: professional.id,
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

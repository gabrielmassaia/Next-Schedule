import { createHash } from "node:crypto";

import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import {
  appointmentsTable,
  clientsTable,
  integrationApiKeysTable,
  professionalsTable,
} from "@/db/schema";

const schema = z.object({
  clientId: z.string().uuid(),
  professionalId: z.string().uuid(),
  date: z.string().date(),
  time: z.string(),
  appointmentPriceInCents: z.number().int().positive(),
});

/**
 * @swagger
 * /api/integrations/appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags:
 *       - Appointments
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - professionalId
 *               - date
 *               - time
 *               - appointmentPriceInCents
 *             properties:
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               professionalId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-25"
 *               time:
 *                 type: string
 *                 example: "14:30"
 *               appointmentPriceInCents:
 *                 type: integer
 *                 example: 15000
 *     responses:
 *       200:
 *         description: Appointment created successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client or Professional not found
 *       409:
 *         description: Time slot unavailable
 */
export async function POST(request: NextRequest) {
  try {
    const headerKey = request.headers
      .get("authorization")
      ?.replace("Bearer", "")
      .trim();
    const apiKey = headerKey || request.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json({ message: "API key ausente" }, { status: 401 });
    }

    const hashedKey = createHash("sha256").update(apiKey).digest("hex");

    const apiKeyRecord = await db.query.integrationApiKeysTable.findFirst({
      where: eq(integrationApiKeysTable.hashedKey, hashedKey),
    });

    if (!apiKeyRecord) {
      return NextResponse.json(
        { message: "Chave de API inválida" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = schema.parse(body);

    // API key is already validated and linked to a clinic
    // No need to check user membership since keys are clinic-scoped

    const [professional, client] = await Promise.all([
      db.query.professionalsTable.findFirst({
        where: and(
          eq(professionalsTable.id, parsed.professionalId),
          eq(professionalsTable.clinicId, apiKeyRecord.clinicId),
        ),
      }),
      db.query.clientsTable.findFirst({
        where: and(
          eq(clientsTable.id, parsed.clientId),
          eq(clientsTable.clinicId, apiKeyRecord.clinicId),
        ),
      }),
    ]);

    if (!professional || !client) {
      return NextResponse.json(
        { message: "Cliente ou profissional não encontrado na clínica" },
        { status: 404 },
      );
    }

    const appointmentDateTime = dayjs(parsed.date)
      .set("hour", parseInt(parsed.time.split(":")[0]))
      .set("minute", parseInt(parsed.time.split(":")[1]))
      .toDate();

    const conflict = await db.query.appointmentsTable.findFirst({
      where: and(
        eq(appointmentsTable.clinicId, apiKeyRecord.clinicId),
        eq(appointmentsTable.professionalId, parsed.professionalId),
        eq(appointmentsTable.date, appointmentDateTime),
      ),
    });

    if (conflict) {
      return NextResponse.json(
        { message: "Horário indisponível" },
        { status: 409 },
      );
    }

    const [appointment] = await db
      .insert(appointmentsTable)
      .values({
        clinicId: apiKeyRecord.clinicId,
        professionalId: parsed.professionalId,
        clientId: parsed.clientId,
        date: appointmentDateTime,
        appointmentPriceInCents: parsed.appointmentPriceInCents,
      })
      .returning();

    await db
      .update(integrationApiKeysTable)
      .set({ lastUsedAt: new Date() })
      .where(eq(integrationApiKeysTable.id, apiKeyRecord.id));

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Payload inválido", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/integrations/appointments:
 *   delete:
 *     summary: Cancel an appointment
 *     tags:
 *       - Appointments
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *       400:
 *         description: Missing appointment ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */
export async function DELETE(request: NextRequest) {
  try {
    const headerKey = request.headers
      .get("authorization")
      ?.replace("Bearer", "")
      .trim();
    const apiKey = headerKey || request.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json({ message: "API key ausente" }, { status: 401 });
    }

    const hashedKey = createHash("sha256").update(apiKey).digest("hex");

    const apiKeyRecord = await db.query.integrationApiKeysTable.findFirst({
      where: eq(integrationApiKeysTable.hashedKey, hashedKey),
    });

    if (!apiKeyRecord) {
      return NextResponse.json(
        { message: "Chave de API inválida" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("id");

    if (!appointmentId) {
      return NextResponse.json(
        { message: "ID do agendamento é obrigatório" },
        { status: 400 },
      );
    }

    const appointment = await db.query.appointmentsTable.findFirst({
      where: and(
        eq(appointmentsTable.id, appointmentId),
        eq(appointmentsTable.clinicId, apiKeyRecord.clinicId),
      ),
    });

    if (!appointment) {
      return NextResponse.json(
        { message: "Agendamento não encontrado" },
        { status: 404 },
      );
    }

    await db
      .delete(appointmentsTable)
      .where(eq(appointmentsTable.id, appointmentId));

    await db
      .update(integrationApiKeysTable)
      .set({ lastUsedAt: new Date() })
      .where(eq(integrationApiKeysTable.id, apiKeyRecord.id));

    return NextResponse.json({ message: "Agendamento cancelado com sucesso" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/integrations/appointments:
 *   put:
 *     summary: Update an appointment
 *     tags:
 *       - Appointments
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-25"
 *               time:
 *                 type: string
 *                 example: "14:30"
 *               professionalId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *       400:
 *         description: Invalid payload or missing ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment, Professional or Client not found
 *       409:
 *         description: Time slot unavailable
 */
export async function PUT(request: NextRequest) {
  try {
    const headerKey = request.headers
      .get("authorization")
      ?.replace("Bearer", "")
      .trim();
    const apiKey = headerKey || request.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json({ message: "API key ausente" }, { status: 401 });
    }

    const hashedKey = createHash("sha256").update(apiKey).digest("hex");

    const apiKeyRecord = await db.query.integrationApiKeysTable.findFirst({
      where: eq(integrationApiKeysTable.hashedKey, hashedKey),
    });

    if (!apiKeyRecord) {
      return NextResponse.json(
        { message: "Chave de API inválida" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("id");

    if (!appointmentId) {
      return NextResponse.json(
        { message: "ID do agendamento é obrigatório" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const updateSchema = z.object({
      date: z.string().date().optional(),
      time: z.string().optional(),
      professionalId: z.string().uuid().optional(),
    });

    const parsed = updateSchema.parse(body);

    const existingAppointment = await db.query.appointmentsTable.findFirst({
      where: and(
        eq(appointmentsTable.id, appointmentId),
        eq(appointmentsTable.clinicId, apiKeyRecord.clinicId),
      ),
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { message: "Agendamento não encontrado" },
        { status: 404 },
      );
    }

    // Prepare data for availability check
    const targetProfessionalId =
      parsed.professionalId || existingAppointment.professionalId;
    const targetDateStr = parsed.date
      ? parsed.date
      : dayjs(existingAppointment.date).format("YYYY-MM-DD");
    const targetTimeStr = parsed.time
      ? parsed.time
      : dayjs(existingAppointment.date).format("HH:mm");

    // If changing time/date/professional, check availability
    if (parsed.date || parsed.time || parsed.professionalId) {
      const appointmentDateTime = dayjs(targetDateStr)
        .set("hour", parseInt(targetTimeStr.split(":")[0]))
        .set("minute", parseInt(targetTimeStr.split(":")[1]))
        .toDate();

      // Check if professional exists (if changed)
      if (parsed.professionalId) {
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
      }

      // Check for conflicts (excluding the current appointment)
      const conflict = await db.query.appointmentsTable.findFirst({
        where: and(
          eq(appointmentsTable.clinicId, apiKeyRecord.clinicId),
          eq(appointmentsTable.professionalId, targetProfessionalId),
          eq(appointmentsTable.date, appointmentDateTime),
        ),
      });

      if (conflict && conflict.id !== appointmentId) {
        return NextResponse.json(
          { message: "Horário indisponível" },
          { status: 409 },
        );
      }

      // Update appointment
      const [updatedAppointment] = await db
        .update(appointmentsTable)
        .set({
          professionalId: targetProfessionalId,
          date: appointmentDateTime,
        })
        .where(eq(appointmentsTable.id, appointmentId))
        .returning();

      await db
        .update(integrationApiKeysTable)
        .set({ lastUsedAt: new Date() })
        .where(eq(integrationApiKeysTable.id, apiKeyRecord.id));

      return NextResponse.json({ appointment: updatedAppointment });
    }

    return NextResponse.json({ appointment: existingAppointment });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Payload inválido", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

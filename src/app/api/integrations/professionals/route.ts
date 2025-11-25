import { createHash } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { integrationApiKeysTable, professionalsTable } from "@/db/schema";

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

/**
 * @swagger
 * /api/integrations/professionals:
 *   get:
 *     summary: List professionals
 *     tags:
 *       - Professionals
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: cpf
 *         schema:
 *           type: string
 *         description: Filter by CPF
 *     responses:
 *       200:
 *         description: List of professionals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 professionals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       specialty:
 *                         type: string
 *                       cpf:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       workingDays:
 *                         type: array
 *                         items:
 *                           type: integer
 *                         description: Array of working days (0-6, where 0=Sunday)
 *                       appointmentPriceInCents:
 *                         type: integer
 *                       availableFromTime:
 *                         type: string
 *                       availableToTime:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
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
    const specialty = searchParams.get("specialty");
    const cpf = searchParams.get("cpf");

    const where = and(
      eq(professionalsTable.clinicId, apiKeyRecord.clinicId),
      specialty ? eq(professionalsTable.specialty, specialty) : undefined,
      cpf ? eq(professionalsTable.cpf, cpf) : undefined,
    );

    const professionals = await db.query.professionalsTable.findMany({
      where,
    });

    return NextResponse.json({
      professionals: professionals.map((p) => ({
        id: p.id,
        name: p.name,
        specialty: p.specialty,
        cpf: p.cpf,
        phone: p.phone,
        workingDays: p.workingDays,
        appointmentPriceInCents: p.appointmentPriceInCents,
        availableFromTime: p.availableFromTime,
        availableToTime: p.availableToTime,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

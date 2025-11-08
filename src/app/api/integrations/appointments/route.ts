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
  usersToClinicsTable,
} from "@/db/schema";

const schema = z.object({
  clinicId: z.string().uuid(),
  clientId: z.string().uuid(),
  professionalId: z.string().uuid(),
  date: z.string().date(),
  time: z.string(),
  appointmentPriceInCents: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const headerKey = request.headers.get("authorization")
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

    const membership = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.userId, apiKeyRecord.userId),
        eq(usersToClinicsTable.clinicId, parsed.clinicId),
      ),
    });

    if (!membership) {
      return NextResponse.json(
        { message: "Usuário não possui acesso a esta clínica" },
        { status: 403 },
      );
    }

    const [professional, client] = await Promise.all([
      db.query.professionalsTable.findFirst({
        where: and(
          eq(professionalsTable.id, parsed.professionalId),
          eq(professionalsTable.clinicId, parsed.clinicId),
        ),
      }),
      db.query.clientsTable.findFirst({
        where: and(
          eq(clientsTable.id, parsed.clientId),
          eq(clientsTable.clinicId, parsed.clinicId),
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
        eq(appointmentsTable.clinicId, parsed.clinicId),
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
        clinicId: parsed.clinicId,
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

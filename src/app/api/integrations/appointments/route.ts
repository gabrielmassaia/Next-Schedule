import { createHash } from "node:crypto";

import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import {
  appointmentsTable,
  doctorsTable,
  integrationApiKeysTable,
  patientsTable,
  usersToClinicsTable,
} from "@/db/schema";

const schema = z.object({
  clinicId: z.string().uuid(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
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

    const [doctor, patient] = await Promise.all([
      db.query.doctorsTable.findFirst({
        where: and(
          eq(doctorsTable.id, parsed.doctorId),
          eq(doctorsTable.clinicId, parsed.clinicId),
        ),
      }),
      db.query.patientsTable.findFirst({
        where: and(
          eq(patientsTable.id, parsed.patientId),
          eq(patientsTable.clinicId, parsed.clinicId),
        ),
      }),
    ]);

    if (!doctor || !patient) {
      return NextResponse.json(
        { message: "Paciente ou médico não encontrado na clínica" },
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
        eq(appointmentsTable.doctorId, parsed.doctorId),
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
        doctorId: parsed.doctorId,
        patientId: parsed.patientId,
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

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

    const where = specialty
      ? and(
          eq(professionalsTable.clinicId, apiKeyRecord.clinicId),
          eq(professionalsTable.specialty, specialty),
        )
      : eq(professionalsTable.clinicId, apiKeyRecord.clinicId);

    const professionals = await db.query.professionalsTable.findMany({
      where,
    });

    return NextResponse.json({
      professionals: professionals.map((p) => ({
        id: p.id,
        name: p.name,
        specialty: p.specialty,
        appointmentPriceInCents: p.appointmentPriceInCents,
        availableFromWeekDay: p.availableFromWeekDay,
        availableToWeekDay: p.availableToWeekDay,
        availableFromTime: p.availableFromTime,
        availableToTime: p.availableToTime,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

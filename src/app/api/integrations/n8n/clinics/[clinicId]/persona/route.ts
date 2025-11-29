import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import {
  clinicAgentSettingsTable,
  clinicFeaturesTable,
  clinicsTable,
} from "@/db/schema";
import { assertServiceToken } from "@/lib/service-token";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const authError = assertServiceToken(req);
  if (authError) return authError;

  const { clinicId } = await params;

  const [clinic, agentSettings, features] = await Promise.all([
    db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.id, clinicId),
      columns: {
        timezone: true,
      },
    }),
    db.query.clinicAgentSettingsTable.findFirst({
      where: eq(clinicAgentSettingsTable.clinicId, clinicId),
    }),
    db.query.clinicFeaturesTable.findFirst({
      where: eq(clinicFeaturesTable.clinicId, clinicId),
    }),
  ]);

  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  return NextResponse.json({
    tone: agentSettings?.assistantTone,
    welcomeMessage: agentSettings?.welcomeMessage,
    rules: agentSettings?.rules,
    appointmentFlow: agentSettings?.appointmentFlow,
    forbiddenTopics: agentSettings?.forbiddenTopics,
    language: agentSettings?.language,
    features: features,
    timezone: clinic.timezone,
  });
}

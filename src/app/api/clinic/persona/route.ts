import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { clinicAgentSettingsTable } from "@/db/schema";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json(
      { error: "Phone number is required" },
      { status: 400 },
    );
  }

  // Normalize phone number if necessary (remove non-digits)
  // For now, assuming exact match or basic cleaning
  // const cleanedPhone = phone.replace(/\D/g, "");

  // Find clinic by phone
  // Note: We might need to handle phone formatting differences.
  // Ideally, we search for the phone in the clinics table.
  // Assuming the phone in DB is stored cleanly or we search loosely.
  // Let's try exact match first, or matching the cleaned version.

  const clinic = await db.query.clinicsTable.findFirst({
    where: (clinics, { eq }) =>
      // Try to match phone directly or maybe with some wildcards if needed
      // For strictness, let's assume the input phone matches the stored phone
      eq(clinics.phone, phone),
  });

  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  const settings = await db.query.clinicAgentSettingsTable.findFirst({
    where: eq(clinicAgentSettingsTable.clinicId, clinic.id),
  });

  // Construct the response
  const response = {
    clinicId: clinic.id,
    clinicName: clinic.name,
    clinicType: "Geral", // Default or fetch from niche if available
    persona: settings
      ? {
          assistantTone: settings.assistantTone,
          welcomeMessage: settings.welcomeMessage,
          rules: settings.rules,
          appointmentFlow: settings.appointmentFlow,
          forbiddenTopics: settings.forbiddenTopics,
          availability: settings.availability,
          language: settings.language,
        }
      : null, // Or default persona
  };

  // If we have a niche, let's try to get the name
  if (clinic.nicheId) {
    const niche = await db.query.clinicNichesTable.findFirst({
      where: (niches, { eq }) => eq(niches.id, clinic.nicheId),
    });
    if (niche) {
      response.clinicType = niche.name;
    }
  }

  return NextResponse.json(response);
}

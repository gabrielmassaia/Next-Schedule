import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getPlanBySlug } from "@/data/subscription-plans";
import { db } from "@/db";
import { clinicAgentSettingsTable, usersToClinicsTable } from "@/db/schema";

/**
 * @swagger
 * /api/integrations/clinic-persona:
 *   get:
 *     summary: Get clinic AI persona settings
 *     description: Retrieves the AI assistant persona configuration for a clinic identified by phone number. This endpoint is used by N8N to configure the AI agent's behavior, tone, rules, and conversation flow.
 *     tags:
 *       - Clinic Persona
 *     parameters:
 *       - in: query
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *         description: The clinic's phone number
 *         example: "+5511999999999"
 *     responses:
 *       200:
 *         description: Clinic persona settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clinicId:
 *                   type: string
 *                   format: uuid
 *                   description: Unique identifier of the clinic
 *                 clinicName:
 *                   type: string
 *                   description: Name of the clinic
 *                 clinicType:
 *                   type: string
 *                   description: Type/niche of the clinic (e.g., "Odontologia", "Psicologia")
 *                 persona:
 *                   type: object
 *                   nullable: true
 *                   description: AI persona configuration (null if not configured)
 *                   properties:
 *                     assistantTone:
 *                       type: string
 *                       description: The tone the assistant should use (e.g., "Professional", "Friendly")
 *                       nullable: true
 *                     welcomeMessage:
 *                       type: string
 *                       description: Welcome message sent to patients
 *                       nullable: true
 *                     rules:
 *                       type: array
 *                       description: Behavioral rules the assistant must follow
 *                       items:
 *                         type: string
 *                     appointmentFlow:
 *                       type: array
 *                       description: Steps the assistant should follow when scheduling appointments
 *                       items:
 *                         type: string
 *                     forbiddenTopics:
 *                       type: array
 *                       description: Topics the assistant should not discuss
 *                       items:
 *                         type: string
 *                     availability:
 *                       type: string
 *                       description: Clinic's availability schedule
 *                       nullable: true
 *                     language:
 *                       type: string
 *                       description: Language code (e.g., "pt-BR", "en-US")
 *                       nullable: true
 *             example:
 *               clinicId: "550e8400-e29b-41d4-a716-446655440000"
 *               clinicName: "Clínica Exemplo"
 *               clinicType: "Odontologia"
 *               persona:
 *                 assistantTone: "Profissional e amigável"
 *                 welcomeMessage: "Olá! Bem-vindo à Clínica Exemplo. Como posso ajudá-lo hoje?"
 *                 rules:
 *                   - "Não fornecer diagnósticos médicos"
 *                   - "Sempre confirmar informações do paciente"
 *                 appointmentFlow:
 *                   - "Perguntar o nome do paciente"
 *                   - "Verificar disponibilidade"
 *                   - "Confirmar data e horário"
 *                 forbiddenTopics:
 *                   - "Política"
 *                   - "Religião"
 *                 availability: "Seg-Sex 08:00-18:00"
 *                 language: "pt-BR"
 *       400:
 *         description: Phone number is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Phone number is required"
 *       404:
 *         description: Clinic not found with the provided phone number
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Clinic not found"
 */
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

  // Check plan limits (Enterprise required for AI Agent)
  const clinicUsers = await db.query.usersToClinicsTable.findMany({
    where: eq(usersToClinicsTable.clinicId, clinic.id),
    with: {
      user: true,
    },
  });

  let hasEnterpriseAccess = false;

  for (const userClinic of clinicUsers) {
    const userPlan = await getPlanBySlug(userClinic.user.plan);
    if (userPlan.limits.aiAgent) {
      hasEnterpriseAccess = true;
      break;
    }
  }

  if (!hasEnterpriseAccess) {
    return NextResponse.json(
      {
        error:
          "Funcionalidade disponível apenas no plano Enterprise. Atualize seu plano para utilizar o Agente IA.",
      },
      { status: 403 },
    );
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

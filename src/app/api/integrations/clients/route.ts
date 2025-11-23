import { createHash } from "node:crypto";

import { and, eq, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { clientsTable, integrationApiKeysTable } from "@/db/schema";

const getClientSchema = z.object({
  email: z.string().email(),
  phoneNumber: z.string().length(11),
});

const createClientSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email().max(100),
  phoneNumber: z.string().length(11),
  sex: z.enum(["male", "female"]),
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

/**
 * @swagger
 * /api/integrations/clients:
 *   get:
 *     summary: Get a client by email and phone number
 *     tags:
 *       - Clients
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *       - in: query
 *         name: phoneNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client found
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client not found
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
    const email = searchParams.get("email");
    const phoneNumber = searchParams.get("phoneNumber");

    const parsed = getClientSchema.parse({ email, phoneNumber });

    const client = await db.query.clientsTable.findFirst({
      where: and(
        eq(clientsTable.clinicId, apiKeyRecord.clinicId),
        eq(clientsTable.email, parsed.email),
        eq(clientsTable.phoneNumber, parsed.phoneNumber),
      ),
    });

    if (!client) {
      return NextResponse.json(
        { message: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ client });
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

/**
 * @swagger
 * /api/integrations/clients:
 *   post:
 *     summary: Create a new client
 *     tags:
 *       - Clients
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
 *               - name
 *               - email
 *               - phoneNumber
 *               - sex
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *                 minLength: 11
 *                 maxLength: 11
 *               sex:
 *                 type: string
 *                 enum: [male, female]
 *     responses:
 *       201:
 *         description: Client created successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Client already exists
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

    const apiKeyRecord = await validateApiKey(apiKey);

    if (!apiKeyRecord) {
      return NextResponse.json(
        { message: "Chave de API inválida" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = createClientSchema.parse(body);

    // Check if client already exists
    const existingClient = await db.query.clientsTable.findFirst({
      where: and(
        eq(clientsTable.clinicId, apiKeyRecord.clinicId),
        or(
          and(
            eq(clientsTable.email, parsed.email),
            eq(clientsTable.phoneNumber, parsed.phoneNumber),
          ),
        ),
      ),
    });

    if (existingClient) {
      return NextResponse.json(
        { message: "Cliente já cadastrado com este email e telefone" },
        { status: 409 },
      );
    }

    const [client] = await db
      .insert(clientsTable)
      .values({
        clinicId: apiKeyRecord.clinicId,
        name: parsed.name,
        email: parsed.email,
        phoneNumber: parsed.phoneNumber,
        sex: parsed.sex,
        status: "active",
      })
      .returning();

    return NextResponse.json({ client }, { status: 201 });
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

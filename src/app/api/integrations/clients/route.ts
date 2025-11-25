import { createHash } from "node:crypto";

import { and, eq, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { clientsTable, integrationApiKeysTable } from "@/db/schema";

const getClientSchema = z
  .object({
    email: z.string().email().optional(),
    phoneNumber: z.string().length(11).optional(),
    cpf: z.string().optional(),
  })
  .refine((data) => data.cpf || (data.email && data.phoneNumber), {
    message: "Informe CPF ou (Email e Telefone)",
  });

const createClientSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email().max(100),
  phoneNumber: z.string().length(11),
  cpf: z.string().min(11).max(14),
  sex: z.enum(["male", "female"]),
});

const updateClientSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  email: z.string().email().max(100).optional(),
  phoneNumber: z.string().length(11).optional(),
  cpf: z.string().min(11).max(14).optional(),
  sex: z.enum(["male", "female"]).optional(),
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
 *     summary: Get a client by email and phone number OR by CPF
 *     tags:
 *       - Clients
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *       - in: query
 *         name: phoneNumber
 *         schema:
 *           type: string
 *       - in: query
 *         name: cpf
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
    const cpf = searchParams.get("cpf");

    const parsed = getClientSchema.parse({
      email: email || undefined,
      phoneNumber: phoneNumber || undefined,
      cpf: cpf || undefined,
    });

    const client = await db.query.clientsTable.findFirst({
      where: and(
        eq(clientsTable.clinicId, apiKeyRecord.clinicId),
        parsed.cpf
          ? eq(clientsTable.cpf, parsed.cpf)
          : and(
              eq(clientsTable.email, parsed.email!),
              eq(clientsTable.phoneNumber, parsed.phoneNumber!),
            ),
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
 *               - cpf
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
 *               cpf:
 *                 type: string
 *                 minLength: 11
 *                 maxLength: 14
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
          eq(clientsTable.cpf, parsed.cpf),
        ),
      ),
    });

    if (existingClient) {
      return NextResponse.json(
        { message: "Cliente já cadastrado com este email, telefone ou CPF" },
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
        cpf: parsed.cpf,
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

/**
 * @swagger
 * /api/integrations/clients:
 *   put:
 *     summary: Update a client
 *     tags:
 *       - Clients
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *                 minLength: 11
 *                 maxLength: 11
 *               cpf:
 *                 type: string
 *                 minLength: 11
 *                 maxLength: 14
 *               sex:
 *                 type: string
 *                 enum: [male, female]
 *     responses:
 *       200:
 *         description: Client updated successfully
 *       400:
 *         description: Invalid payload or ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client not found
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

    const apiKeyRecord = await validateApiKey(apiKey);

    if (!apiKeyRecord) {
      return NextResponse.json(
        { message: "Chave de API inválida" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("id");

    if (!clientId) {
      return NextResponse.json(
        { message: "ID do cliente é obrigatório" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = updateClientSchema.parse(body);

    const existingClient = await db.query.clientsTable.findFirst({
      where: and(
        eq(clientsTable.id, clientId),
        eq(clientsTable.clinicId, apiKeyRecord.clinicId),
      ),
    });

    if (!existingClient) {
      return NextResponse.json(
        { message: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    const [client] = await db
      .update(clientsTable)
      .set({
        ...parsed,
        updatedAt: new Date(),
      })
      .where(eq(clientsTable.id, clientId))
      .returning();

    return NextResponse.json({ client });
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
 * /api/integrations/clients:
 *   delete:
 *     summary: Inactivate a client
 *     tags:
 *       - Clients
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
 *         description: Client inactivated successfully
 *       400:
 *         description: Missing client ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client not found
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

    const apiKeyRecord = await validateApiKey(apiKey);

    if (!apiKeyRecord) {
      return NextResponse.json(
        { message: "Chave de API inválida" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("id");

    if (!clientId) {
      return NextResponse.json(
        { message: "ID do cliente é obrigatório" },
        { status: 400 },
      );
    }

    const existingClient = await db.query.clientsTable.findFirst({
      where: and(
        eq(clientsTable.id, clientId),
        eq(clientsTable.clinicId, apiKeyRecord.clinicId),
      ),
    });

    if (!existingClient) {
      return NextResponse.json(
        { message: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    await db
      .update(clientsTable)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(eq(clientsTable.id, clientId));

    return NextResponse.json({ message: "Cliente inativado com sucesso" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}

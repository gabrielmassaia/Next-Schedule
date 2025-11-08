"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { integrationApiKeysTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const revokeApiKey = actionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Não autenticado");
    }

    await db
      .delete(integrationApiKeysTable)
      .where(
        and(
          eq(integrationApiKeysTable.id, parsedInput.id),
          eq(integrationApiKeysTable.userId, session.user.id),
        ),
      );

    revalidatePath("/subscription");
  });

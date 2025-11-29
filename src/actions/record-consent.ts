"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { consentAcceptancesTable, legalDocumentsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function recordConsent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("User not authenticated");
  }

  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for") || headersList.get("x-real-ip");
  const userAgent = headersList.get("user-agent");

  // Get all active legal documents
  const activeDocuments = await db
    .select()
    .from(legalDocumentsTable)
    .where(eq(legalDocumentsTable.isActive, true));

  if (activeDocuments.length === 0) {
    return;
  }

  // Record acceptance for each document
  await db.insert(consentAcceptancesTable).values(
    activeDocuments.map((doc) => ({
      userId: session.user.id,
      documentId: doc.id,
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      userAgent: userAgent,
    })),
  );
}

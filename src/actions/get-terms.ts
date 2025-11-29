"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { legalDocumentsTable } from "@/db/schema";

export type LegalDocument = {
  type: string;
  content: string;
};

export async function getTerms(): Promise<LegalDocument[]> {
  const documents = await db
    .select()
    .from(legalDocumentsTable)
    .where(eq(legalDocumentsTable.isActive, true));

  return documents.map((doc) => ({
    type: doc.type,
    content: doc.content,
  }));
}

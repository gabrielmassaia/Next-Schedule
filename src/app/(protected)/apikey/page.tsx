import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { integrationApiKeysTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { IntegrationApiKeys } from "../subscription/_components/integration-api-keys";

export default async function ApiKeyPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/authentication");
  }

  if (!session.user.plan) {
    redirect("/signature");
  }

  const apiKeys = await db
    .select()
    .from(integrationApiKeysTable)
    .where(eq(integrationApiKeysTable.userId, session.user.id))
    .orderBy(desc(integrationApiKeysTable.createdAt));

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Chaves de API</PageTitle>
          <PageDescription>
            Gerencie e monitore as chaves de API utilizadas nas integrações do Next
            Schedule.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <IntegrationApiKeys
          apiKeys={apiKeys.map((key) => ({
            id: key.id,
            name: key.name,
            createdAt: key.createdAt.toISOString(),
            lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
          }))}
        />
      </PageContent>
    </PageContainer>
  );
}

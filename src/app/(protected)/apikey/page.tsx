import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { requirePlan } from "@/_helpers/require-plan";
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

import { IntegrationApiKeys } from "../subscription/_components/integration-api-keys";

export default async function ApiKeyPage() {
  const { activeClinic, plan } = await requirePlan();
  if (!activeClinic) {
    return null;
  }

  if (!plan.limits.apiKey) {
    redirect("/subscription");
  }

  const apiKeys = await db.query.integrationApiKeysTable.findMany({
    where: eq(integrationApiKeysTable.clinicId, activeClinic.id),
    orderBy: desc(integrationApiKeysTable.createdAt),
    with: {
      clinic: true,
    },
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Chaves de API</PageTitle>
          <PageDescription>
            Gerencie e monitore as chaves de API utilizadas nas integrações do
            Next Schedule.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <IntegrationApiKeys
          apiKeys={apiKeys.map((key) => ({
            id: key.id,
            name: key.name,
            clinicName: key.clinic.name,
            createdAt: key.createdAt.toISOString(),
            lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
          }))}
        />
      </PageContent>
    </PageContainer>
  );
}

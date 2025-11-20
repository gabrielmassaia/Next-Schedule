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

  // Get active clinic from cookies
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const activeClinicId = cookieStore.get("active-clinic-id")?.value;

  if (!activeClinicId) {
    return (
      <PageContainer>
        <PageHeader>
          <PageHeaderContent>
            <PageTitle>Chaves de API</PageTitle>
            <PageDescription>
              Selecione uma clínica para gerenciar as chaves de API.
            </PageDescription>
          </PageHeaderContent>
        </PageHeader>
      </PageContainer>
    );
  }

  const apiKeys = await db.query.integrationApiKeysTable.findMany({
    where: eq(integrationApiKeysTable.clinicId, activeClinicId),
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

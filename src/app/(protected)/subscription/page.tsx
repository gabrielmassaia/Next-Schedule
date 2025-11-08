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
import { getPlanBySlug,SUBSCRIPTION_PLANS } from "@/data/subscription-plans";
import { db } from "@/db";
import { integrationApiKeysTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { IntegrationApiKeys } from "./_components/integration-api-keys";
import { SubscriptionPlan } from "./_components/subscription-plan";

const SubscriptionPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/authentication");
  }

  const currentPlan = getPlanBySlug(session.user.plan);
  const clinicsCount = session.user.clinics?.length ?? 0;
  const apiKeys = await db
    .select()
    .from(integrationApiKeysTable)
    .where(eq(integrationApiKeysTable.userId, session.user.id))
    .orderBy(desc(integrationApiKeysTable.createdAt));

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Assinatura</PageTitle>
          <PageDescription>
            Gerencie a sua assinatura e visualize os limites disponíveis em cada
            plano.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <SubscriptionPlan
            key={plan.slug}
            plan={plan}
            isActive={plan.slug === currentPlan.slug}
            className="w-full"
          />
        ))}
      </PageContent>
      <PageContent className="mt-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Clínicas utilizadas: {clinicsCount}
          {typeof currentPlan.limits.clinics === "number"
            ? ` de ${currentPlan.limits.clinics}`
            : " (ilimitado)"}
        </p>
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
};

export default SubscriptionPage;

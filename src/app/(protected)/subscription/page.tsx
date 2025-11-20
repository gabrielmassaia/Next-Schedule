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
import { getPlanBySlug, getSubscriptionPlans } from "@/data/subscription-plans";
import { auth } from "@/lib/auth";

import { SubscriptionPlan } from "./_components/subscription-plan";

const SubscriptionPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/authentication");
  }

  if (!session.user.plan) {
    redirect("/signature");
  }

  const [currentPlan, plans] = await Promise.all([
    getPlanBySlug(session.user.plan),
    getSubscriptionPlans(),
  ]);
  const clinicsCount = session.user.clinics?.length ?? 0;

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
      <PageContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <SubscriptionPlan
              key={plan.slug}
              plan={plan}
              isActive={plan.slug === currentPlan.slug}
              className="h-full"
              inactiveCtaLabel={
                plan.slug !== currentPlan.slug ? "Upgrade plano" : undefined
              }
            />
          ))}
        </div>
      </PageContent>
      <PageContent>
        <div className="mt-6 space-y-4">
          <p className="text-muted-foreground text-sm">
            Clínicas utilizadas: {clinicsCount}
            {typeof currentPlan.limits.clinics === "number"
              ? ` de ${currentPlan.limits.clinics}`
              : " (ilimitado)"}
          </p>
          <p className="text-muted-foreground text-xs">
            Plano atual:{" "}
            <span className="text-foreground font-semibold">
              {currentPlan.name}
            </span>
          </p>
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default SubscriptionPage;

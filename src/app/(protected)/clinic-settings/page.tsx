import { eq } from "drizzle-orm";

import { requirePlan } from "@/_helpers/require-plan";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { getClinicNiches } from "@/data/clinic-niches";
import { db } from "@/db";
import { clinicsTable } from "@/db/schema";

import { ClinicSettingsForm } from "./_components/clinic-settings-form";

export default async function ClinicSettingsPage() {
  const { activeClinic } = await requirePlan();
  if (!activeClinic) {
    return null;
  }

  const fullClinic = await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.id, activeClinic.id),
    with: {
      niche: true,
      operatingHours: true,
      insurancePlans: true,
    },
  });

  if (!fullClinic) {
    return null;
  }

  const niches = await getClinicNiches();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Gerenciamento de Clínica</PageTitle>
          <PageDescription>
            Gerencie as informações da clínica {activeClinic.name}
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <ClinicSettingsForm clinic={fullClinic} niches={niches} />
      </PageContent>
    </PageContainer>
  );
}

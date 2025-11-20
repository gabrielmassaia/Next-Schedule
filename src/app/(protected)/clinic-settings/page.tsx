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

import { ClinicSettingsForm } from "./_components/clinic-settings-form";

export default async function ClinicSettingsPage() {
  const { activeClinic } = await requirePlan();
  if (!activeClinic) {
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
        <ClinicSettingsForm clinic={activeClinic} niches={niches} />
      </PageContent>
    </PageContainer>
  );
}

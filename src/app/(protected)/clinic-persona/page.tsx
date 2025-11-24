import { Bot } from "lucide-react";

import { requirePlan } from "@/_helpers/require-plan";
import { getClinicSettingsAgent } from "@/actions/clinic-settings-actions";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";

import { ClinicPersonaForm } from "./_components/clinic-persona-form";

export default async function ClinicPersonaPage() {
  const { activeClinic } = await requirePlan();
  if (!activeClinic) {
    return null;
  }

  const personaSettings = await getClinicSettingsAgent();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            <PageTitle>Personalidade IA</PageTitle>
          </div>
          <PageDescription>
            Configure o comportamento, tom e regras do assistente virtual da
            clínica {activeClinic.name}.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <ClinicPersonaForm initialData={personaSettings} />
      </PageContent>
    </PageContainer>
  );
}

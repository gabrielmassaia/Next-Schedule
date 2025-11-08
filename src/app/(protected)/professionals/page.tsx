import { eq } from "drizzle-orm";

import { requirePlan } from "@/_helpers/require-plan";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { professionalsTable } from "@/db/schema";

import AddProfessionalButton from "./_components/add-professional-button";
import ProfessionalCard from "./_components/professional-card";

export default async function ProfessionalsPage() {
  const { activeClinic, plan } = await requirePlan("essential");
  if (!activeClinic) {
    return null;
  }

  const professionals = await db.query.professionalsTable.findMany({
    where: eq(professionalsTable.clinicId, activeClinic.id),
  });

  const maxProfessionals = plan.limits.professionalsPerClinic;
  const hasReachedLimit =
    typeof maxProfessionals === "number" &&
    professionals.length >= maxProfessionals;

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Profissionais</PageTitle>
          <PageDescription>
            Gerenciamento dos profissionais cadastrados no sistema
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddProfessionalButton
            disabled={hasReachedLimit}
            helperText={
              hasReachedLimit
                ? "Limite de profissionais do plano atingido. Faça upgrade para cadastrar mais."
                : undefined
            }
          />
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="grid grid-cols-3 gap-6">
          {professionals.map((professional) => (
            <ProfessionalCard key={professional.id} professional={professional} />
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
}

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
import { clinicSpecialtiesTable } from "@/db/schema";

import AddSpecialtyButton from "./_components/add-specialty-button";
import SpecialtyCard from "./_components/specialty-card";

export default async function SpecialtiesPage() {
  const { activeClinic } = await requirePlan("essential");

  if (!activeClinic) {
    return null;
  }

  const specialties = await db.query.clinicSpecialtiesTable.findMany({
    where: eq(clinicSpecialtiesTable.clinicId, activeClinic.id),
    orderBy: (specialty, { asc }) => [asc(specialty.name)],
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Especialidades</PageTitle>
          <PageDescription>
            Configure as especialidades disponíveis na sua clínica para vincular aos
            profissionais e organizar o portfólio de serviços.
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddSpecialtyButton clinicId={activeClinic.id} />
        </PageActions>
      </PageHeader>
      <PageContent>
        {specialties.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {specialties.map((specialty) => (
              <SpecialtyCard
                key={specialty.id}
                specialty={{
                  id: specialty.id,
                  name: specialty.name,
                  description: specialty.description,
                  createdAt: specialty.createdAt.toISOString(),
                }}
                clinicId={activeClinic.id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma especialidade cadastrada. Utilize o botão acima para adicionar as
              especialidades oferecidas na sua clínica.
            </p>
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
}

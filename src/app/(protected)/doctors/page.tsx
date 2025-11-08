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
import { clinicSpecialtiesTable, professionalsTable } from "@/db/schema";

import AddDoctorButton from "./_components/add-doctor-button";
import DoctorCard from "./_components/doctor-card";

export default async function DoctorsPage() {
  const { activeClinic, plan } = await requirePlan("essential");
  if (!activeClinic) {
    return null;
  }

  const doctors = await db.query.professionalsTable.findMany({
    where: eq(professionalsTable.clinicId, activeClinic.id),
  });

  const specialties = await db.query.clinicSpecialtiesTable.findMany({
    where: eq(clinicSpecialtiesTable.clinicId, activeClinic.id),
    orderBy: (specialty, { asc }) => [asc(specialty.name)],
  });

  const maxProfessionals = plan.limits.professionalsPerClinic;
  const hasReachedLimit =
    typeof maxProfessionals === "number" &&
    doctors.length >= maxProfessionals;
  const isMissingSpecialties = specialties.length === 0;

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
          <AddDoctorButton
            disabled={hasReachedLimit || isMissingSpecialties}
            specialties={specialties.map((specialty) => ({
              id: specialty.id,
              name: specialty.name,
            }))}
            helperText={
              hasReachedLimit
                ? "Limite de profissionais do plano atingido. Faça upgrade para cadastrar mais."
                : isMissingSpecialties
                  ? "Cadastre ao menos uma especialidade para adicionar profissionais."
                : undefined
            }
          />
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="grid grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              specialties={specialties.map((specialty) => ({
                id: specialty.id,
                name: specialty.name,
              }))}
            />
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
}

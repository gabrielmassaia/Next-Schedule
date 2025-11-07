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
import { doctorsTable } from "@/db/schema";

import AddDoctorButton from "./_components/add-doctor-button";
import DoctorCard from "./_components/doctor-card";

export default async function DoctorsPage() {
  const { activeClinic, plan } = await requirePlan("essential");
  if (!activeClinic) {
    return null;
  }

  const doctors = await db.query.doctorsTable.findMany({
    where: eq(doctorsTable.clinicId, activeClinic.id),
  });

  const maxDoctors = plan.limits.doctorsPerClinic;
  const hasReachedLimit =
    typeof maxDoctors === "number" && doctors.length >= maxDoctors;

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Doutores</PageTitle>
          <PageDescription>
            Gerenciamento dos profissionais cadastrados no sistema
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddDoctorButton
            disabled={hasReachedLimit}
            helperText={
              hasReachedLimit
                ? "Limite de médicos do plano atingido. Faça upgrade para cadastrar mais."
                : undefined
            }
          />
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="grid grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
}

import { eq } from "drizzle-orm";

import { requirePlan } from "@/_helpers/require-plan";
import {
  PageActions,
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { patientsTable } from "@/db/schema";

import AddPatientButton from "./_components/add-patient-button";
import { PatientsTable } from "./_components/patients-table";

export default async function PatientsPage() {
  const { activeClinic, plan } = await requirePlan("essential");
  if (!activeClinic) {
    return null;
  }

  const patients = await db.query.patientsTable.findMany({
    where: eq(patientsTable.clinicId, activeClinic.id),
    orderBy: (patients, { desc }) => [desc(patients.createdAt)],
  });

  const maxPatients = plan.limits.patientsPerClinic;
  const hasReachedLimit =
    typeof maxPatients === "number" && patients.length >= maxPatients;

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Pacientes</PageTitle>
          <PageDescription>
            Gerencie os pacientes da sua clínica
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddPatientButton
            disabled={hasReachedLimit}
            helperText={
              hasReachedLimit
                ? "Limite de pacientes do plano atingido. Faça upgrade para cadastrar mais."
                : undefined
            }
          />
        </PageActions>
      </PageHeader>
      <PatientsTable patients={patients} />
    </PageContainer>
  );
}

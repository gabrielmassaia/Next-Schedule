import { eq } from "drizzle-orm";

import { requirePlan } from "@/_helpers/require-plan";
import { DataTable } from "@/components/ui/data-table";
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
import {
  appointmentsTable,
  clientsTable,
  professionalsTable,
} from "@/db/schema";

import AddAppointmentButton from "./_components/add-appointment-button";
import { appointmentsTableColumns } from "./_components/table-columns";

const AppointmentsPage = async () => {
  const { activeClinic } = await requirePlan("essential");
  if (!activeClinic) {
    return null;
  }

  const [clients, professionals, appointments] = await Promise.all([
    db.query.clientsTable.findMany({
      where: eq(clientsTable.clinicId, activeClinic.id),
    }),
    db.query.professionalsTable.findMany({
      where: eq(professionalsTable.clinicId, activeClinic.id),
    }),
    db.query.appointmentsTable.findMany({
      where: eq(appointmentsTable.clinicId, activeClinic.id),
      with: {
        client: true,
        professional: true,
      },
    }),
  ]);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Agendamentos</PageTitle>
          <PageDescription>
            Gerencie os agendamentos da sua clínica
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddAppointmentButton
            clients={clients}
            professionals={professionals}
          />
        </PageActions>
      </PageHeader>
      <PageContent>
        <DataTable data={appointments} columns={appointmentsTableColumns} />
      </PageContent>
    </PageContainer>
  );
};

export default AppointmentsPage;

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

import { getAppointments } from "./_actions/get-appointments";
import { getFormData } from "./_actions/get-form-data";
import AddAppointmentButton from "./_components/add-appointment-button";
import { AppointmentsTable } from "./_components/appointments-table";

interface AppointmentsPageProps {
  searchParams: Promise<{
    page?: string;
    clientName?: string;
    professionalName?: string;
    date?: string;
    specialty?: string;
  }>;
}

const AppointmentsPage = async (props: AppointmentsPageProps) => {
  const searchParams = await props.searchParams;
  const { activeClinic } = await requirePlan("essential");
  if (!activeClinic) {
    return null;
  }

  const page = Number(searchParams.page) || 1;
  const clientName = searchParams.clientName;
  const professionalName = searchParams.professionalName;
  const date = searchParams.date;
  const specialty = searchParams.specialty;

  const [{ clients, professionals }, { appointments, pageCount }] =
    await Promise.all([
      getFormData(),
      getAppointments({
        page,
        clientName,
        professionalName,
        date,
        specialty,
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
        <AppointmentsTable
          appointments={appointments}
          pageCount={pageCount}
          currentPage={page}
        />
      </PageContent>
    </PageContainer>
  );
};

export default AppointmentsPage;

import dayjs from "dayjs";
import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";

import { requirePlan } from "@/_helpers/require-plan";
import { ClinicSelectionModal } from "@/components/clinic-selection-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getDashboard } from "@/data/get-dashboard";
import { readActiveClinicIdFromCookies } from "@/lib/clinic-session";

import { appointmentsTableColumns } from "../appointments/_components/table-columns";
import AppointmentsChart from "./_components/appointments-chart";
import { DatePicker } from "./_components/date-picker";
import StatsCards from "./_components/stats-cards";
import TopProfessionals from "./_components/top-professionals";
import TopSpecialties from "./_components/top-specialties";

interface DashboardPageProps {
  searchParams: Promise<{
    from: string;
    to: string;
  }>;
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const { activeClinic, clinics } = await requirePlan();
  if (!activeClinic) {
    return null;
  }

  // Verificar se precisa mostrar modal de seleção
  const cookieClinicId = await readActiveClinicIdFromCookies();
  const shouldShowModal = clinics.length > 1 && !cookieClinicId;

  const { from, to } = await searchParams;
  if (!from || !to) {
    const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
    const endOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");
    redirect(`/dashboard?from=${startOfMonth}&to=${endOfMonth}`);
  }
  const {
    totalRevenue,
    totalAppointments,
    totalClients,
    totalProfessionals,
    topProfessionals,
    topSpecialties,
    todayAppointments,
    dailyAppointmentsData,
  } = await getDashboard({
    from,
    to,
    clinicId: activeClinic.id,
  });

  return (
    <>
      {shouldShowModal && (
        <ClinicSelectionModal clinics={clinics} open={true} />
      )}
      <PageContainer>
        <PageHeader>
          <PageHeaderContent>
            <PageTitle>Dashboard</PageTitle>
            <PageDescription>
              Tenha uma visão geral da sua clínica.
            </PageDescription>
          </PageHeaderContent>
          <PageActions>
            <DatePicker />
          </PageActions>
        </PageHeader>
        <PageContent>
          <StatsCards
            totalRevenue={
              totalRevenue.total ? Number(totalRevenue.total) : null
            }
            totalAppointments={totalAppointments.total}
            totalClients={totalClients.total}
            totalProfessionals={totalProfessionals.total}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <div className="col-span-1 lg:col-span-4">
              <AppointmentsChart
                dailyAppointmentsData={dailyAppointmentsData}
                from={from}
                to={to}
              />
            </div>
            <div className="col-span-1 lg:col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Calendar className="text-muted-foreground" />
                    <CardTitle className="text-base">
                      Agendamentos de hoje
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={appointmentsTableColumns}
                    data={todayAppointments}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <div className="col-span-1 lg:col-span-4">
              <TopProfessionals professionals={topProfessionals} />
            </div>
            <div className="col-span-1 lg:col-span-3">
              <TopSpecialties topSpecialties={topSpecialties} />
            </div>
          </div>
        </PageContent>
      </PageContainer>
    </>
  );
};

export default DashboardPage;

"use client";

import { useMemo } from "react";

import { getAppointmentsTableColumns } from "@/app/(protected)/appointments/_components/table-columns";
import { DataTable } from "@/components/ui/data-table";
import {
  appointmentsTable,
  clientsTable,
  professionalsTable,
} from "@/db/schema";

interface DashboardAppointmentsTableProps {
  appointments: (typeof appointmentsTable.$inferSelect & {
    client: {
      id: string;
      name: string;
      email: string;
      phoneNumber: string;
      sex: "male" | "female";
    } | null;
    professional: {
      id: string;
      name: string;
      specialty: string;
      appointmentPriceInCents: number;
    } | null;
  })[];
  clients: (typeof clientsTable.$inferSelect)[];
  professionals: (typeof professionalsTable.$inferSelect)[];
}

export function DashboardAppointmentsTable({
  appointments,
  clients,
  professionals,
}: DashboardAppointmentsTableProps) {
  const columns = useMemo(
    () => getAppointmentsTableColumns(clients, professionals),
    [clients, professionals],
  );

  return <DataTable columns={columns} data={appointments} />;
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";

import { Activity } from "@/components/ui/activity";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { LoadingContent } from "@/components/ui/Loading/LoadingContent";
import {
  appointmentsTable,
  clientsTable,
  professionalsTable,
} from "@/db/schema";

import { getAppointmentsTableColumns } from "./table-columns";
import { TableFilters } from "./table-filters";

interface AppointmentsTableProps {
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
  pageCount: number;
  currentPage: number;
  clients: (typeof clientsTable.$inferSelect)[];
  professionals: (typeof professionalsTable.$inferSelect)[];
}

export function AppointmentsTable({
  appointments,
  pageCount,
  currentPage,
  clients,
  professionals,
}: AppointmentsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const columns = useMemo(
    () => getAppointmentsTableColumns(clients, professionals),
    [clients, professionals],
  );

  const handlePageChange = (page: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", page.toString());
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-4">
      {isPending && <LoadingContent className="h-96 justify-center" />}
      <Activity mode={isPending ? "hidden" : "visible"}>
        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={appointments}
              filters={TableFilters}
              pageCount={pageCount}
              manualPagination
              pageIndex={currentPage - 1}
              onPageChange={handlePageChange}
              onTransition={startTransition}
            />
          </CardContent>
        </Card>
      </Activity>
    </div>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { LoadingContent } from "@/_components/Loading/LoadingContent";
import { Activity } from "@/components/ui/activity";
import { DataTable } from "@/components/ui/data-table";

import { appointmentsTableColumns } from "./table-columns";
import { TableFilters } from "./table-filters";

interface AppointmentsTableProps {
  appointments: any[];
  pageCount: number;
  currentPage: number;
}

export function AppointmentsTable({
  appointments,
  pageCount,
  currentPage,
}: AppointmentsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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
        <DataTable
          columns={appointmentsTableColumns}
          data={appointments}
          filters={TableFilters}
          pageCount={pageCount}
          manualPagination
          pageIndex={currentPage - 1}
          onPageChange={handlePageChange}
        />
      </Activity>
    </div>
  );
}

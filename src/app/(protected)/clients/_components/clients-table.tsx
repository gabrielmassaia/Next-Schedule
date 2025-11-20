"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Activity } from "@/components/ui/activity";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { LoadingContent } from "@/components/ui/Loading/LoadingContent";
import { clientsTable } from "@/db/schema";

import { ClientsTableColumns } from "./table-columns";
import { TableFilters } from "./table-filters";

interface ClientsTableProps {
  clients: (typeof clientsTable.$inferSelect)[];
  pageCount: number;
  currentPage: number;
}

export function ClientsTable({
  clients,
  pageCount,
  currentPage,
}: ClientsTableProps) {
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
        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={ClientsTableColumns}
              data={clients}
              filters={TableFilters}
              pageCount={pageCount}
              manualPagination
              pageIndex={currentPage - 1}
              onPageChange={handlePageChange}
            />
          </CardContent>
        </Card>
      </Activity>
    </div>
  );
}

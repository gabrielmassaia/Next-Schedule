"use client";

import { DataTable } from "@/components/ui/data-table";
import { clientsTable } from "@/db/schema";

import { ClientsTableColumns } from "./table-columns";
import { TableFilters } from "./table-filters";

interface ClientsTableProps {
  clients: (typeof clientsTable.$inferSelect)[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  return (
    <div className="space-y-4">
      <DataTable
        columns={ClientsTableColumns}
        data={clients}
        filters={TableFilters}
      />
    </div>
  );
}

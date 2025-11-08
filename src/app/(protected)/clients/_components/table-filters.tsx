import { Table } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clientsTable } from "@/db/schema";

interface TableFiltersProps {
  table: Table<typeof clientsTable.$inferSelect>;
}

const statusOptions = {
  all: "Todos",
  active: "Ativos",
  inactive: "Inativos",
} as const;

export function TableFilters({ table }: TableFiltersProps) {
  const currentStatus =
    (table.getColumn("status")?.getFilterValue() as string[])?.[0] ?? "all";

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-64">
          <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
          <Input
            placeholder="Buscar clientes..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-8"
          />
        </div>
        <Select
          value={currentStatus}
          onValueChange={(value) => {
            if (value === "all") {
              table.getColumn("status")?.setFilterValue(undefined);
            } else {
              table.getColumn("status")?.setFilterValue([value]);
            }
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              {statusOptions[currentStatus as keyof typeof statusOptions]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusOptions).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            table.getColumn("name")?.setFilterValue("");
            table.getColumn("status")?.setFilterValue(undefined);
          }}
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}

"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusOptions = {
  all: "Todos",
  active: "Ativos",
  inactive: "Inativos",
} as const;

export function TableFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("query");
    params.delete("status");
    params.set("page", "1");
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div className="flex w-full flex-col items-start gap-2 space-x-0 md:flex-row md:items-center md:space-x-2">
        <div className="relative w-full md:w-64">
          <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
          <Input
            placeholder="Buscar clientes..."
            onChange={(e) => handleSearch(e.target.value)}
            defaultValue={searchParams.get("query")?.toString()}
            className="pl-8"
          />
        </div>
        <Select
          value={searchParams.get("status")?.toString() || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue>
              {
                statusOptions[
                  (searchParams.get("status") as keyof typeof statusOptions) ||
                    "all"
                ]
              }
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
          onClick={clearFilters}
          className="w-full md:w-auto"
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}

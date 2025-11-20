"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TableFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((key: string, term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (term) {
      params.set(key, term);
    } else {
      params.delete(key);
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("clientName");
    params.delete("professionalName");
    params.delete("date");
    params.delete("specialty");
    params.set("page", "1");
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Cliente..."
          defaultValue={searchParams.get("clientName")?.toString()}
          onChange={(e) => handleSearch("clientName", e.target.value)}
          className="w-full sm:w-48"
        />
        <Input
          placeholder="Profissional..."
          defaultValue={searchParams.get("professionalName")?.toString()}
          onChange={(e) => handleSearch("professionalName", e.target.value)}
          className="w-full sm:w-48"
        />
        <Input
          placeholder="Especialidade..."
          defaultValue={searchParams.get("specialty")?.toString()}
          onChange={(e) => handleSearch("specialty", e.target.value)}
          className="w-full sm:w-48"
        />
        <Input
          type="date"
          defaultValue={searchParams.get("date")?.toString()}
          onChange={(e) => handleSearch("date", e.target.value)}
          className="w-full sm:w-40"
        />
        <Button variant="outline" onClick={handleClearFilters}>
          Limpar
        </Button>
      </div>
    </div>
  );
}

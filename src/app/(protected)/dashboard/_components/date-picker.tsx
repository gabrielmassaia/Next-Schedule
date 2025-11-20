"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { parseAsIsoDate, useQueryState } from "nuqs";
import * as React from "react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DatePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const [from, setFrom] = useQueryState("from", {
    ...parseAsIsoDate,
    shallow: false,
  });
  const [to, setTo] = useQueryState("to", {
    ...parseAsIsoDate,
    shallow: false,
  });

  const handleDateSelect = (dateRange: DateRange | undefined) => {
    if (dateRange?.from) {
      const fromDate = new Date(
        Date.UTC(
          dateRange.from.getFullYear(),
          dateRange.from.getMonth(),
          dateRange.from.getDate(),
        ),
      );
      setFrom(fromDate);
    }
    if (dateRange?.to) {
      const toDate = new Date(
        Date.UTC(
          dateRange.to.getFullYear(),
          dateRange.to.getMonth(),
          dateRange.to.getDate(),
        ),
      );
      setTo(toDate);
    }
  };

  const date = {
    from: from
      ? new Date(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
      : undefined,
    to: to
      ? new Date(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
      : undefined,
  };
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y", {
                    locale: ptBR,
                  })}{" "}
                  -{" "}
                  {format(date.to, "LLL dd, y", {
                    locale: ptBR,
                  })}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

"use client";

import { endOfMonth, format, startOfMonth } from "date-fns";
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
  const [from, setFrom] = useQueryState(
    "from",
    parseAsIsoDate.withDefault(startOfMonth(new Date())),
  );
  const [to, setTo] = useQueryState(
    "to",
    parseAsIsoDate.withDefault(endOfMonth(new Date())),
  );

  // Helper to adjust date for display (UTC string to Local Date)
  // When nuqs parses "2025-11-01", it creates a UTC date.
  // We need to adjust it to be displayed correctly in the local timezone if needed,
  // but actually, the issue is likely that the Calendar component expects a local date.
  // If 'from' is 2025-11-01T00:00:00.000Z, and we are in -03:00, it is 2025-10-31 21:00.
  // We want 2025-11-01 to be selected.
  // So we should add the timezone offset or parse it as local.

  const handleDateSelect = (dateRange: DateRange | undefined) => {
    if (dateRange?.from) {
      setFrom(dateRange.from);
    }
    if (dateRange?.to) {
      setTo(dateRange.to);
    }
  };

  // We don't adjust for the Calendar 'selected' prop because react-day-picker handles dates.
  // But wait, if 'from' is UTC midnight, react-day-picker (running in browser) sees it as previous day.
  // So we DO need to adjust it for the Calendar.

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

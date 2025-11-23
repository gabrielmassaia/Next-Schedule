"use client";

import { useFieldArray, useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const DAYS_OF_WEEK = [
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

interface OperatingHour {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
}

export function OperatingHoursInput() {
  const form = useFormContext();
  const { fields } = useFieldArray({
    control: form.control,
    name: "operatingHours",
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Dias e horários de atendimento</h3>
        <p className="text-muted-foreground text-sm">
          Selecione os dias e horários em que você atende
        </p>
      </div>

      <div className="rounded-lg border">
        <div className="bg-muted/50 grid grid-cols-[2fr_1.5fr_1.5fr_auto] gap-4 border-b p-4 text-sm font-medium">
          <div>Dia</div>
          <div>Início</div>
          <div>Término</div>
          <div>Ativo</div>
        </div>

        {fields.map((field, index) => {
          const typedField = field as OperatingHour & { id: string };
          const dayLabel = DAYS_OF_WEEK.find(
            (d) => d.value === typedField.dayOfWeek,
          )?.label;

          return (
            <div
              key={field.id}
              className="grid grid-cols-[2fr_1.5fr_1.5fr_auto] gap-4 border-b p-4 last:border-b-0"
            >
              <div className="flex items-center">
                <span className="text-sm font-medium">{dayLabel}</span>
              </div>

              <FormField
                control={form.control}
                name={`operatingHours.${index}.startTime`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        disabled={
                          !form.watch(`operatingHours.${index}.isActive`)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`operatingHours.${index}.endTime`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        disabled={
                          !form.watch(`operatingHours.${index}.isActive`)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`operatingHours.${index}.isActive`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

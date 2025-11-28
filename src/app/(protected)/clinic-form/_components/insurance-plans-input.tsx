"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";

import { searchAnsInsurancePlans } from "@/actions/insurance-plans/search-ans-plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface InsurancePlan {
  id: string;
  name: string;
  ansRegistration?: string;
  isManual: boolean;
}

export function InsurancePlansInput() {
  const form = useFormContext();
  const [searchResults, setSearchResults] = useState<InsurancePlan[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualPlanName, setManualPlanName] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const searchPlans = useDebouncedCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchAnsInsurancePlans(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching plans:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 500);

  const addPlan = (plan: InsurancePlan) => {
    const currentPlans = form.getValues("insurancePlans") || [];
    const alreadyExists = currentPlans.some(
      (p: InsurancePlan) => p.id === plan.id,
    );

    if (!alreadyExists) {
      form.setValue("insurancePlans", [...currentPlans, plan]);
    }
  };

  const removePlan = (planId: string) => {
    const currentPlans = form.getValues("insurancePlans") || [];
    form.setValue(
      "insurancePlans",
      currentPlans.filter((p: InsurancePlan) => p.id !== planId),
    );
  };

  const addManualPlan = () => {
    if (!manualPlanName.trim()) return;

    const manualPlan: InsurancePlan = {
      id: `manual-${Date.now()}`,
      name: manualPlanName.trim(),
      isManual: true,
    };

    addPlan(manualPlan);
    setManualPlanName("");
    setShowManualInput(false);
  };

  const serviceType = form.watch("serviceType");
  const selectedPlans = form.watch("insurancePlans") || [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Tipo de atendimento</h3>
        <p className="text-muted-foreground text-sm">
          Você atende por convênio, particular ou ambos?
        </p>
      </div>

      <FormField
        control={form.control}
        name="serviceType"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="convenio" id="convenio" />
                  <Label htmlFor="convenio" className="cursor-pointer">
                    Convênio
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="particular" id="particular" />
                  <Label htmlFor="particular" className="cursor-pointer">
                    Particular
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ambos" id="ambos" />
                  <Label htmlFor="ambos" className="cursor-pointer">
                    Ambos
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {(serviceType === "convenio" || serviceType === "ambos") && (
        <div className="space-y-4">
          <div>
            <FormLabel>Planos aceitos</FormLabel>
            <p className="text-muted-foreground text-sm">
              Selecione os planos de saúde que você aceita
            </p>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                Buscar plano de saúde...
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Digite o nome do plano..."
                  onValueChange={searchPlans}
                />
                <CommandList>
                  <CommandEmpty>
                    {isSearching ? "Buscando..." : "Nenhum plano encontrado"}
                  </CommandEmpty>
                  <CommandGroup>
                    {searchResults.map((plan) => (
                      <CommandItem key={plan.id} onSelect={() => addPlan(plan)}>
                        <div className="flex flex-col">
                          <span>{plan.name}</span>
                          {plan.ansRegistration && (
                            <span className="text-muted-foreground text-xs">
                              Registro ANS: {plan.ansRegistration}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="manual"
              checked={showManualInput}
              onCheckedChange={(checked) =>
                setShowManualInput(checked as boolean)
              }
            />
            <Label htmlFor="manual" className="cursor-pointer text-sm">
              Não encontrei meu plano e quero adicionar manualmente
            </Label>
          </div>

          {showManualInput && (
            <div className="flex gap-2">
              <Input
                placeholder="Nome do plano"
                value={manualPlanName}
                onChange={(e) => setManualPlanName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addManualPlan();
                  }
                }}
              />
              <Button type="button" onClick={addManualPlan}>
                Adicionar
              </Button>
            </div>
          )}

          {selectedPlans.length > 0 && (
            <div>
              <Label>Planos selecionados:</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedPlans.map((plan: InsurancePlan) => (
                  <Badge key={plan.id} variant="secondary" className="gap-2">
                    <span>{plan.name}</span>
                    {plan.ansRegistration && (
                      <span className="text-muted-foreground text-xs">
                        ({plan.ansRegistration})
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removePlan(plan.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

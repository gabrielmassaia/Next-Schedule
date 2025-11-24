"use client";

import { useFormContext } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

const PAYMENT_METHODS = [
  { id: "pix", label: "PIX" },
  { id: "dinheiro", label: "Dinheiro" },
  { id: "debito", label: "Cartão de Débito" },
  { id: "credito", label: "Cartão de Crédito" },
  { id: "cheque", label: "Cheque" },
  { id: "transferencia", label: "Transferência Bancária" },
  { id: "boleto", label: "Boleto" },
  { id: "convenio", label: "Cartões de Convênio" },
];

export function PaymentMethodsInput() {
  const form = useFormContext();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Formas de pagamento</h3>
        <p className="text-muted-foreground text-sm">
          Selecione as formas de pagamento aceitas
        </p>
      </div>

      <FormField
        control={form.control}
        name="paymentMethods"
        render={() => (
          <FormItem>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {PAYMENT_METHODS.map((method) => (
                <FormField
                  key={method.id}
                  control={form.control}
                  name="paymentMethods"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={method.id}
                        className="flex flex-row items-start space-y-0 space-x-3"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(method.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, method.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value: string) => value !== method.id,
                                    ),
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal">
                          {method.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}

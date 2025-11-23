"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { upsertClinicSettingsAgent } from "@/actions/clinic-settings-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ClinicPersonaSchema,
  clinicPersonaSchema,
} from "@/lib/validations/clinic-settings";

interface ClinicPersonaFormProps {
  initialData?: ClinicPersonaSchema | null;
}

export function ClinicPersonaForm({ initialData }: ClinicPersonaFormProps) {
  const form = useForm<ClinicPersonaSchema>({
    resolver: zodResolver(clinicPersonaSchema),
    defaultValues: initialData || {
      assistantTone: "",
      welcomeMessage: "",
      rules: "{}",
      appointmentFlow: "{}",
      forbiddenTopics: "{}",
      availability: "",
      autoResponsesEnabled: true,
      language: "pt-BR",
    },
  });

  const { execute, status } = useAction(upsertClinicSettingsAgent, {
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    },
  });

  function onSubmit(values: ClinicPersonaSchema) {
    execute(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração da Persona (N8N)</CardTitle>
        <CardDescription>
          Defina como o agente de IA deve se comportar no WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dados Gerais</h3>
              <FormField
                control={form.control}
                name="assistantTone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tom do Assistente</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Educado, formal, direto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="welcomeMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem de Boas-vindas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Olá! Como posso ajudar?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Regras e Fluxos (JSON)</h3>
              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regras de Atendimento</FormLabel>
                    <FormControl>
                      <Textarea
                        className="font-mono text-xs"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Formato JSON</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="appointmentFlow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fluxo de Agendamento</FormLabel>
                    <FormControl>
                      <Textarea
                        className="font-mono text-xs"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Formato JSON</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="forbiddenTopics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tópicos Proibidos</FormLabel>
                    <FormControl>
                      <Textarea
                        className="font-mono text-xs"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Formato JSON</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Operacional</h3>
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disponibilidade (Texto)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Seg-Sex 08:00-18:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idioma</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o idioma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (BR)</SelectItem>
                        <SelectItem value="en-US">Inglês (US)</SelectItem>
                        <SelectItem value="es-ES">Espanhol</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="autoResponsesEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Respostas Automáticas
                      </FormLabel>
                      <FormDescription>
                        Permitir que o agente responda automaticamente.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={status === "executing"}>
              {status === "executing" ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

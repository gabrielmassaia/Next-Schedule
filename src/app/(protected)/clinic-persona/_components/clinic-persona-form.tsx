"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2, Plus, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { upsertClinicSettingsAgent } from "@/actions/clinic-settings-actions";
import { Badge } from "@/components/ui/badge";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FORBIDDEN_TOPICS, GENERAL_RULES } from "@/constants/persona-options";
import {
  ClinicPersonaSchema,
  clinicPersonaSchema,
} from "@/lib/validations/clinic-settings";

interface ClinicPersonaFormProps {
  initialData?: ClinicPersonaSchema | null;
}

export function ClinicPersonaForm({ initialData }: ClinicPersonaFormProps) {
  const { execute, status } = useAction(upsertClinicSettingsAgent, {
    onSuccess: () => {
      toast.success("Configurações da persona salvas com sucesso!");
    },
    onError: (error) => {
      toast.error(
        error.error.serverError || "Erro ao salvar configurações da persona",
      );
    },
  });

  const form = useForm<ClinicPersonaSchema>({
    resolver: zodResolver(clinicPersonaSchema),
    defaultValues: initialData || {
      assistantTone: "",
      welcomeMessage: "",
      rules: [],
      appointmentFlow: [],
      forbiddenTopics: [],
      availability: "",
      autoResponsesEnabled: true,
      language: "pt-BR",
    },
  });

  const {
    fields: rulesFields,
    append: appendRule,
    remove: removeRule,
  } = useFieldArray({
    control: form.control,
    name: "rules",
  });

  const {
    fields: topicFields,
    append: appendTopic,
    remove: removeTopic,
  } = useFieldArray({
    control: form.control,
    name: "forbiddenTopics",
  });

  function onSubmit(values: ClinicPersonaSchema) {
    execute(values);
  }

  const watchedRules = form.watch("rules");
  const watchedTopics = form.watch("forbiddenTopics");

  const toggleRule = (rule: string) => {
    const index = watchedRules?.findIndex((r) => r.value === rule);
    if (index !== undefined && index !== -1) {
      removeRule(index);
    } else {
      appendRule({ value: rule });
    }
  };

  const toggleTopic = (topic: string) => {
    const index = watchedTopics?.findIndex((t) => t.value === topic);
    if (index !== undefined && index !== -1) {
      removeTopic(index);
    } else {
      appendTopic({ value: topic });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personalidade</CardTitle>
              <CardDescription>
                Defina como o assistente deve se comportar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="assistantTone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tom do Assistente</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Profissional, amigável, formal..."
                        {...field}
                      />
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
                        <SelectItem value="pt-BR">
                          Português (Brasil)
                        </SelectItem>
                        <SelectItem value="en-US">Inglês (EUA)</SelectItem>
                        <SelectItem value="es-ES">Espanhol</SelectItem>
                      </SelectContent>
                    </Select>
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
                        placeholder="Mensagem inicial enviada ao paciente..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Ajustes de disponibilidade e automação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Disponibilidade</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="text-muted-foreground h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Defina os horários em que o assistente IA poderá
                              responder aos pacientes.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input placeholder="Ex: Seg-Sex 08:00-18:00" {...field} />
                    </FormControl>
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
                        Permitir que o assistente responda automaticamente.
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
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Regras de Comportamento</CardTitle>
            <CardDescription>
              Selecione regras predefinidas ou adicione personalizadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {GENERAL_RULES.map((rule) => {
                const isSelected = watchedRules?.some((r) => r.value === rule);
                return (
                  <Badge
                    key={rule}
                    variant={isSelected ? "default" : "outline"}
                    className="hover:bg-primary/90 cursor-pointer"
                    onClick={() => toggleRule(rule)}
                  >
                    {rule}
                  </Badge>
                );
              })}
            </div>

            <div className="space-y-4">
              <div className="text-muted-foreground text-sm font-medium">
                Regras Personalizadas
              </div>
              {rulesFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`rules.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Ex: Não fornecer diagnósticos médicos..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRule(index)}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => appendRule({ value: "" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Regra Personalizada
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle>Fluxo de Agendamento</CardTitle>
            <CardDescription>
              Defina os passos que o assistente deve seguir para agendar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {flowFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`appointmentFlow.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder={`Passo ${index + 1}...`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFlow(index)}
                >
                  <Trash2 className="text-destructive h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => appendFlow({ value: "" })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Passo
            </Button>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle>Tópicos Proibidos</CardTitle>
            <CardDescription>
              Selecione tópicos predefinidos ou adicione personalizados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {FORBIDDEN_TOPICS.map((topic) => {
                const isSelected = watchedTopics?.some(
                  (t) => t.value === topic,
                );
                return (
                  <Badge
                    key={topic}
                    variant={isSelected ? "default" : "outline"}
                    className="hover:bg-primary/90 cursor-pointer"
                    onClick={() => toggleTopic(topic)}
                  >
                    {topic}
                  </Badge>
                );
              })}
            </div>

            <div className="space-y-4">
              <div className="text-muted-foreground text-sm font-medium">
                Tópicos Personalizados
              </div>
              {topicFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`forbiddenTopics.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Ex: Política, religião..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTopic(index)}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => appendTopic({ value: "" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Tópico Personalizado
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={status === "executing"}>
            {status === "executing" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Form>
  );
}

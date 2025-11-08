"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createClinicSpecialty } from "@/actions/clinic-specialties/create-clinic-specialty";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Nome é obrigatório" })
    .max(120, { message: "Nome deve ter no máximo 120 caracteres" }),
  description: z
    .string()
    .trim()
    .max(500, { message: "Descrição deve ter no máximo 500 caracteres" })
    .optional()
    .or(z.literal("")),
});

interface AddSpecialtyButtonProps {
  clinicId: string;
}

export default function AddSpecialtyButton({
  clinicId,
}: AddSpecialtyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createSpecialtyAction = useAction(createClinicSpecialty, {
    onSuccess: () => {
      toast.success("Especialidade cadastrada com sucesso");
      form.reset();
      setIsOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Não foi possível cadastrar a especialidade");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createSpecialtyAction.execute({
      clinicId,
      name: values.name,
      description: values.description?.length ? values.description : undefined,
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!createSpecialtyAction.isExecuting) {
          setIsOpen(nextOpen);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova especialidade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Nova especialidade</DialogTitle>
          <DialogDescription>
            Defina uma especialidade para organizar os serviços oferecidos pela clínica.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus disabled={createSpecialtyAction.isExecuting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[120px]"
                      placeholder="Adicione observações, diferenciais ou limitações da especialidade"
                      disabled={createSpecialtyAction.isExecuting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createSpecialtyAction.isExecuting}>
                {createSpecialtyAction.isExecuting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { deleteClinicSpecialty } from "@/actions/clinic-specialties/delete-clinic-specialty";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
interface SpecialtyCardProps {
  specialty: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
  };
  clinicId: string;
}

export default function SpecialtyCard({ specialty, clinicId }: SpecialtyCardProps) {
  const deleteSpecialtyAction = useAction(deleteClinicSpecialty, {
    onSuccess: () => {
      toast.success("Especialidade removida com sucesso");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Não foi possível remover a especialidade");
    },
  });

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-foreground">{specialty.name}</h3>
        <p className="text-sm text-muted-foreground">
          Criada em {new Date(specialty.createdAt).toLocaleDateString("pt-BR")}
        </p>
      </CardHeader>
      <Separator />
      <CardContent className="min-h-[120px]">
        <p className="text-sm text-muted-foreground">
          {specialty.description?.length
            ? specialty.description
            : "Nenhuma descrição informada para esta especialidade."}
        </p>
      </CardContent>
      <Separator />
      <CardFooter className="justify-end">
        <Button
          variant="destructive"
          size="sm"
          disabled={deleteSpecialtyAction.isExecuting}
          onClick={() =>
            deleteSpecialtyAction.execute({
              clinicId,
              specialtyId: specialty.id,
            })
          }
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remover
        </Button>
      </CardFooter>
    </Card>
  );
}

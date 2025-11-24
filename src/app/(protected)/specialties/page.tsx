import { Suspense } from "react";

import { requirePlan } from "@/_helpers/require-plan";
import { seedDefaultSpecialties } from "@/data/seed-default-specialties";

import { SpecialtiesContent } from "./_components/specialties-content";

export default async function SpecialtiesPage() {
  const { activeClinicId } = await requirePlan("essential");

  if (!activeClinicId) {
    return <div>Selecione uma clínica</div>;
  }

  // Seed default specialties on first access (idempotent)
  await seedDefaultSpecialties();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Especialidades</h1>
        <p className="text-muted-foreground">
          Gerencie as especialidades disponíveis para sua clínica
        </p>
      </div>

      <Suspense fallback={<div>Carregando...</div>}>
        <SpecialtiesContent clinicId={activeClinicId} />
      </Suspense>
    </div>
  );
}

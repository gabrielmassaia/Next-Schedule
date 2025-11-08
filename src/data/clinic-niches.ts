import { asc } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { clinicNichesTable } from "@/db/schema";

const DEFAULT_CLINIC_NICHES: Array<{
  name: string;
  description: string;
}> = [
  {
    name: "Clínica Geral",
    description: "Atendimento multiprofissional para cuidados integrados.",
  },
  {
    name: "Odontologia",
    description: "Tratamentos odontológicos, estéticos e ortodônticos.",
  },
  {
    name: "Fisioterapia",
    description: "Reabilitação, fisioterapia esportiva e terapia manual.",
  },
  {
    name: "Psicologia",
    description: "Acompanhamento psicológico e terapias comportamentais.",
  },
  {
    name: "Nutrição",
    description: "Planos alimentares personalizados e acompanhamento clínico.",
  },
  {
    name: "Estética e Bem-estar",
    description: "Procedimentos estéticos, dermatológicos e cuidados pessoais.",
  },
];

export const getClinicNiches = cache(async () => {
  const niches = await db.query.clinicNichesTable.findMany({
    orderBy: asc(clinicNichesTable.name),
  });

  if (niches.length > 0) {
    return niches;
  }

  const seeded = await db
    .insert(clinicNichesTable)
    .values(DEFAULT_CLINIC_NICHES)
    .returning();

  return seeded;
});

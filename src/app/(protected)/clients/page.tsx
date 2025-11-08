import { eq } from "drizzle-orm";

import { requirePlan } from "@/_helpers/require-plan";
import {
  PageActions,
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { clientsTable } from "@/db/schema";

import AddClientButton from "./_components/add-client-button";
import { ClientsTable } from "./_components/clients-table";

export default async function ClientsPage() {
  const { activeClinic, plan } = await requirePlan("essential");
  if (!activeClinic) {
    return null;
  }

  const clients = await db.query.clientsTable.findMany({
    where: eq(clientsTable.clinicId, activeClinic.id),
    orderBy: (clients, { desc }) => [desc(clients.createdAt)],
  });

  const maxClients = plan.limits.clientsPerClinic;
  const hasReachedLimit =
    typeof maxClients === "number" && clients.length >= maxClients;

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Clientes</PageTitle>
          <PageDescription>
            Gerencie os clientes da sua clínica
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddClientButton
            disabled={hasReachedLimit}
            helperText={
              hasReachedLimit
                ? "Limite de clientes do plano atingido. Faça upgrade para cadastrar mais."
                : undefined
            }
          />
        </PageActions>
      </PageHeader>
      <ClientsTable clients={clients} />
    </PageContainer>
  );
}

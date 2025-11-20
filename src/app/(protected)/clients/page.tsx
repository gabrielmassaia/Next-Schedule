import { and, count, desc, eq, ilike, or } from "drizzle-orm";

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

interface ClientsPageProps {
  searchParams: Promise<{
    page?: string;
    query?: string;
    status?: string;
  }>;
}

export default async function ClientsPage(props: ClientsPageProps) {
  const searchParams = await props.searchParams;
  const { activeClinic, plan } = await requirePlan("essential");
  if (!activeClinic) {
    return null;
  }

  const page = Number(searchParams.page) || 1;
  const pageSize = 30;
  const offset = (page - 1) * pageSize;
  const query = searchParams.query;
  const status = searchParams.status;

  const where = and(
    eq(clientsTable.clinicId, activeClinic.id),
    query
      ? or(
          ilike(clientsTable.name, `%${query}%`),
          ilike(clientsTable.email, `%${query}%`),
          ilike(clientsTable.phoneNumber, `%${query}%`),
        )
      : undefined,
    status && status !== "all"
      ? eq(clientsTable.status, status as "active" | "inactive")
      : undefined,
  );

  const [clients, totalCount] = await Promise.all([
    db.query.clientsTable.findMany({
      where,
      limit: pageSize,
      offset,
      orderBy: [desc(clientsTable.createdAt)],
    }),
    db
      .select({ count: count() })
      .from(clientsTable)
      .where(where)
      .then((res) => res[0].count),
  ]);

  const pageCount = Math.ceil(totalCount / pageSize);

  const maxClients = plan.limits.clientsPerClinic;
  const hasReachedLimit =
    typeof maxClients === "number" && totalCount >= maxClients;

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Clientes</PageTitle>
          <PageDescription>Gerencie os clientes da sua clínica</PageDescription>
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
      <ClientsTable clients={clients} pageCount={pageCount} />
    </PageContainer>
  );
}

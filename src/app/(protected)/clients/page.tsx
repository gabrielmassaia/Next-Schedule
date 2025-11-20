import {
  PageActions,
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";

import { getClients } from "./_actions/get-clients";
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
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query;
  const status = searchParams.status;

  const { clients, pageCount, hasReachedLimit } = await getClients({
    page,
    query,
    status,
  });

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
      <ClientsTable
        clients={clients}
        pageCount={pageCount}
        currentPage={page}
      />
    </PageContainer>
  );
}

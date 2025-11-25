"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { clientsTable } from "@/db/schema";
import { maskCPF } from "@/lib/masks";
import { cn } from "@/lib/utils";

import ClientTableActions from "./table-actions";

type Client = typeof clientsTable.$inferSelect;

export const ClientsTableColumns: ColumnDef<Client>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => {
      const isInactive = row.original.status === "inactive";
      return (
        <span className={cn(isInactive && "text-muted-foreground")}>
          {row.original.name}
        </span>
      );
    },
    filterFn: (row, id, value) => {
      return row
        .getValue<string>(id)
        .toLowerCase()
        .includes((value as string).toLowerCase());
    },
  },
  {
    id: "cpf",
    accessorKey: "cpf",
    header: "CPF",
    cell: ({ row }) => {
      const cpf = row.original.cpf;
      const isInactive = row.original.status === "inactive";

      if (!cpf) return "-";

      return (
        <span className={cn(isInactive && "text-muted-foreground")}>
          {maskCPF(cpf)}
        </span>
      );
    },
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const isInactive = row.original.status === "inactive";
      return (
        <span className={cn(isInactive && "text-muted-foreground")}>
          {row.original.email}
        </span>
      );
    },
  },
  {
    id: "phoneNumber",
    accessorKey: "phoneNumber",
    header: "Telefone",
    cell: ({ row }) => {
      const phone = row.original.phoneNumber;
      const isInactive = row.original.status === "inactive";

      if (!phone) return "-";

      return (
        <span className={cn(isInactive && "text-muted-foreground")}>
          {phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}
        </span>
      );
    },
  },
  {
    id: "sex",
    accessorKey: "sex",
    header: "Sexo",
    cell: ({ row }) => {
      const isInactive = row.original.status === "inactive";
      return (
        <span className={cn(isInactive && "text-muted-foreground")}>
          {row.original.sex === "male" ? "Masculino" : "Feminino"}
        </span>
      );
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={status === "active" ? "default" : "secondary"}>
          {status === "active" ? "Ativo" : "Inativo"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original;
      return <ClientTableActions client={client} />;
    },
  },
];

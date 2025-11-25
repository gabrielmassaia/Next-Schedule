"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  Table as TanstackTable,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { TransitionStartFunction } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filters?: React.ComponentType<{
    table: TanstackTable<TData>;
    onTransition?: TransitionStartFunction;
  }>;
  pageCount?: number;
  manualPagination?: boolean;
  rowCount?: number;
  onPageChange?: (page: number) => void;
  pageIndex?: number;
  pageSize?: number;
  onTransition?: TransitionStartFunction;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filters: FiltersComponent,
  pageCount,
  manualPagination = false,
  rowCount,
  onPageChange,
  pageIndex,
  pageSize = 30,
  onTransition,
  isLoading,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    pageCount: manualPagination ? pageCount : undefined,
    rowCount: manualPagination ? rowCount : undefined,
    manualPagination,
    state:
      manualPagination && pageIndex !== undefined
        ? {
            pagination: {
              pageIndex,
              pageSize,
            },
          }
        : undefined,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({
          pageIndex: pageIndex ?? 0,
          pageSize,
        });
        onPageChange?.(newState.pageIndex + 1);
      } else {
        onPageChange?.(updater.pageIndex + 1);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      {FiltersComponent && (
        <FiltersComponent table={table} onTransition={onTransition} />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            className={isLoading ? "pointer-events-none opacity-50" : ""}
          >
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="items-center justify-between sm:flex">
        <div className="mb-4 flex-1 text-center sm:mb-0 sm:text-start">
          <h6 className="text-sm font-medium">
            <strong>{table.getFilteredRowModel().rows.length}</strong>{" "}
            registro(s) - <strong>{table.getPageCount()}</strong> página(s)
          </h6>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (onPageChange) {
                  onPageChange(table.getState().pagination.pageIndex);
                } else {
                  table.previousPage();
                }
              }}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Página anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: table.getPageCount() }, (_, i) => i + 1)
              .filter((page) => {
                const currentPage = table.getState().pagination.pageIndex + 1;
                return (
                  page === 1 ||
                  page === table.getPageCount() ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                );
              })
              .map((page, index, array) => {
                const currentPage = table.getState().pagination.pageIndex + 1;
                const isGap = index > 0 && page - array[index - 1] > 1;
                return (
                  <React.Fragment key={page}>
                    {isGap && (
                      <span className="text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        if (onPageChange) {
                          onPageChange(page);
                        } else {
                          table.setPageIndex(page - 1);
                        }
                      }}
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                );
              })}
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (onPageChange) {
                  onPageChange(table.getState().pagination.pageIndex + 2);
                } else {
                  table.nextPage();
                }
              }}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Próxima página</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

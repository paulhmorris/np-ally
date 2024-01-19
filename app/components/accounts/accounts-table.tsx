import { Prisma } from "@prisma/client";
import { Link } from "@remix-run/react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import { DataTable } from "~/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "~/components/ui/data-table/data-table-column-header";
import { DataTablePagination } from "~/components/ui/data-table/data-table-pagination";
import { DataTableToolbar, Facet } from "~/components/ui/data-table/data-table-toolbar";
import { fuzzyFilter } from "~/lib/utils";

interface DataTableProps<TData> {
  data: Array<TData>;
}

export function AccountsTable<TData>({ data }: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState<string>("");

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: fuzzyFilter,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} facets={facets} />
      <DataTable table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}

type Account = Prisma.AccountGetPayload<{
  include: { transactionItems: true; type: true };
}>;
const columns: Array<ColumnDef<Account>> = [
  {
    accessorKey: "code",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
    cell: ({ row }) => {
      return (
        <div>
          <span className="max-w-[500px] truncate font-medium">{row.getValue("code")}</span>
        </div>
      );
    },
    enableColumnFilter: false,
  },
  {
    accessorKey: "type",
    accessorFn: (row) => `${row.type.name}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      return (
        <div className="max-w-[100px]">
          <span className="max-w-[500px] truncate font-medium">{row.getValue("type")}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => {
      return (
        <div>
          <span className="max-w-[500px] truncate font-medium">{row.getValue("description")}</span>
        </div>
      );
    },
    enableColumnFilter: false,
  },
  {
    id: "view",
    cell: ({ row }) => (
      <Link to={`/accounts/${row.original.id}`} className="font-medium text-primary">
        View
      </Link>
    ),
    enableColumnFilter: false,
  },
];

const facets: Array<Facet> = [
  {
    columnId: "type",
    title: "Type",
    options: [
      { label: "Operating", value: "Operating" },
      { label: "Benevolence", value: "Benevolence" },
      { label: "Ministry", value: "Ministry" },
    ],
  },
];

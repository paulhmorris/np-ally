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
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import * as React from "react";
dayjs.extend(utc);

import { DataTable } from "~/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "~/components/ui/data-table/data-table-column-header";
import { DataTablePagination } from "~/components/ui/data-table/data-table-pagination";
import { DataTableToolbar, Facet } from "~/components/ui/data-table/data-table-toolbar";
import { formatCentsAsDollars, fuzzyFilter } from "~/lib/utils";

interface DataTableProps<TData> {
  data: Array<TData>;
}

export function TransactionsTable<TData>({ data }: DataTableProps<TData>) {
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

type Account = Prisma.TransactionGetPayload<{
  include: {
    contact: true;
    account: true;
  };
}>;
const columns: Array<ColumnDef<Account>> = [
  {
    accessorKey: "account",
    accessorFn: (row) => `${row.account.code} - ${row.account.description}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Account" />,
    cell: ({ row }) => {
      return (
        <div className="max-w-[320px] truncate">
          <Link to={`/accounts/${row.original.accountId}`} className="font-medium text-primary">
            {row.getValue("account")}
          </Link>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => {
      return (
        <div>
          <span className="max-w-[120px] truncate font-medium">
            {dayjs(row.getValue("date")).utc().format("MM/DD/YYYY")}
          </span>
        </div>
      );
    },
    enableColumnFilter: false,
  },
  {
    accessorKey: "amountInCents",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => {
      return (
        <div className="max-w-[100px]">
          <span className="truncate font-medium tabular-nums">
            {formatCentsAsDollars(row.getValue("amountInCents"), 2)}
          </span>
        </div>
      );
    },
    enableColumnFilter: false,
  },
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => {
      return (
        <div className="max-w-[180px] truncate">
          <span className="font-medium">{row.getValue("description")}</span>
        </div>
      );
    },
    enableColumnFilter: false,
  },
  {
    accessorKey: "contact",
    accessorFn: (row) => (row.contact ? `${row.contact.firstName} ${row.contact.lastName}` : ""),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
    cell: ({ row }) => {
      return (
        <div>
          <Link to={`/contacts/${row.original.contactId}`} className="max-w-[500px] truncate font-medium text-primary">
            {row.getValue("contact")}
          </Link>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "view",
    cell: ({ row }) => (
      <Link to={`/transactions/${row.original.id}`} className="font-medium text-primary">
        View
      </Link>
    ),
    enableColumnFilter: false,
  },
];

const facets: Array<Facet> = [
  {
    columnId: "contact",
    title: "Contact",
  },
  {
    columnId: "account",
    title: "Account",
  },
];

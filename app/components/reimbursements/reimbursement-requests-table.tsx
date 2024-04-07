import { Prisma, ReimbursementRequestStatus } from "@prisma/client";
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

import { Badge } from "~/components/ui/badge";
import { DataTable } from "~/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "~/components/ui/data-table/data-table-column-header";
import { DataTablePagination } from "~/components/ui/data-table/data-table-pagination";
import { DataTableToolbar, Facet } from "~/components/ui/data-table/data-table-toolbar";
import { formatCentsAsDollars, fuzzyFilter } from "~/lib/utils";

interface DataTableProps<TData> {
  data: Array<TData>;
}

export function ReimbursementRequestsTable<TData>({ data }: DataTableProps<TData>) {
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

type ReimbRequest = Prisma.ReimbursementRequestGetPayload<{
  include: {
    account: true;
    method: true;
    user: {
      include: {
        contact: true;
      };
    };
  };
}>;
const columns: Array<ColumnDef<ReimbRequest>> = [
  {
    accessorKey: "user",
    accessorFn: (row) => `${row.user.contact.firstName} ${row.user.contact.lastName}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
    cell: ({ row }) => {
      return (
        <div>
          <span className="max-w-[500px] truncate font-medium">{row.getValue("user")}</span>
        </div>
      );
    },
    enableColumnFilter: true,
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
        <div className="max-w-[100px]">
          <span className="max-w-[500px] truncate font-medium">
            {dayjs(row.getValue("date")).utc().format("MM/DD/YYYY")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "account",
    accessorFn: (row) => `${row.account.code} - ${row.account.description}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Account" />,
    cell: ({ row }) => {
      return (
        <div className="max-w-[220px] truncate font-medium">
          <span>{row.getValue("account")}</span>
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
        <div>
          <span className="max-w-[500px] truncate font-medium">
            {formatCentsAsDollars(row.getValue("amountInCents"))}
          </span>
        </div>
      );
    },
    enableColumnFilter: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const value: ReimbursementRequestStatus = row.getValue("status");
      const variant =
        value === "APPROVED"
          ? "success"
          : value === "REJECTED"
            ? "destructive"
            : value === "VOID"
              ? "outline"
              : "secondary";
      return (
        <div>
          <Badge variant={variant}>{row.getValue("status")}</Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return value.includes(row.getValue(id));
    },
    enableColumnFilter: true,
  },
  {
    id: "action",
    header: () => <span className="sr-only">Action</span>,
    cell: ({ row }) => (
      <Link to={`/reimbursements/${row.original.id}`} className="font-medium text-primary">
        View
      </Link>
    ),
    enableColumnFilter: false,
  },
];

const facets: Array<Facet> = [
  {
    columnId: "status",
    title: "Status",
  },
  {
    columnId: "user",
    title: "User",
  },
];

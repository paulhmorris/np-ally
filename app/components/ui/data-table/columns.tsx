/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Prisma } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "~/components/ui/data-table/data-table-column-header";
import { DataTableRowActions } from "~/components/ui/data-table/data-table-row-actions";

type Contact = Prisma.ContactGetPayload<{ include: { type: true } }>;
export const columns: Array<ColumnDef<Contact>> = [
  {
    accessorKey: "firstName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="First" />,
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">{row.getValue("firstName")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last" />,
    cell: ({ row }) => {
      return (
        <div className="flex w-[100px] items-center">
          <span className="max-w-[500px] truncate font-medium">{row.getValue("lastName")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    accessorFn: (row) => `${row.type.name}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      return (
        <div className="flex w-[100px] items-center">
          <span className="max-w-[500px] truncate font-medium">{row.getValue("type")}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span className="max-w-[500px] truncate font-medium">{row.getValue("email")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span className="max-w-[500px] truncate font-medium">{row.getValue("phone")}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];

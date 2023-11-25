import type { Prisma } from "@prisma/client";
import { Link } from "@remix-run/react";
import dayjs from "dayjs";

import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { formatCurrency } from "~/lib/utils";

export function AccountsTable({ accounts }: { accounts: Array<Prisma.AccountGetPayload<{ include: { transactions: true } }>> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Balance</TableHead>
          <TableHead>Created</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((a) => {
          const balance = a.transactions.reduce((acc, t) => acc + t.amount, 0);
          return (
            <TableRow key={a.id}>
              <TableCell>{a.name}</TableCell>
              <TableCell>{formatCurrency(balance, 2)}</TableCell>
              <TableCell>{dayjs(a.createdAt).format("MM/DD/YYYY")}</TableCell>
              <TableCell>
                <Button asChild variant="link">
                  <Link to={`/accounts/${a.id}`}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

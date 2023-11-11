import type { Prisma } from "@prisma/client";
import { Link } from "@remix-run/react";
import dayjs from "dayjs";

import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { formatCurrency } from "~/utils/utils";

export function TransactionsTable({ transactions }: { transactions: Array<Prisma.TransactionGetPayload<{ include: { account: true } }>> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Account</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Description</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => {
          return (
            <TableRow key={t.id}>
              <TableCell>
                <Button asChild variant="link">
                  <Link to={`/accounts/${t.account.id}`}>{t.account.name}</Link>
                </Button>
              </TableCell>
              <TableCell>{dayjs(t.date).format("MM/DD/YYYY")}</TableCell>
              <TableCell>{formatCurrency(t.amount, 2)}</TableCell>
              <TableCell className="truncate">{t.description}</TableCell>
              <TableCell>
                <Button asChild variant="link">
                  <Link to={`/transactions/${t.id}`}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

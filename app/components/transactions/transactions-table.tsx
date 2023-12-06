import type { Transaction } from "@prisma/client";
import { Link } from "@remix-run/react";
import dayjs from "dayjs";

import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { formatCurrency } from "~/lib/utils";

export function TransactionsTable({ transactions }: { transactions: Array<Transaction> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
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
              <TableCell>{dayjs(t.date).format("MM/DD/YYYY")}</TableCell>
              <TableCell>{formatCurrency(t.amountInCents * 100, 2)}</TableCell>
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

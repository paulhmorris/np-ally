import { Prisma, UserRole } from "@prisma/client";
import dayjs from "dayjs";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { formatCentsAsDollars, useUser } from "~/lib/utils";

type ReimbursementRequest = Prisma.ReimbursementRequestGetPayload<{
  include: { user: { include: { contact: true } }; account: true };
}>;
export function ReimbursementRequestsList({ requests }: { requests: Array<ReimbursementRequest> }) {
  const user = useUser();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Reimbursement Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Submitted On</TableHead>
              {user.role !== UserRole.USER ? <TableHead>Submitted By</TableHead> : null}
              <TableHead>Account</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{dayjs(req.createdAt).format("MM/DD/YYYY h:mm a")}</TableCell>
                {user.role !== UserRole.USER ? <TableCell>{req.user.contact.email}</TableCell> : null}
                <TableCell>{req.account.code}</TableCell>
                <TableCell>{formatCentsAsDollars(req.amountInCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

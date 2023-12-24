import { Prisma, UserRole } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import dayjs from "dayjs";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { formatCentsAsDollars, useUser } from "~/lib/utils";

type ReimbursementRequest = Prisma.ReimbursementRequestGetPayload<{
  include: { user: { include: { contact: true } }; account: true };
}>;
export function ReimbursementRequestsList({ requests }: { requests: Array<ReimbursementRequest> }) {
  const user = useUser();
  const fetcher = useFetcher();
  // const [openConfirm, setOpenConfirm] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Reimbursement Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Submitted On</TableHead>
                {user.role !== UserRole.USER ? <TableHead>Submitted By</TableHead> : null}
                <TableHead>Account</TableHead>
                <TableHead>Amount</TableHead>
                {/* <TableHead>
                  <span className="sr-only">Delete</span>
                </TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{dayjs(req.createdAt).format("MM/DD/YYYY h:mm a")}</TableCell>
                  {user.role !== UserRole.USER ? <TableCell>{req.user.contact.email}</TableCell> : null}
                  <TableCell>{req.account.code}</TableCell>
                  <TableCell>{formatCentsAsDollars(req.amountInCents)}</TableCell>
                  {/* <TableCell>
                    <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
                      <DialogTrigger asChild>
                        <button type="button" className="font-medium text-primary">
                          Delete
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Are you absolutely sure?</DialogTitle>
                          <DialogDescription>
                            This will cancel your request. Any receipts uploaded will become available to use in a new
                            requeset.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:space-x-0">
                          <Button variant="outline" type="submit" onClick={() => setOpenConfirm(false)}>
                            Cancel
                          </Button>
                          <fetcher.Form method="DELETE" action="/resources/reimbursement-requests">
                            <Button variant="destructive" type="submit">
                              Confirm
                            </Button>
                          </fetcher.Form>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

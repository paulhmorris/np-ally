import type { Prisma } from "@prisma/client";
import { Link } from "@remix-run/react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { normalizeEnum } from "~/lib/utils";

export function UsersTable({ users }: { users: Array<Prisma.UserGetPayload<{ include: { contact: true } }>> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Created</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          return (
            <TableRow key={user.id}>
              <TableCell>
                <span>
                  {user.contact.firstName}
                  {user.contact.lastName ? ` ${user.contact.lastName}` : ""}
                </span>
              </TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{normalizeEnum(user.role)}</TableCell>
              <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                <Link to={`/users/${user.id}`} className="font-bold text-primary">
                  View
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

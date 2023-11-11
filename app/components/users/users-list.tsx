import type { User } from "@prisma/client";
import { Link } from "@remix-run/react";
import { IconChevronRight } from "@tabler/icons-react";

import { normalizeEnum } from "~/utils/utils";

function UsersList({ users }: { users: Array<User> }) {
  return (
    <div>
      <h2 className="mb-2">Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <UserCard {...user} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserCard(user: User) {
  return (
    <Link to={`/users/${user.id}`} className="relative flex items-center space-x-4 rounded-xl border p-4 transition-colors hover:bg-muted">
      <div className="min-w-0 flex-auto">
        <h2 className="min-w-0 text-sm font-semibold leading-6">
          <span>
            {user.firstName}
            {user.lastName ? ` ${user.lastName}` : ""}
          </span>
        </h2>
        <div className="mt-1 flex items-center gap-x-2.5 text-xs leading-5 text-muted-foreground">
          <p className="truncate">{normalizeEnum(user.role)}</p>
          <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 flex-none fill-muted-foreground">
            <circle cx={1} cy={1} r={1} />
          </svg>
          <p className="whitespace-nowrap">Created {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      <IconChevronRight className="h-5 w-5 flex-none text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}

export { UserCard, UsersList };

import { UserRole } from "@prisma/client";
import { Form, Link, NavLink } from "@remix-run/react";
import type { ComponentPropsWithoutRef } from "react";

import { ThemeModeToggle } from "~/components/theme-mode-toggle";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { cn, useUser } from "~/utils/utils";

export const links: readonly {
  name: string;
  href: string;
  access: readonly UserRole[];
}[] = [
  { name: "Accounts", href: "/accounts", access: ["ADMIN", "ACCOUNTANT", "OWNER", "SUPERADMIN"] },
  { name: "Transactions", href: "/transactions", access: ["ADMIN", "ACCOUNTANT", "OWNER", "SUPERADMIN"] },
  { name: "Donors", href: "/donors", access: ["ADMIN", "ACCOUNTANT", "OWNER", "SUPERADMIN"] },
  { name: "Reimbursements", href: "/reimbursements", access: ["ADMIN", "ACCOUNTANT", "OWNER", "SUPERADMIN"] },
  { name: "Users", href: "/users", access: ["ADMIN", "OWNER", "SUPERADMIN"] },
] as const;

export function DesktopNav(props: ComponentPropsWithoutRef<"nav">) {
  const user = useUser();

  return (
    <nav className={cn("hidden h-full shrink-0 grow-0 basis-64 flex-col space-x-2 border-r border-border bg-background px-6 py-10 sm:flex", props.className)}>
      <div className="pl-3">
        <Link to="/" className="inline-flex items-center space-x-2">
          <img src="/logo.jpg" alt="Logo" className="object-contain" />
        </Link>
      </div>
      <ul className="mt-12 space-x-0 space-y-1">
        {links
          .filter((link) => user?.role && link.access.includes(user.role))
          .map((link) => {
            return (
              <li key={link.href}>
                <NavLink to={link.href} className={({ isActive }) => cn("flex items-center rounded-md px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary", isActive && "bg-secondary")}>
                  {link.name}
                </NavLink>
              </li>
            );
          })}
      </ul>
      <Separator className="mb-8 mt-auto" />
      <div className="space-y-4">
        <Link to={`/users/${user.id}`} className="flex gap-2">
          <Avatar>
            <AvatarFallback>
              {user.firstName?.charAt(0).toUpperCase()}
              {user.lastName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium text-secondary-foreground">
              {user.firstName}
              {user.lastName ? ` ${user.lastName}` : null}
            </div>
            <div className="max-w-[150px] truncate text-xs text-muted-foreground">{user.email}</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Form method="post" action="/logout">
            <Button type="submit" variant="outline" className="sm:h-9">
              Log out
            </Button>
          </Form>
          <ThemeModeToggle />
        </div>
      </div>
    </nav>
  );
}

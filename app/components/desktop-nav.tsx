import { UserRole } from "@prisma/client";
import { Link, NavLink } from "@remix-run/react";
import { IconWorld } from "@tabler/icons-react";
import type { ComponentPropsWithoutRef } from "react";

import { GlobalLoader } from "~/components/ui/global-loader";
import { Separator } from "~/components/ui/separator";
import { UserMenu } from "~/components/user-menu";
import { adminNavLinks, globalNavLinks, superAdminNavLinks, userNavLinks } from "~/lib/constants";
import { cn, useUser } from "~/lib/utils";

export function DesktopNav(props: ComponentPropsWithoutRef<"nav">) {
  const user = useUser();

  return (
    <nav
      className={cn(
        "fixed left-0 hidden min-h-full w-64 flex-col space-x-2 border-r border-border bg-card px-6 py-10 sm:flex",
        props.className,
      )}
    >
      <div className="flex h-10 items-center pl-3">
        <Link to="/" className="inline-flex items-center space-x-2 text-sm font-bold text-primary">
          <IconWorld className="h-6 w-6" />
          <span>Alliance 436</span>
          <GlobalLoader />
        </Link>
      </div>
      <ul className="mt-12 space-x-0 space-y-1">
        <DesktopNavLink to={user.role === UserRole.USER ? "/dashboards/staff" : "/dashboards/admin"} name="Home" />
        {globalNavLinks.map((link) => (
          <DesktopNavLink key={link.href} to={link.href} name={link.name} />
        ))}
        {user.role === UserRole.USER
          ? userNavLinks.map((link) => <DesktopNavLink key={link.href} to={link.href} name={link.name} />)
          : null}
      </ul>
      {user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN ? (
        <>
          <Separator className="my-4" />
          <p className="mb-4 text-xs font-semibold tracking-widest text-muted-foreground">ADMIN</p>
          <ul className="space-x-0 space-y-1">
            {adminNavLinks.map((link) => (
              <DesktopNavLink key={link.href} to={link.href} name={link.name} />
            ))}
          </ul>
        </>
      ) : null}
      {user.role === UserRole.SUPERADMIN && superAdminNavLinks.length > 0 ? (
        <>
          <Separator className="my-4" />
          <p className="mb-4 text-xs font-semibold tracking-widest text-muted-foreground">SUPER ADMIN</p>
          <ul className="space-x-0 space-y-1">
            {superAdminNavLinks.map((link) => (
              <DesktopNavLink key={link.href} to={link.href} name={link.name} />
            ))}
          </ul>
        </>
      ) : null}
      <UserMenu />
    </nav>
  );
}

function DesktopNavLink({ to, name }: { to: string; name: string }) {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            "flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-primary/10",
            isActive && "bg-primary/10",
          )
        }
      >
        {name}
      </NavLink>
    </li>
  );
}

import { MembershipRole, UserRole } from "@prisma/client";
import { NavLink } from "@remix-run/react";
import { IconMenuDeep } from "@tabler/icons-react";
import { useState, type ComponentPropsWithoutRef } from "react";

import { ThemeModeToggle } from "~/components/theme-mode-toggle";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { UserMenu } from "~/components/user-menu";
import { adminNavLinks, globalNavLinks, superAdminNavLinks, userNavLinks } from "~/lib/constants";
import { cn, useUser } from "~/lib/utils";

export function MobileNav(props: ComponentPropsWithoutRef<"nav">) {
  const user = useUser();
  const [open, setOpen] = useState(false);

  return (
    <nav className={cn("flex items-center justify-between border-b px-6 py-4 md:hidden", props.className)}>
      <div className="flex items-center gap-4">
        <UserMenu />
        <ThemeModeToggle />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <span className="sr-only">Open Navigation Menu</span>
          <IconMenuDeep className="h-8 w-8" />
        </DialogTrigger>
        <DialogContent className="top-0 max-w-full translate-y-0">
          <DialogTitle className="sr-only">Navigation links</DialogTitle>
          <ul className="mt-6 space-x-0 space-y-1">
            <MobileNavLink
              setOpen={setOpen}
              to={user.role === MembershipRole.MEMBER ? "/dashboards/staff" : "/dashboards/admin"}
              name="Home"
            />
            {globalNavLinks.map((link) => (
              <MobileNavLink setOpen={setOpen} key={link.href} to={link.href} name={link.name} />
            ))}
            {user.role === MembershipRole.MEMBER
              ? userNavLinks.map((link) => (
                  <MobileNavLink setOpen={setOpen} key={link.href} to={link.href} name={link.name} />
                ))
              : null}
          </ul>
          {user.role === MembershipRole.ADMIN || user.systemRole === UserRole.SUPERADMIN ? (
            <>
              <Separator />
              <p className="text-sm font-semibold tracking-widest text-muted-foreground">ADMIN</p>
              <ul className="space-x-0 space-y-1">
                {adminNavLinks.map((link) => (
                  <MobileNavLink setOpen={setOpen} key={link.href} to={link.href} name={link.name} />
                ))}
              </ul>
            </>
          ) : null}
          {user.systemRole === UserRole.SUPERADMIN ? (
            <>
              <Separator />
              <p className="text-sm font-semibold tracking-widest text-muted-foreground">SUPER ADMIN</p>
              <ul className="space-x-0 space-y-1">
                {superAdminNavLinks.map((link) => (
                  <MobileNavLink setOpen={setOpen} key={link.href} to={link.href} name={link.name} />
                ))}
              </ul>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </nav>
  );
}

function MobileNavLink({ to, name, setOpen }: { to: string; name: string; setOpen: (value: boolean) => void }) {
  return (
    <li>
      <NavLink
        to={to}
        onClick={() => setOpen(false)}
        className={({ isActive }) =>
          cn(
            "flex cursor-pointer items-center rounded-md px-3 py-2 font-medium text-secondary-foreground hover:bg-primary/10",
            isActive && "bg-primary/10",
          )
        }
      >
        {name}
      </NavLink>
    </li>
  );
}

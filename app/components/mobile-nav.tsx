import { Form, Link, NavLink } from "@remix-run/react";
import { IconMenuDeep } from "@tabler/icons-react";
import { useState, type ComponentPropsWithoutRef } from "react";

import { ThemeModeToggle } from "~/components/theme-mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { navLinks } from "~/lib/constants";
import { cn, useUser } from "~/lib/utils";

export function MobileNav(props: ComponentPropsWithoutRef<"nav">) {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className={cn("flex items-center justify-between border-b px-6 py-4 sm:hidden", props.className)}>
      <Link to="/leads" className="inline-flex items-center space-x-2">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="text-2xl font-bold">CL</AvatarFallback>
        </Avatar>
      </Link>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <span className="sr-only">Open Menu</span>
          <IconMenuDeep className="h-10 w-10" />
        </DialogTrigger>
        <DialogContent className="top-0 max-w-full translate-y-0">
          <DialogTitle className="sr-only">Navigation links</DialogTitle>
          <ul className="mt-4 space-x-0 space-y-1">
            {navLinks.map((link) => {
              return (
                <li key={link.href}>
                  <NavLink
                    onClick={close}
                    to={link.href}
                    className={({ isActive }) =>
                      cn(
                        "-mx-3 flex items-center rounded-md px-3 py-2 text-base font-medium text-secondary-foreground hover:bg-secondary",
                        isActive && "bg-secondary",
                      )
                    }
                  >
                    {link.name}
                  </NavLink>
                </li>
              );
            })}
          </ul>
          <Separator />
          <div>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <Avatar>
                  <AvatarImage src="https://github.com/paulhmorris.png" alt="@paulhmorris" />
                  <AvatarFallback>
                    {user.contact.firstName?.charAt(0).toUpperCase()}
                    {user.contact.lastName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-base font-medium text-secondary-foreground">
                    {user.contact.firstName}
                    {user.contact.lastName ? ` ${user.contact.lastName}` : null}
                  </div>
                  <div className="text-sm text-muted-foreground">{user.contact.email}</div>
                </div>
              </div>
              <ThemeModeToggle />
            </div>
            <div className="mt-4 space-y-1">
              <Button variant="link" asChild className="w-min whitespace-nowrap text-base">
                <Link onClick={close} to={`/users/${user.id}`}>
                  Your profile
                </Link>
              </Button>
              <Form method="post" action="/logout">
                <Button onClick={close} type="submit" variant="link" className="w-min whitespace-nowrap text-base">
                  Log out
                </Button>
              </Form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
}

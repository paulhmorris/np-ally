import { Form, Link, NavLink, useNavigation } from "@remix-run/react";
import { IconLoader, IconWorld } from "@tabler/icons-react";
import type { ComponentPropsWithoutRef } from "react";
import { useSpinDelay } from "spin-delay";

import { ThemeModeToggle } from "~/components/theme-mode-toggle";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { navLinks } from "~/lib/constants";
import { cn, useUser } from "~/lib/utils";

export function DesktopNav(props: ComponentPropsWithoutRef<"nav">) {
  const user = useUser();
  const navigation = useNavigation();
  const showSpinner = useSpinDelay(navigation.state !== "idle");

  return (
    <nav
      className={cn(
        "hidden h-full shrink-0 grow-0 basis-64 flex-col space-x-2 border-r border-border bg-card px-6 py-10 sm:flex",
        props.className,
      )}
    >
      <div className="pl-3">
        <Link to="/" className="inline-flex items-center space-x-2 text-sm font-bold text-primary">
          <IconWorld className="h-6 w-6" />
          <span>Alliance 436</span>
          <IconLoader
            className={cn(
              showSpinner ? "animate-spin opacity-100" : "opacity-0",
              "ml-2 text-muted-foreground transition-opacity",
            )}
          />
        </Link>
      </div>
      <ul className="mt-12 space-x-0 space-y-1">
        {navLinks.map((link) => {
          return (
            <li key={link.href}>
              <NavLink
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary",
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
      {["ADMIN", "SUPERADMIN"].includes(user.role) ? (
        <>
          <Separator className="mb-4 mt-8" />
          <p className="mb-4 text-xs font-semibold tracking-widest text-muted-foreground">ADMIN</p>
          <NavLink
            to="/accounts"
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary",
                isActive && "bg-secondary",
              )
            }
          >
            <span>Accounts</span>
          </NavLink>
        </>
      ) : null}
      <div className="mt-auto space-y-4">
        <Link to={`/users/${user.id}`} className="flex gap-2">
          <Avatar>
            <AvatarFallback className="bg-primary text-white">
              {user.contact.firstName?.charAt(0).toUpperCase()}
              {user.contact.lastName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium text-secondary-foreground">
              {user.contact.firstName}
              {user.contact.lastName ? ` ${user.contact.lastName}` : null}
            </div>
            <div className="max-w-[150px] truncate text-xs text-muted-foreground">{user.contact.email}</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Form method="post" action="/logout" navigate={false}>
            <Button type="submit" variant="outline">
              Log out
            </Button>
          </Form>
          <ThemeModeToggle />
        </div>
      </div>
    </nav>
  );
}

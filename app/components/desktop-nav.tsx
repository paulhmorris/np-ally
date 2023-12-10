import { Form, Link, NavLink, useNavigation } from "@remix-run/react";
import { IconLoader, IconMoon, IconSun, IconWorld } from "@tabler/icons-react";
import type { ComponentPropsWithoutRef } from "react";
import { Theme, useTheme } from "remix-themes";
import { useSpinDelay } from "spin-delay";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import { adminNavLinks, userNavLinks } from "~/lib/constants";
import { cn, useUser } from "~/lib/utils";

export function DesktopNav(props: ComponentPropsWithoutRef<"nav">) {
  const user = useUser();
  const navigation = useNavigation();
  const showSpinner = useSpinDelay(navigation.state !== "idle");
  const [_, setTheme] = useTheme();

  function handleToggleTheme(e: Event) {
    e.preventDefault();
    setTheme((theme) => (theme === Theme.DARK ? Theme.LIGHT : Theme.DARK));
  }

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
        {userNavLinks.map((link) => {
          return (
            <li key={link.href}>
              <NavLink
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-primary/10",
                    isActive && "bg-primary/10",
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
          <ul className="space-x-0 space-y-1">
            {adminNavLinks.map((link) => {
              return (
                <li key={link.href}>
                  <NavLink
                    to={link.href}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-primary/10",
                        isActive && "bg-primary/10",
                      )
                    }
                  >
                    {link.name}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative mt-auto h-10 w-10 rounded-full">
            <Avatar>
              <AvatarFallback className="bg-primary text-white">
                {user.contact.firstName?.charAt(0).toUpperCase()}
                {user.contact.lastName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mb-2 w-48" align="start" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.contact.firstName}
                {user.contact.lastName ? ` ${user.contact.lastName}` : null}
              </p>
              <p className="text-xs leading-none text-muted-foreground">{user.contact.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to={`/users/${user.id}`}>Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleToggleTheme}>
              <span>Toggle theme</span>
              <IconSun className="absolute right-2 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <IconMoon className="absolute right-2 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Form method="post" action="/logout" navigate={false}>
              <button>Log out</button>
            </Form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

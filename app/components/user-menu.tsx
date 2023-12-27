import { Form, Link } from "@remix-run/react";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { Theme, useTheme } from "remix-themes";

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
import { useUser } from "~/lib/utils";

export function UserMenu() {
  const user = useUser();
  const [_, setTheme] = useTheme();

  function handleToggleTheme(e: Event) {
    e.preventDefault();
    setTheme((theme) => (theme === Theme.DARK ? Theme.LIGHT : Theme.DARK));
  }

  return (
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
            <Link className="cursor-pointer" to={`/users/${user.id}`}>
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link className="cursor-pointer" to="/feature-request">
              Feature Request
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onSelect={handleToggleTheme}>
            <span>Toggle theme</span>
            <IconSun className="absolute right-2 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <IconMoon className="absolute right-2 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="px-0 py-0">
          <Form className="w-full" method="post" action="/logout" navigate={false}>
            <button className="w-full px-2 py-1.5 text-left">Log out</button>
          </Form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

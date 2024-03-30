import { Form, Link } from "@remix-run/react";
import { IconArrowRight } from "@tabler/icons-react";
import { useState } from "react";

import { NewInquiryModal } from "~/components/modals/inquiry-modal";
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
import { useUser } from "~/hooks/useUser";

export function UserMenu() {
  const user = useUser();
  const [inquiryOpen, setInquiryOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative mt-auto h-10 w-10 rounded-full">
            <span className="sr-only">Open User Menu</span>
            <Avatar aria-hidden="true">
              <AvatarFallback className="bg-primary text-white dark:text-black" aria-hidden="true">
                <span>
                  {user.contact.firstName?.charAt(0).toUpperCase()}
                  {user.contact.lastName?.charAt(0).toUpperCase()}
                </span>
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mb-2 w-48" align="start" forceMount>
          <DropdownMenuLabel>
            <p className="text-xs font-medium leading-none text-muted-foreground">{user.org?.name}</p>
          </DropdownMenuLabel>
          {user.memberships.length > 1 ? (
            <>
              <DropdownMenuItem asChild className="py-0.5">
                <Link className="flex cursor-pointer items-center justify-between gap-2" to="/choose-org">
                  <span>Change Org</span>
                  <IconArrowRight className="size-4" />
                </Link>
              </DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2 sm:space-y-0">
              <p className="text-base font-medium leading-none sm:text-sm">
                {user.contact.firstName}
                {user.contact.lastName ? ` ${user.contact.lastName}` : null}
              </p>
              <p className="text-sm leading-none text-muted-foreground sm:text-xs">{user.contact.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link className="cursor-pointer sm:hidden" to={user.isMember ? "/dashboards/staff" : "/dashboards/admin"}>
                Home
              </Link>
            </DropdownMenuItem>
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
            <DropdownMenuItem className="cursor-pointer" onClick={() => setInquiryOpen(true)}>
              New Inquiry
            </DropdownMenuItem>
            {/* <DropdownMenuItem className="cursor-pointer" onSelect={handleToggleTheme}>
            <span>Toggle theme</span>
            <IconSun className="absolute right-2 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <IconMoon className="absolute right-2 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </DropdownMenuItem> */}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="px-0 py-0">
            <Form className="w-full" method="post" action="/logout" navigate={false}>
              <button className="w-full px-2 py-1.5 text-left">Log out</button>
            </Form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NewInquiryModal open={inquiryOpen} onOpenChange={setInquiryOpen} />
    </>
  );
}

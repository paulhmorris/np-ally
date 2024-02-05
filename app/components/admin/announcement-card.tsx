import { Announcement, UserRole } from "@prisma/client";
import { IconBellFilled, IconSelector } from "@tabler/icons-react";
import dayjs from "dayjs";

import { Button } from "~/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { useUser } from "~/lib/utils";

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const user = useUser();

  return (
    <Collapsible
      defaultOpen={true}
      className="flex flex-col items-start rounded-md border border-primary/50 bg-primary/5 p-3 text-sm text-foreground"
    >
      <div className="mb-3 flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="sr-only">An announcement from your administration.</span>
          <IconBellFilled className="size-6 text-primary" />
          {user.role !== UserRole.USER ? (
            <span className="text- text-muted-foreground">
              expires {dayjs(announcement.expiresAt).format("MM/DD/YY h:mm a")}
            </span>
          ) : null}
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon">
            <IconSelector className="size-6" />
            <span className="sr-only">Toggle content</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <span className="mb-1 block text-lg font-bold">{announcement.title}</span>
      <CollapsibleContent>{announcement.content}</CollapsibleContent>
    </Collapsible>
  );
}

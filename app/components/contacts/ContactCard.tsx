import { Prisma } from "@prisma/client";
import { Link } from "@remix-run/react";
import { IconAddressBook, IconMail, IconPhone } from "@tabler/icons-react";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { getInitials } from "~/lib/utils";

type Contact = Prisma.ContactGetPayload<{ include: { address: true; type: true } }>;
export function ContactCard({ contact }: { contact: Contact }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>
            {contact.firstName} {contact.lastName}
          </CardTitle>
          <CardDescription>{contact.type.name}</CardDescription>
        </div>
        <Avatar className="ml-auto">
          <AvatarFallback>{getInitials(contact)}</AvatarFallback>
        </Avatar>
      </CardHeader>
      <CardContent>
        <dl className="space-y-6 text-sm">
          {contact.address ? (
            <div className="flex items-center gap-4">
              <>
                <dt className="self-start">
                  <span className="sr-only">Address</span>
                  <IconAddressBook className="h-5 w-5" />
                </dt>
                <dd>
                  <span className="block">
                    {contact.address.street}
                    {contact.address.street2}
                  </span>
                  <span className="block">
                    {contact.address.city}, {contact.address.state} {contact.address.zip}
                  </span>
                </dd>
              </>
            </div>
          ) : null}
          {contact.phone ? (
            <div className="flex items-center gap-4">
              <dt>
                <span className="sr-only">Phone</span>
                <IconPhone className="h-5 w-5" />
              </dt>
              <dd>
                <a href={`tel:${contact.phone}`}>{contact.phone}</a>
              </dd>
            </div>
          ) : null}
          <div className="flex items-center gap-4">
            <dt>
              <span className="sr-only">Email</span>
              <IconMail className="h-5 w-5" />
            </dt>
            <dd>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter>
        {!contact.userId ? (
          <Button variant="outline" className="ml-auto" asChild>
            <Link to={`/contacts/${contact.id}/edit`}>Edit</Link>
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

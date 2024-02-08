import { Link } from "@remix-run/react";
import { IconBuildingBank } from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { formatCentsAsDollars } from "~/lib/utils";

export function AccountBalanceCard({
  totalCents,
  accountId,
  code,
  title = "Account Balance",
}: {
  totalCents: number | null;
  accountId: string | null;
  code?: string;
  title?: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-start gap-2">
          <div>
            <IconBuildingBank className="h-6 w-6" />
          </div>
          <span>{title}</span>
        </CardTitle>
        {code ? <CardDescription>{code}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold">{formatCentsAsDollars(totalCents)}</p>
      </CardContent>
      {accountId ? (
        <CardFooter>
          <Button variant="outline" asChild className="ml-auto">
            <Link to={`/accounts/${accountId}`}>View</Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

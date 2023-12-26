import { IconBuildingBank } from "@tabler/icons-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { formatCentsAsDollars } from "~/lib/utils";

export function AccountBalanceCard({ totalCents, code }: { totalCents: number | null; code?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBuildingBank className="h-6 w-6" />
          <span>Account Balance</span>
        </CardTitle>
        {code ? <CardDescription>{code}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold">{formatCentsAsDollars(totalCents)}</p>
      </CardContent>
    </Card>
  );
}

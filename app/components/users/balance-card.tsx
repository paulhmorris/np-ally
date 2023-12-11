import { IconBuildingBank } from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function AccountBalanceCard({ total }: { total: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBuildingBank className="h-6 w-6" />
          <span>Account Balance</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold">{total}</p>
      </CardContent>
    </Card>
  );
}

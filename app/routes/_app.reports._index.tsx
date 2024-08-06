import { Link, MetaFunction } from "@remix-run/react";
import { IconCloudDownload } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import { useIsClient } from "usehooks-ts";

import { PageHeader } from "~/components/common/page-header";
import { PageContainer } from "~/components/page-container";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export const meta: MetaFunction = () => {
  return [{ title: "Reports" }];
};

export default function AdminReports() {
  const isClient = useIsClient();
  const [startDate, setStartDate] = useState(dayjs().subtract(3, "month").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const url = isClient ? new URL("/api/reports/transactions", window?.location.origin) : undefined;
  if (url) {
    url.searchParams.append("startDate", startDate);
    url.searchParams.append("endDate", endDate);
    url.searchParams.append("tzOffset", dayjs().utcOffset().toString());
  }

  return (
    <>
      <PageHeader title="Reports" />
      <p className="mt-2 text-sm text-muted-foreground">Generate reports for your organization.</p>
      <PageContainer>
        <h2 className="mb-2 font-bold">Transactions Report</h2>
        <div className="max-w-xs space-y-2">
          <div className="space-y-1">
            <Label htmlFor="startDate">Start Date</Label>
            <span className="ml-1 text-destructive">*</span>
            <Input
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              name="startDate"
              type="date"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endDate">End Date</Label>
            <span className="ml-1 text-destructive">*</span>
            <Input
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              name="endDate"
              type="date"
            />
          </div>
          {isClient ? (
            <Button asChild>
              <Link reloadDocument to={url ? url.toString() : ""} className="flex items-center gap-2">
                <IconCloudDownload className="size-4" />
                <span>Download</span>
              </Link>
            </Button>
          ) : null}
        </div>
      </PageContainer>
    </>
  );
}

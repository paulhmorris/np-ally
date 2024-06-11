import { Prisma } from "@prisma/client";
import { IconReceipt2 } from "@tabler/icons-react";
import dayjs from "dayjs";

import { FileUploader } from "~/components/common/file-uploader";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { useUser } from "~/hooks/useUser";

export function ReceiptSelector({
  receipts,
}: {
  receipts: Array<
    Prisma.ReceiptGetPayload<{
      include: {
        user: {
          select: {
            contact: {
              select: { email: true };
            };
          };
        };
      };
    }>
  >;
}) {
  const user = useUser();
  return (
    <div className="space-y-2">
      <FileUploader />
      <fieldset>
        {receipts.length > 0 ? <legend className="mb-2 text-sm font-medium">Attach Files</legend> : null}
        <div className="flex flex-col gap-y-4 sm:gap-2.5">
          {receipts.length > 0 ? (
            receipts.map((r) => {
              return (
                <Label key={r.id} className="inline-flex cursor-pointer flex-wrap items-center gap-1.5 font-normal">
                  <Checkbox name="receiptIds" value={r.id} aria-label={r.title} defaultChecked={false} />
                  <span>{r.title}</span>
                  <span className="ml-6 text-xs text-muted-foreground sm:ml-auto">
                    {dayjs(r.createdAt).format("M/D/YY h:mma")}
                  </span>
                  {!user.isMember ? (
                    <span className="text-xs text-muted-foreground">by {r.user.contact.email}</span>
                  ) : null}
                </Label>
              );
            })
          ) : (
            <div className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm text-muted-foreground">
              <IconReceipt2 className="size-5" />
              <p>Upload receipts to get started.</p>
            </div>
          )}
        </div>
      </fieldset>
    </div>
  );
}
